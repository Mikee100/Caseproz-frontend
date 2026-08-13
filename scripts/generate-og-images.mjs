import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const pages = [
    {
        filename: 'og-default.png',
        title: 'CaseProz Kenya',
        subtitle: 'Phone cases, chargers & accessories',
    },
    {
        filename: 'og-contact.png',
        title: 'Contact CaseProz',
        subtitle: 'Support, sales & bulk orders',
    },
    {
        filename: 'og-delivery.png',
        title: 'Delivery Information',
        subtitle: 'Fast shipping across Kenya',
    },
    {
        filename: 'og-returns.png',
        title: 'Returns & Refunds',
        subtitle: 'Easy returns policy',
    },
    {
        filename: 'og-faq.png',
        title: 'FAQs',
        subtitle: 'Answers about orders & delivery',
    },
];

const escapeXml = (value) =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const buildSvg = ({ title, subtitle }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E41E26"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="64" y="64" width="96" height="96" rx="20" fill="#ffffff" opacity="0.12"/>
  <text x="96" y="320" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700">${escapeXml(title)}</text>
  <text x="96" y="390" fill="#f3f4f6" font-family="Arial, Helvetica, sans-serif" font-size="36">${escapeXml(subtitle)}</text>
  <text x="96" y="540" fill="#fca5a5" font-family="Arial, Helvetica, sans-serif" font-size="28">www.caseproz.co.ke</text>
</svg>`;

const generate = async () => {
    mkdirSync(publicDir, { recursive: true });

    let sharp;
    try {
        sharp = (await import('sharp')).default;
    } catch {
        console.warn('sharp not installed — writing SVG fallbacks for OG images.');
        for (const page of pages) {
            const svgPath = join(publicDir, page.filename.replace('.png', '.svg'));
            writeFileSync(svgPath, buildSvg(page), 'utf8');
            console.log(`Wrote ${svgPath}`);
        }
        return;
    }

    for (const page of pages) {
        const outputPath = join(publicDir, page.filename);
        await sharp(Buffer.from(buildSvg(page))).png().toFile(outputPath);
        console.log(`Wrote ${outputPath}`);
    }
};

await generate();
