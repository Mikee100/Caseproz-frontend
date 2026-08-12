import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ErrorBanner from '../components/ErrorBanner';
import { apiFetch, ApiError } from '../utils/apiClient';
import SeoMeta from '../components/SeoMeta';
import ProductCard from '../components/ProductCard';

const Category = () => {
    const { categoryName } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError('');
            try {
                const baseUrl = `${import.meta.env.VITE_API_URL}/api/products`;
                const pageSize = 48;
                const slug = encodeURIComponent(categoryName || '');

                let page = 1;
                let totalPages = 1;
                const aggregated = [];

                while (page <= totalPages) {
                    const data = await apiFetch(
                        `${baseUrl}?categorySlug=${slug}&isActive=true&page=${page}&pageSize=${pageSize}&sort=newest`
                    );

                    const pageProducts = Array.isArray(data?.products) ? data.products : [];
                    aggregated.push(...pageProducts);

                    totalPages = Number.isFinite(data?.pages) && data.pages > 0 ? data.pages : 1;
                    page += 1;
                }

                setProducts(aggregated);
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

    if (loading)
        return (
            <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
                <div className="loading-spinner large"></div>
                <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>Loading category...</p>
            </div>
        );

    const formattedTitle =
        categoryName.charAt(0).toUpperCase() +
        categoryName.slice(1).replace(/-/g, ' ');

    const pageTitle = `${formattedTitle} | CaseProz Kenya`;
    const metaDescription = `Browse ${formattedTitle} at CaseProz – curated tech, accessories and gadgets in Kenya.`;

    const categoryListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${formattedTitle} products`,
        itemListElement: products.slice(0, 24).map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `https://www.caseproz.co.ke/product/${product.slug}`,
            name: product.name,
        })),
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://www.caseproz.co.ke/',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: formattedTitle,
                item: `https://www.caseproz.co.ke/category/${categoryName}`,
            },
        ],
    };
    return (
        <div className="category-page container" style={{ padding: '40px 0' }}>
            <SeoMeta
                title={pageTitle}
                description={metaDescription}
                canonicalPath={`/category/${categoryName}`}
            />
            <Helmet>
                {products.length > 0 && (
                    <script type="application/ld+json">
                        {JSON.stringify(categoryListSchema)}
                    </script>
                )}
                <script type="application/ld+json">
                    {JSON.stringify(breadcrumbSchema)}
                </script>
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
                <div className="product-grid">
                    {products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Category;
