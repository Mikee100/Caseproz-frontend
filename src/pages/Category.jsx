import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ErrorBanner from '../components/ErrorBanner';
import { apiFetch, ApiError } from '../utils/apiClient';
import SeoMeta from '../components/SeoMeta';
import { absoluteUrl, buildCategorySeo } from '../utils/seo';
import ProductCard from '../components/ProductCard';
import LoadingState from '../components/LoadingState';

const Category = () => {
    const { categoryName } = useParams();
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError('');
            try {
                const baseUrl = `${import.meta.env.VITE_API_URL}/api/products`;
                const pageSize = 48;
                const slug = encodeURIComponent(categoryName || '');
                const data = await apiFetch(
                    `${baseUrl}?categorySlug=${slug}&isActive=true&page=1&pageSize=${pageSize}&sort=newest`
                );

                const firstPageProducts = Array.isArray(data?.products) ? data.products : [];
                const nextTotalPages = Number.isFinite(data?.pages) && data.pages > 0 ? data.pages : 1;

                setProducts(firstPageProducts);
                setPage(1);
                setTotalPages(nextTotalPages);
            } catch (err) {
                if (err instanceof ApiError) {
                    setError(err.message || 'Failed to load this category. Please try again.');
                } else {
                    setError('Failed to load this category. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [categoryName]);

    const hasMore = page < totalPages;

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        setError('');
        try {
            const baseUrl = `${import.meta.env.VITE_API_URL}/api/products`;
            const pageSize = 48;
            const slug = encodeURIComponent(categoryName || '');
            const nextPage = page + 1;

            const data = await apiFetch(
                `${baseUrl}?categorySlug=${slug}&isActive=true&page=${nextPage}&pageSize=${pageSize}&sort=newest`
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

    const categorySeo = buildCategorySeo(categoryName || '');
    const formattedTitle = categorySeo.title.replace(/\s*\|\s*CaseProz Kenya\s*$/i, '');

    if (loading)
        return (
            <>
                <SeoMeta
                    title={categorySeo.title}
                    description={categorySeo.description}
                    canonicalPath={categorySeo.canonicalPath}
                />
                <div className="container" style={{ padding: '100px 0' }}>
                    <LoadingState message="Loading category..." />
                </div>
            </>
        );

    const categoryListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${formattedTitle} products`,
        itemListElement: products.slice(0, 24).map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: absoluteUrl(`/product/${product.slug}`),
            name: product.name,
        })),
    };

    return (
        <div className="category-page container" style={{ padding: '40px 0' }}>
            <SeoMeta
                title={categorySeo.title}
                description={categorySeo.description}
                canonicalPath={categorySeo.canonicalPath}
                image={categorySeo.image}
                type={categorySeo.type}
                noIndex={categorySeo.noIndex}
            />
            <Helmet>
                {products.length > 0 && (
                    <script type="application/ld+json">
                        {JSON.stringify(categoryListSchema)}
                    </script>
                )}
                {categorySeo.jsonLd.map((schema, index) => (
                    <script key={index} type="application/ld+json">
                        {JSON.stringify(schema)}
                    </script>
                ))}
            </Helmet>
            <div className="breadcrumb" style={{ marginBottom: '18px', color: '#666', fontSize: '14px' }}>
                <Link to="/" style={{ color: '#E41E26', textDecoration: 'none' }}>Home</Link> /
                <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>{formattedTitle}</span>
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px', color: '#1a1a1a' }}>
                {formattedTitle}
            </h1>

            <ErrorBanner message={error} onClose={() => setError('')} />

            {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 0', color: '#666' }}>
                    <h3>No products found in this category.</h3>
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

export default Category;
