const Redis = require('ioredis');
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

// Get current user from token
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
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只支持 POST 请求' });
    }

    if (!redisUrl) {
        return res.status(500).json({ error: '数据库未配置' });
    }

    try {
        const { url, customId } = req.body;

        // Validate URL
        if (!url) {
            return res.status(400).json({ error: '请提供有效的 URL' });
        }

        // Check if URL is valid
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                throw new Error('Invalid protocol');
            }
        } catch {
            return res.status(400).json({ error: '请提供有效的 HTTP/HTTPS 链接' });
        }

        const client = getRedis();
        let id;

        // Handle custom ID
        if (customId) {
            // Custom ID requires login
            const user = getCurrentUser(req);
            if (!user) {
                return res.status(401).json({ error: '自定义短链接需要登录' });
            }

            // Validate custom ID format (alphanumeric, 3-20 chars)
            if (!/^[a-zA-Z0-9_-]{3,20}$/.test(customId)) {
                return res.status(400).json({ error: '自定义后缀需要 3-20 个字符，只能包含字母、数字、下划线和连字符' });
            }

            // Check if custom ID already exists
            const existingUrl = await client.get(`url:${customId}`);
            if (existingUrl) {
                return res.status(400).json({ error: '该自定义后缀已被使用' });
            }

            id = customId;

            // Store user's link
            await client.lpush(`userLinks:${user.userId}`, id);
        } else {
            // Generate random ID
            id = nanoid(7);
        }

        // Store in Redis (expire in 1 year)
        await client.set(`url:${id}`, url, 'EX', 31536000);

        // Generate short URL
        const host = req.headers.host;
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const shortUrl = `${protocol}://${host}/${id}`;

        return res.status(200).json({
            success: true,
            shortUrl,
            id,
            originalUrl: url,
        });

    } catch (error) {
        console.error('Error creating short URL:', error);
        return res.status(500).json({ error: '服务器错误，请稍后重试' });
    }
};
