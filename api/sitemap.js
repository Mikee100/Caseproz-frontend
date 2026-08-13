export default async function handler(req, res) {
    const apiBase = (process.env.VITE_API_URL || process.env.API_URL || '').replace(/\/$/, '');

    if (!apiBase) {
        res.status(503).setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('API URL not configured');
        return;
    }

    try {
        const upstream = await fetch(`${apiBase}/sitemap.xml`, {
            headers: { Accept: 'application/xml, text/xml, */*' },
        });
        const body = await upstream.text();

        res.status(upstream.ok ? 200 : upstream.status);
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.end(body);
    } catch {
        res.status(502).setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Failed to fetch sitemap');
    }
}
