import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只支持 POST 请求' });
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

        // Store in Vercel KV
        await kv.set(`url:${id}`, url, { ex: 60 * 60 * 24 * 365 }); // Expire in 1 year

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
