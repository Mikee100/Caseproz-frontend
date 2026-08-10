import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { slugify, matchesCategorySlug } from '../utils/categoryMap';
import ErrorBanner from '../components/ErrorBanner';
import { apiFetch, ApiError } from '../utils/apiClient';
import SeoMeta from '../components/SeoMeta';

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
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products`);

                const targetSlug = slugify(categoryName || '');
                const filtered = data.filter((p) => matchesCategorySlug(p, targetSlug));

                setProducts(filtered);
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
    return (
        <div className="category-page container" style={{ padding: '40px 0' }}>
            <SeoMeta
                title={pageTitle}
                description={metaDescription}
                canonicalPath={`/category/${categoryName}`}
            />
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
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '30px'
                }}>
                    {products.map(product => (
                        <Link
                            to={`/product/${product.slug}`}
                            key={product._id}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <div className="product-card" style={{
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '16px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                transition: 'transform 0.3s',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{
                                    width: '100%',
                                    height: '240px',
                                    marginBottom: '20px',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    backgroundColor: '#f9f9f9'
                                }}>
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#1a1a1a' }}>{product.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#E41E26' }}>
                                            KSh {product.price.toLocaleString()}
                                        </span>
                                        {product.originalPrice > product.price && (
                                            <span style={{ fontSize: '14px', textDecoration: 'line-through', color: '#999' }}>
                                                KSh {product.originalPrice.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Category;
