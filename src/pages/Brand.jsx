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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const brandSeo = buildBrandSeo(brandName || '');
    const formattedTitle = formatBrandName(brandName);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError('');
            try {
                const baseUrl = `${import.meta.env.VITE_API_URL}/api/products`;
                const pageSize = 48;
                const searchBrand = decodeURIComponent(brandName || '').replace(/-/g, ' ');

                let page = 1;
                let totalPages = 1;
                const aggregated = [];

                while (page <= totalPages) {
                    const data = await apiFetch(
                        `${baseUrl}?brand=${encodeURIComponent(searchBrand)}&isActive=true&page=${page}&pageSize=${pageSize}&sort=newest`
                    );

                    const pageProducts = Array.isArray(data?.products) ? data.products : [];
                    aggregated.push(...pageProducts);

                    totalPages = Number.isFinite(data?.pages) && data.pages > 0 ? data.pages : 1;
                    page += 1;
                }

                setProducts(aggregated);
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
        <div className="brand-page container" style={{ padding: '40px 0' }}>
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

            <div className="breadcrumb" style={{ marginBottom: '18px', color: '#666', fontSize: '14px' }}>
                <Link to="/" style={{ color: '#E41E26', textDecoration: 'none' }}>Home</Link> /
                <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>{formattedTitle}</span>
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#1a1a1a' }}>
                {formattedTitle} Products &amp; Accessories in Kenya
            </h1>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '15px' }}>
                Explore our collection of authentic {formattedTitle} tech, chargers, phone covers, and accessories with fast delivery across Kenya.
            </p>

            <ErrorBanner message={error} onClose={() => setError('')} />

            {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 0', color: '#666' }}>
                    <h3>No products found for {formattedTitle}.</h3>
                    <Link to="/" style={{ color: '#E41E26', textDecoration: 'none', fontWeight: 'bold', marginTop: '20px', display: 'inline-block' }}>Continue Shopping</Link>
                </div>
            ) : (
                <div className="product-grid">
                    {products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Brand;
