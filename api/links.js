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

// Parse cookies
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

// Get current user
function getCurrentUser(req) {
    try {
        const cookies = parseCookies(req.headers.cookie);
        const token = cookies.token;
        if (!token) return null;
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '只支持 GET 请求' });
    }

    const user = getCurrentUser(req);
    if (!user) {
        return res.status(401).json({ error: '请先登录' });
    }

    try {
        const client = getRedis();
        if (!client) {
            return res.status(500).json({ error: '数据库未配置' });
        }

        // Get user's link IDs
        const linkIds = await client.lrange(`userLinks:${user.userId}`, 0, -1);

        // Get link details
        const links = [];
        for (const id of linkIds) {
            const originalUrl = await client.get(`url:${id}`);
            if (originalUrl) {
                const host = req.headers.host;
                const protocol = host.includes('localhost') ? 'http' : 'https';
                links.push({
                    id,
                    shortUrl: `${protocol}://${host}/${id}`,
                    originalUrl
                });
            }
        }

        return res.status(200).json({ links });

    } catch (error) {
        console.error('Error getting links:', error);
        return res.status(500).json({ error: '服务器错误' });
    }
};
