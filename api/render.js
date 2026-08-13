import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPrerenderedPage } from '../shared/prerender.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');

export default async function handler(req, res) {
    const route = req.query.route;
    const slug = req.query.slug;
    const name = req.query.name;

    if (!route || !['product', 'category', 'brand'].includes(route)) {
        res.status(400).setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Invalid prerender route');
        return;
    }

    try {
        const html = await renderPrerenderedPage({
            route,
            slug,
            name,
            fs,
            path,
            cwd: frontendRoot,
        });

        res.status(200);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
        res.end(html);
    } catch (error) {
        console.error('Prerender failed:', error);
        res.status(500).setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Failed to prerender page');
    }
}
