const Redis = require('ioredis');
const { nanoid } = require('nanoid');

// Get Redis URL from environment
const redisUrl = process.env.UPSTASH_REDIS_REST_REDIS_URL
    || process.env.REDIS_URL
    || process.env.KV_URL;

// Create Redis client (lazy initialization)
let redis = null;
function getRedis() {
    if (!redis && redisUrl) {
        redis = new Redis(redisUrl);
    }
    return redis;
}

module.exports = async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只支持 POST 请求' });
    }

    // Check if Redis is configured
    if (!redisUrl) {
        return res.status(500).json({ error: '数据库未配置' });
    }

    try {
        const { url } = req.body;

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

        // Generate short ID (7 characters)
        const id = nanoid(7);

        // Store in Redis (expire in 1 year = 31536000 seconds)
        const client = getRedis();
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
