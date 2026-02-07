const Redis = require('ioredis');

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
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '只支持 GET 请求' });
    }

    const { id } = req.query;

    if (!id) {
        return res.redirect(302, '/');
    }

    try {
        const client = getRedis();
        if (!client) {
            return res.redirect(302, '/?error=db_not_configured');
        }

        // Get original URL from Redis
        const url = await client.get(`url:${id}`);

        if (!url) {
            return res.redirect(302, '/?error=not_found');
        }

        // Redirect to original URL with 301 (permanent redirect)
        return res.redirect(301, url);

    } catch (error) {
        console.error('Error redirecting:', error);
        return res.redirect(302, '/?error=server_error');
    }
};
