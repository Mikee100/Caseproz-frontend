import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ErrorBanner from '../components/ErrorBanner';
import { apiFetch, ApiError } from '../utils/apiClient';
import SeoMeta from '../components/SeoMeta';
import { absoluteUrl, buildBrandSeo, formatBrandName } from '../utils/seo';
import ProductCard from '../components/ProductCard';
import LoadingState from '../components/LoadingState';

const Brand = () => {
    const { brandName } = useParams();
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');

    const brandSeo = buildBrandSeo(brandName || '');
    const formattedTitle = formatBrandName(brandName);

    // Brand descriptions for enhanced SEO
    const brandDescriptions = {
        'anker': {
            intro: 'Shop Anker - A trusted leader in power technology and smart accessories.',
            about: 'Anker is a global technology powerhouse dedicated to charging and smart accessories. Our products deliver premium quality, innovative design, and exceptional reliability.',
            benefits: ['Trusted by millions worldwide', 'Innovative charging technology', 'Reliable long-lasting products', 'Fast delivery to Kenya']
        },
        'soundcore': {
            intro: 'Discover Soundcore Premium Audio Solutions - Experience superior sound quality.',
            about: 'Soundcore specializes in high-fidelity audio products designed for music lovers who demand exceptional sound quality and performance.',
            benefits: ['Crystal-clear sound quality', 'Premium audio technology', 'Comfortable all-day listening', 'Reliable audio excellence']
        },
        'soundcore-by-anker': {
            intro: 'Discover Soundcore Premium Audio Solutions - Experience superior sound quality.',
            about: 'Soundcore specializes in high-fidelity audio products designed for music lovers who demand exceptional sound quality and performance.',
            benefits: ['Crystal-clear sound quality', 'Premium audio technology', 'Comfortable all-day listening', 'Reliable audio excellence']
        },
    };

    const brandSlug = (brandName || '').toLowerCase().replace(/\s+/g, '-');
    const brandSearchName = brandSlug === 'soundcore-by-anker' ? 'Soundcore' : decodeURIComponent(brandName || '').replace(/-/g, ' ');
    const brandInfo = brandDescriptions[brandSlug] || {
        intro: `Shop ${formattedTitle} - Premium quality tech and accessories.`,
        about: `Discover our selection of authentic ${formattedTitle} products.`,
        benefits: ['Quality assured', 'Fast shipping', 'Great value']
    };
    const brandInitials = formattedTitle
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError('');
            try {
                const baseUrl = `${import.meta.env.VITE_API_URL}/api/products`;
                const pageSize = 48;
                const data = await apiFetch(
                    `${baseUrl}?brand=${encodeURIComponent(brandSearchName)}&isActive=true&page=1&pageSize=${pageSize}&sort=newest`
                );

                const firstPageProducts = Array.isArray(data?.products) ? data.products : [];
                const nextTotalPages = Number.isFinite(data?.pages) && data.pages > 0 ? data.pages : 1;

                setProducts(firstPageProducts);
                setPage(1);
                setTotalPages(nextTotalPages);
            } catch (err) {
                if (err instanceof ApiError) {
                    setError(err.message || 'Failed to load brand products. Please try again.');
                } else {
                    setError('Failed to load brand products. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [brandName]);

    const hasMore = page < totalPages;

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        setError('');
        try {
            const baseUrl = `${import.meta.env.VITE_API_URL}/api/products`;
            const pageSize = 48;
            const nextPage = page + 1;

            const data = await apiFetch(
                `${baseUrl}?brand=${encodeURIComponent(brandSearchName)}&isActive=true&page=${nextPage}&pageSize=${pageSize}&sort=newest`
            );

            const nextPageProducts = Array.isArray(data?.products) ? data.products : [];
            const nextTotalPages = Number.isFinite(data?.pages) && data.pages > 0 ? data.pages : totalPages;

            setProducts((prev) => [...prev, ...nextPageProducts]);
            setPage(nextPage);
            setTotalPages(nextTotalPages);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message || 'Failed to load more products. Please try again.');
            } else {
                setError('Failed to load more products. Please try again.');
            }
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading)
        return (
            <>
                <SeoMeta
                    title={brandSeo.title}
                    description={brandSeo.description}
                    canonicalPath={brandSeo.canonicalPath}
                />
                <div className="container" style={{ padding: '100px 0' }}>
                    <LoadingState message={`Loading ${formattedTitle} products...`} />
                </div>
            </>
        );

    const brandListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${formattedTitle} products at CaseProz Kenya`,
        itemListElement: products.slice(0, 24).map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: absoluteUrl(`/product/${product.slug}`),
            name: product.name,
        })),
    };

    return (
        <div className="brand-page container" style={{ padding: '28px 0 48px' }}>
            <SeoMeta
                title={brandSeo.title}
                description={brandSeo.description}
                keywords={brandSeo.keywords}
                canonicalPath={brandSeo.canonicalPath}
                image={brandSeo.image}
                type={brandSeo.type}
                noIndex={brandSeo.noIndex}
            />
            <Helmet>
                {products.length > 0 && (
                    <script type="application/ld+json">
                        {JSON.stringify(brandListSchema)}
                    </script>
                )}
                {brandSeo.jsonLd.map((schema, index) => (
                    <script key={index} type="application/ld+json">
                        {JSON.stringify(schema)}
                    </script>
                ))}
            </Helmet>

            <nav className="brand-breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Home</Link>
                <span aria-hidden="true">/</span>
                <span>{formattedTitle}</span>
            </nav>

            <header className="brand-hero">
                <div className="brand-hero-mark" aria-hidden="true">{brandInitials}</div>
                <div className="brand-hero-copy">
                    <p className="brand-hero-kicker">Official collection</p>
                    <h1>{formattedTitle}</h1>
                    <p className="brand-hero-intro">{brandInfo.intro}</p>
                    <p className="brand-hero-about">{brandInfo.about}</p>
                    <div className="brand-benefits" aria-label={`${formattedTitle} shopping benefits`}>
                        {brandInfo.benefits.map((benefit) => (
                            <span key={benefit}>{benefit}</span>
                        ))}
                    </div>
                </div>
                <div className="brand-hero-summary">
                    <strong>{products.length}</strong>
                    <span>{products.length === 1 ? 'product' : 'products'} available</span>
                </div>
            </header>

            <div className="brand-results-heading">
                <div>
                    <h2>Shop {formattedTitle}</h2>
                    <p>{products.length > 0 ? 'Find your next tech essential.' : 'This collection is being refreshed.'}</p>
                </div>
                <Link className="brand-results-link" to="/search">Browse all products</Link>
            </div>

            <ErrorBanner message={error} onClose={() => setError('')} />

            {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 0', color: '#666' }}>
                    <h3>No products found for {formattedTitle}.</h3>
                    <Link to="/" style={{ color: '#E41E26', textDecoration: 'none', fontWeight: 'bold', marginTop: '20px', display: 'inline-block' }}>Continue Shopping</Link>
                </div>
            ) : (
                <>
                    <div className="product-grid">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                    {hasMore && (
                        <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <button
                                type="button"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                style={{
                                    background: '#E41E26',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 20px',
                                    fontWeight: 700,
                                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                                    opacity: loadingMore ? 0.8 : 1,
                                }}
                            >
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Brand;
