import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_SITE_NAME = 'CaseProz Kenya';
const DEFAULT_BASE_URL = 'https://caseproz.co.ke';
const DEFAULT_OG_IMAGE = `${DEFAULT_BASE_URL}/favicon.ico`;

const SeoMeta = ({
    title,
    description,
    keywords,
    canonicalPath,
    canonicalUrl,
    image,
    type = 'website',
    noIndex = false,
    siteName = DEFAULT_SITE_NAME,
    twitterCard = 'summary_large_image',
}) => {
    const resolvedCanonical =
        canonicalUrl ||
        (typeof window !== 'undefined'
            ? `${window.location.origin}${canonicalPath || window.location.pathname}`
            : `${DEFAULT_BASE_URL}${canonicalPath || '/'}`);

    const resolvedImage = image
        ? image.startsWith('http')
            ? image
            : `${DEFAULT_BASE_URL}${image.startsWith('/') ? image : `/${image}`}`
        : DEFAULT_OG_IMAGE;

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
