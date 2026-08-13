import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
    DEFAULT_OG_IMAGE,
    SITE_NAME,
    absoluteUrl,
    resolveOgImage,
} from '../utils/seo';

const SeoMeta = ({
    title,
    description,
    keywords,
    canonicalPath,
    canonicalUrl,
    image,
    type = 'website',
    noIndex = false,
    siteName = SITE_NAME,
    twitterCard = 'summary_large_image',
}) => {
    const resolvedCanonical =
        canonicalUrl ||
        (typeof window !== 'undefined'
            ? `${window.location.origin}${canonicalPath || window.location.pathname}`
            : absoluteUrl(canonicalPath || '/'));

    const resolvedImage = resolveOgImage(image);

    return (
        <Helmet>
            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={resolvedCanonical} />

            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={siteName} />
            {title && <meta property="og:title" content={title} />}
            {description && <meta property="og:description" content={description} />}
            <meta property="og:url" content={resolvedCanonical} />
            <meta property="og:image" content={resolvedImage} />

            <meta name="twitter:card" content={twitterCard} />
            {title && <meta name="twitter:title" content={title} />}
            {description && <meta name="twitter:description" content={description} />}
            <meta name="twitter:image" content={resolvedImage} />

            {noIndex ? (
                <meta name="robots" content="noindex,follow" />
            ) : (
                <meta name="robots" content="index,follow" />
            )}
        </Helmet>
    );
};

export default SeoMeta;
