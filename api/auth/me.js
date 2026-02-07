const Redis = require('ioredis');
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

// Parse cookies from header
function parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = value;
        });
    }
    return cookies;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '只支持 GET 请求' });
    }

    try {
        // Get token from cookie
        const cookies = parseCookies(req.headers.cookie);
        const token = cookies.token;

        if (!token) {
            return res.status(200).json({ user: null });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            return res.status(200).json({ user: null });
        }

        const client = getRedis();
        if (!client) {
            return res.status(200).json({ user: null });
        }

        // Get user data
        const userDataStr = await client.get(`user:${decoded.userId}`);
        if (!userDataStr) {
            return res.status(200).json({ user: null });
        }

        const userData = JSON.parse(userDataStr);

        return res.status(200).json({
            user: { id: userData.id, email: userData.email }
        });

    } catch (error) {
        console.error('Me error:', error);
        return res.status(200).json({ user: null });
    }
};
