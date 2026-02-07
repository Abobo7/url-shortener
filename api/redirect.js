import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '只支持 GET 请求' });
    }

    const { id } = req.query;

    if (!id) {
        return res.redirect(302, '/');
    }

    try {
        // Get original URL from Vercel KV
        const url = await kv.get(`url:${id}`);

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
