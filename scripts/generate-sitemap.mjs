import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const outputPath = join(publicDir, 'sitemap.xml');
const fallbackPath = join(publicDir, 'sitemap.fallback.xml');

const apiUrl = (process.env.VITE_API_URL || process.env.API_URL || '').replace(/\/$/, '');

const writeSitemap = (xml) => {
    writeFileSync(outputPath, xml, 'utf8');
    console.log(`Wrote sitemap to ${outputPath}`);
};

const loadFallback = () => {
    if (existsSync(fallbackPath)) {
        return readFileSync(fallbackPath, 'utf8');
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.caseproz.co.ke/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
};

const generate = async () => {
    if (!apiUrl) {
        console.warn('VITE_API_URL not set — using fallback sitemap.');
        writeSitemap(loadFallback());
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/sitemap.xml`, {
            headers: { Accept: 'application/xml, text/xml, */*' },
        });

        if (!response.ok) {
            throw new Error(`Upstream returned ${response.status}`);
        }

        const xml = await response.text();
        if (!xml.includes('<urlset')) {
            throw new Error('Invalid sitemap payload');
        }

        writeSitemap(xml);
    } catch (error) {
        console.warn(`Sitemap fetch failed (${error.message}) — using fallback.`);
        writeSitemap(loadFallback());
    }
};

await generate();
