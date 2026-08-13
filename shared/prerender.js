export const SITE_URL = 'https://www.caseproz.co.ke';
export const SITE_NAME = 'CaseProz Kenya';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
export const SUPPORT_EMAIL = 'support@caseproz.co.ke';
export const SUPPORT_PHONE = '+254794057030';

export const SOCIAL_PROFILES = [
    'https://www.facebook.com/caseproz',
    'https://www.instagram.com/caseproz',
    'https://twitter.com/caseproz',
];

export const slugify = (value = '') =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const formatSlugTitle = (slug) => {
    if (!slug) return '';
    return decodeURIComponent(slug)
        .replace(/-/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const formatBrandName = (slug) => {
    if (!slug) return 'Brand';
    return formatSlugTitle(decodeURIComponent(slug).replace(/-/g, ' '));
};

export const absoluteUrl = (path = '/') => {
    if (!path) return SITE_URL;
    if (path.startsWith('http')) return path;
    return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const resolveOgImage = (image) => {
    if (!image) return DEFAULT_OG_IMAGE;
    if (image.startsWith('http')) return image;
    return absoluteUrl(image.startsWith('/') ? image : `/${image}`);
};

export const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

export const getApiBaseUrl = () =>
    (process.env.VITE_API_URL || process.env.API_URL || '').replace(/\/$/, '');

const getFirstVariant = (product) => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    return variants.find((variant) => variant.stock > 0) || variants[0] || null;
};

export const getEffectivePrice = (product) => {
    const variant = getFirstVariant(product);
    return variant?.price ?? product?.price ?? 0;
};

export const getEffectiveStock = (product) => {
    const variant = getFirstVariant(product);
    return variant?.stock ?? product?.stock ?? 0;
};

export const buildProductSeo = (product, slugFallback = '') => {
    const slug = product?.slug || slugFallback;
    const effectivePrice = getEffectivePrice(product);
    const effectiveStock = getEffectiveStock(product);
    const hasDiscount =
        typeof product?.originalPrice === 'number' && product.originalPrice > effectivePrice;
    const discountPercent = hasDiscount
        ? Math.round(((product.originalPrice - effectivePrice) / product.originalPrice) * 100)
        : null;

    const title =
        product?.metaTitle?.trim?.() ||
        (product?.name ? `${product.name} | CaseProz Kenya` : `${formatSlugTitle(slug)} | CaseProz Kenya`);

    const description =
        product?.metaDescription?.trim?.() ||
        (product?.name
            ? `Buy ${product.name} online at CaseProz Kenya. ${hasDiscount ? `Save ${discountPercent}% off the original price. ` : ''}Fast delivery and genuine accessories.`
            : 'View product details, pricing, and delivery options at CaseProz Kenya.');

    const image =
        Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : undefined;

    const canonicalPath = `/product/${slug}`;
    const canonicalUrl = absoluteUrl(canonicalPath);
    const ogImage = resolveOgImage(image);

    const productSchema = product?.name
        ? {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: product.name,
              image: product.images || [],
              description,
              sku: product.sku || undefined,
              brand: product.brand
                  ? {
                        '@type': 'Brand',
                        name: product.brand,
                    }
                  : undefined,
              offers: {
                  '@type': 'Offer',
                  priceCurrency: 'KES',
                  price: effectivePrice,
                  availability:
                      effectiveStock > 0
                          ? 'https://schema.org/InStock'
                          : 'https://schema.org/OutOfStock',
                  url: canonicalUrl,
              },
          }
        : null;

    const breadcrumbSchema = product?.name
        ? {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                  {
                      '@type': 'ListItem',
                      position: 1,
                      name: 'Home',
                      item: absoluteUrl('/'),
                  },
                  {
                      '@type': 'ListItem',
                      position: 2,
                      name: product.category || 'Category',
                      item: product.category
                          ? absoluteUrl(`/search?category=${encodeURIComponent(product.category)}`)
                          : absoluteUrl('/search'),
                  },
                  {
                      '@type': 'ListItem',
                      position: 3,
                      name: product.name,
                      item: canonicalUrl,
                  },
              ],
          }
        : null;

    const jsonLd = [productSchema, breadcrumbSchema].filter(Boolean);

    const bodyHtml = product?.name
        ? `<article class="prerender-fallback" style="max-width:960px;margin:0 auto;padding:24px;font-family:Arial,sans-serif">
            <h1 style="font-size:28px;margin-bottom:12px">${escapeHtml(product.name)}</h1>
            ${image ? `<img src="${escapeHtml(ogImage)}" alt="${escapeHtml(product.name)}" style="max-width:320px;height:auto;margin-bottom:16px" />` : ''}
            <p style="color:#444;line-height:1.6;margin-bottom:12px">${escapeHtml(description)}</p>
            <p style="font-size:20px;font-weight:700;color:#E41E26">KSh ${escapeHtml(String(effectivePrice))}</p>
          </article>`
        : '';

    return {
        title,
        description,
        canonicalPath,
        canonicalUrl,
        image: ogImage,
        type: 'product',
        noIndex: false,
        jsonLd,
        bodyHtml,
    };
};

export const buildCategorySeo = (categoryName) => {
    const formattedTitle =
        categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace(/-/g, ' ');

    const title = `${formattedTitle} | CaseProz Kenya`;
    const description = `Browse ${formattedTitle} at CaseProz – curated tech, accessories and gadgets in Kenya.`;
    const canonicalPath = `/category/${categoryName}`;

    return {
        title,
        description,
        canonicalPath,
        canonicalUrl: absoluteUrl(canonicalPath),
        image: DEFAULT_OG_IMAGE,
        type: 'website',
        noIndex: false,
        jsonLd: [
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Home',
                        item: absoluteUrl('/'),
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: formattedTitle,
                        item: absoluteUrl(canonicalPath),
                    },
                ],
            },
        ],
        bodyHtml: `<article class="prerender-fallback" style="max-width:960px;margin:0 auto;padding:24px;font-family:Arial,sans-serif">
            <h1 style="font-size:28px;margin-bottom:12px">${escapeHtml(formattedTitle)}</h1>
            <p style="color:#444;line-height:1.6">${escapeHtml(description)}</p>
          </article>`,
    };
};

