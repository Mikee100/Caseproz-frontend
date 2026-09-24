import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const logoPath = join(publicDir, 'WhatsApp Image 2026-04-15 at 4.49.39 PM.jpeg');

const pages = [
    { filename: 'og-default.png' },
    { filename: 'og-contact.png' },
    { filename: 'og-delivery.png' },
    { filename: 'og-returns.png' },
    { filename: 'og-faq.png' },
];

const generate = async () => {
    mkdirSync(publicDir, { recursive: true });

    let sharp;
    try {
        sharp = (await import('sharp')).default;
    } catch {
        console.warn('sharp not installed — cannot generate PNG OG logo images.');
        return;
    }

    const logoBuffer = await sharp(logoPath)
        .resize({ width: 1100, height: 520, fit: 'contain', background: '#ffffff' })
        .png()
        .toBuffer();

    for (const page of pages) {
        const outputPath = join(publicDir, page.filename);
        await sharp({
            create: {
                width: 1200,
                height: 630,
                channels: 4,
                background: '#ffffff',
            },
        })
            .composite([{ input: logoBuffer, left: 50, top: 55 }])
            .png()
            .toFile(outputPath);
        console.log(`Wrote ${outputPath}`);
    }
};

await generate();
