import { Redis } from '@upstash/redis';

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
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '只支持 GET 请求' });
    }

    const { id } = req.query;

    if (!id) {
        return res.redirect(302, '/');
    }

    try {
        // Get original URL from Upstash Redis
        const url = await redis.get(`url:${id}`);

        if (!url) {
            // Short URL not found, redirect to home
            return res.redirect(302, '/?error=not_found');
        }

        // Redirect to original URL with 301 (permanent redirect)
        return res.redirect(301, url);

    } catch (error) {
        console.error('Error redirecting:', error);
        return res.redirect(302, '/?error=server_error');
    }
}