export const buildBrandSeo = (brandName) => {
    const formattedTitle = formatBrandName(brandName);
    const canonicalPath = `/brand/${slugify(decodeURIComponent(brandName || ''))}`;
    const title = `Buy ${formattedTitle} Products in Kenya | CaseProz`;
    const description = `Shop genuine ${formattedTitle} phone cases, chargers, audio and mobile accessories in Nairobi, Kenya. Fast delivery across Kenya & pay on delivery available at CaseProz.`;

    return {
        title,
        description,
        canonicalPath,
        canonicalUrl: absoluteUrl(canonicalPath),
        image: DEFAULT_OG_IMAGE,
        type: 'website',
        noIndex: false,
        keywords: `${formattedTitle} Kenya, buy ${formattedTitle} Nairobi, ${formattedTitle} accessories, ${formattedTitle} cases, CaseProz`,
        jsonLd: [
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Home',
                        item: absoluteUrl('/'),
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: formattedTitle,
                        item: absoluteUrl(canonicalPath),
                    },
                ],
            },
        ],
        bodyHtml: `<article class="prerender-fallback" style="max-width:960px;margin:0 auto;padding:24px;font-family:Arial,sans-serif">
            <h1 style="font-size:28px;margin-bottom:12px">${escapeHtml(formattedTitle)} Products &amp; Accessories in Kenya</h1>
            <p style="color:#444;line-height:1.6">${escapeHtml(description)}</p>
          </article>`,
    };
};

export const buildSeoHeadHtml = (seo) => {
    const robots = seo.noIndex ? 'noindex,follow' : 'index,follow';
    const keywordsLine = seo.keywords
        ? `\n    <meta name="keywords" content="${escapeHtml(seo.keywords)}" />`
        : '';

    const jsonLdScripts = (seo.jsonLd || [])
        .map(
            (schema) =>
                `\n    <script type="application/ld+json">${JSON.stringify(schema)}</script>`
        )
        .join('');

    return `<!-- SEO_HEAD_START -->
    <title>${escapeHtml(seo.title)}</title>
    <meta name="title" content="${escapeHtml(seo.title)}" />
    <meta name="description" content="${escapeHtml(seo.description)}" />${keywordsLine}
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />
    <meta property="og:type" content="${escapeHtml(seo.type || 'website')}" />
    <meta property="og:url" content="${escapeHtml(seo.canonicalUrl)}" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:image" content="${escapeHtml(seo.image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(seo.canonicalUrl)}" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
    <meta name="twitter:image" content="${escapeHtml(seo.image)}" />${jsonLdScripts}
    <!-- SEO_HEAD_END -->`;
};

export const injectPrerenderHtml = (templateHtml, seo) => {
    const seoHead = buildSeoHeadHtml(seo);
    let html = templateHtml.replace(
        /<!-- SEO_HEAD_START -->[\s\S]*?<!-- SEO_HEAD_END -->/,
        seoHead
    );

    if (seo.bodyHtml) {
        html = html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${seo.bodyHtml}</div>`);
    }

    return html;
};

export const readHtmlTemplate = async (fs, path, cwd = process.cwd()) => {
    const candidates = [
        path.join(cwd, 'index.html'),
        path.join(cwd, 'dist', 'index.html'),
    ];

    for (const candidate of candidates) {
        try {
            return await fs.readFile(candidate, 'utf8');
        } catch {
            // try next path
        }
    }

    throw new Error('index.html template not found');
};

export const fetchProductBySlug = async (slug) => {
    const apiBase = getApiBaseUrl();
    if (!apiBase || !slug) return null;

    const response = await fetch(`${apiBase}/api/products/${encodeURIComponent(slug)}`, {
        headers: { Accept: 'application/json' },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
        throw new Error(`Product fetch failed (${response.status})`);
    }

    return response.json();
};

export const renderPrerenderedPage = async ({ route, slug, name, fs, path, cwd }) => {
    const templateHtml = await readHtmlTemplate(fs, path, cwd);
    let seo;

    if (route === 'product') {
        try {
            const product = await fetchProductBySlug(slug);
            seo = buildProductSeo(product, slug);
            if (!product) {
                seo.noIndex = true;
            }
        } catch {
            seo = buildProductSeo(null, slug);
        }
    } else if (route === 'category') {
        seo = buildCategorySeo(name || slug || '');
    } else if (route === 'brand') {
        seo = buildBrandSeo(name || slug || '');
    } else {
        throw new Error(`Unsupported prerender route: ${route}`);
    }

    return injectPrerenderHtml(templateHtml, seo);
};
