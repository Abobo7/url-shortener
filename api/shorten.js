import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';

// Initialize Upstash Redis client
// Support multiple environment variable naming conventions
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL
        || process.env.KV_REST_API_URL
        || process.env.REDIS_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
        || process.env.KV_REST_API_TOKEN
        || process.env.REDIS_TOKEN,
});

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只支持 POST 请求' });
    }

    // Check if Redis is configured
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
        || process.env.KV_REST_API_URL
        || process.env.REDIS_URL;

    if (!redisUrl) {
        console.error('Redis not configured. Available env vars:', Object.keys(process.env).filter(k => k.includes('REDIS') || k.includes('KV') || k.includes('UPSTASH')));
        return res.status(500).json({
            error: '数据库未配置，请联系管理员',
            hint: '请在 Vercel 中连接 Upstash Redis 数据库'
        });
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

        // Store in Upstash Redis (expire in 1 year)
        await redis.set(`url:${id}`, url, { ex: 60 * 60 * 24 * 365 });

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
}
