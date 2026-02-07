const Redis = require('ioredis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');

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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '请提供有效的邮箱地址' });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ error: '密码至少需要6个字符' });
        }

        const client = getRedis();
        if (!client) {
            return res.status(500).json({ error: '数据库未配置' });
        }

        // Check if email already exists
        const existingUserId = await client.get(`email:${email.toLowerCase()}`);
        if (existingUserId) {
            return res.status(400).json({ error: '该邮箱已被注册' });
        }

        // Create user
        const userId = nanoid(12);
        const passwordHash = await bcrypt.hash(password, 10);
        const userData = {
            id: userId,
            email: email.toLowerCase(),
            createdAt: Date.now()
        };

        // Store user data
        await client.set(`user:${userId}`, JSON.stringify(userData));
        await client.set(`email:${email.toLowerCase()}`, userId);
        await client.set(`pwd:${userId}`, passwordHash);

        // Generate JWT token
        const token = jwt.sign({ userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });

        // Set cookie
        res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`);

        return res.status(200).json({
            success: true,
            user: { id: userId, email: email.toLowerCase() }
        });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: '服务器错误' });
    }
};
