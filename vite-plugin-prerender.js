import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPrerenderedPage } from './shared/prerender.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = __dirname;

const PRERENDER_PREFIXES = ['/product/', '/category/', '/brand/'];

const matchPrerenderRoute = (urlPath) => {
    if (urlPath.startsWith('/product/')) {
        const slug = decodeURIComponent(urlPath.slice('/product/'.length).split(/[?#]/)[0]);
        return slug ? { route: 'product', slug, name: slug } : null;
    }

    if (urlPath.startsWith('/category/')) {
        const name = decodeURIComponent(urlPath.slice('/category/'.length).split(/[?#]/)[0]);
        return name ? { route: 'category', slug: name, name } : null;
    }

    if (urlPath.startsWith('/brand/')) {
        const name = decodeURIComponent(urlPath.slice('/brand/'.length).split(/[?#]/)[0]);
        return name ? { route: 'brand', slug: name, name } : null;
    }

    return null;
};

const shouldPrerender = (urlPath) => PRERENDER_PREFIXES.some((prefix) => urlPath.startsWith(prefix));

export const prerenderDevPlugin = () => ({
    name: 'caseproz-prerender-dev',
    configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                next();
                return;
            }

            const urlPath = (req.url || '/').split('?')[0];
            if (!shouldPrerender(urlPath)) {
                next();
                return;
            }

            const routeInfo = matchPrerenderRoute(urlPath);
            if (!routeInfo) {
                next();
                return;
            }

            try {
                const html = await renderPrerenderedPage({
                    ...routeInfo,
                    fs,
                    path,
                    cwd: frontendRoot,
                });

                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end(html);
            } catch (error) {
                console.warn('[prerender-dev] fallback to SPA:', error.message);
                next();
            }
        });
    },
});
