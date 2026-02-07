const Redis = require('ioredis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Redis connection
const redisUrl = process.env.UPSTASH_REDIS_REST_REDIS_URL
    || process.env.REDIS_URL
    || process.env.KV_URL;

let redis = null;
function getRedis() {
    if (!redis && redisUrl) {
        redis = new Redis(redisUrl);
    }
    return redis;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只支持 POST 请求' });
    }

    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: '请提供邮箱和密码' });
        }

        const client = getRedis();
        if (!client) {
            return res.status(500).json({ error: '数据库未配置' });
        }

        // Find user by email
        const userId = await client.get(`email:${email.toLowerCase()}`);
        if (!userId) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        // Verify password
        const passwordHash = await client.get(`pwd:${userId}`);
        const isValid = await bcrypt.compare(password, passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        // Get user data
        const userDataStr = await client.get(`user:${userId}`);
        const userData = JSON.parse(userDataStr);

        // Generate JWT token
        const token = jwt.sign({ userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });

        // Set cookie
        res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`);

        return res.status(200).json({
            success: true,
            user: { id: userId, email: userData.email }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: '服务器错误' });
    }
};
