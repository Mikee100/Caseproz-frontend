import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/apiClient';
import ProductDescriptionSection from '../components/ProductDescriptionSection';
import ProductCard from '../components/ProductCard';
import SeoMeta from '../components/SeoMeta';

const buildVariantDisplayName = (variant) => {
    if (!variant) return 'Option';
    return variant.label || variant.color || variant.style || variant.sku || 'Option';
};

const ProductDetails = () => {
    const { slug } = useParams();
    const { addToCart } = useCart();
    const { isFavourite, toggleFavourite } = useFavorites();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mainImage, setMainImage] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const [isZoomActive, setIsZoomActive] = useState(false);
    const [zoomTransform, setZoomTransform] = useState(null);
    const [selectedVariantSku, setSelectedVariantSku] = useState('');
    const [relatedProducts, setRelatedProducts] = useState([]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/${slug}`);
                setProduct(data);
                setMainImage(data.images?.[0] || '');
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProduct();
    }, [slug]);

    // Load related products once we know the main product
    useEffect(() => {
        const loadExtraData = async () => {
            if (!product) return;

            try {
                // Related products: same category/subCategory, different _id
                const params = new URLSearchParams();
                if (product.category) params.append('category', product.category);
                if (product.subCategory) params.append('subCategory', product.subCategory);

                try {
                    const relatedData = await apiFetch(
                        `${import.meta.env.VITE_API_URL}/api/products?${params.toString()}`
                    );
                    const list = Array.isArray(relatedData) ? relatedData : relatedData.products || [];
                    const filtered = list.filter((p) => p._id !== product._id);
                    setRelatedProducts(filtered.slice(0, 4));
                } catch {
                    // fail silently
                }
            } catch {
                // fail silently for extra data
            }
        };

        loadExtraData();
    }, [product]);

    useEffect(() => {
        if (!product) return;
        const firstInStock = (product.variants || []).find((variant) => variant.stock > 0);
        setSelectedVariantSku(firstInStock?.sku || product.variants?.[0]?.sku || '');
    }, [product]);

    const selectedVariant = (product?.variants || []).find((variant) => variant.sku === selectedVariantSku) || null;
    const effectivePrice = selectedVariant?.price ?? product?.price ?? 0;
    const effectiveStock = selectedVariant?.stock ?? product?.stock ?? 0;
    const effectiveImage = selectedVariant?.image || mainImage;

    const handleQuantityChange = (type) => {
        if (type === 'inc') {
            setQuantity(prev => prev + 1);
        } else if (type === 'dec' && quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleAddToCart = () => {
        if (product && effectiveStock > 0) {
            addToCart(product, quantity, selectedVariant);
            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 3000);
        }
    };

    const handleToggleFavourite = () => {
        if (!product) return;
        if (!user) {
            navigate('/login');
            return;
        }
        toggleFavourite(product);
    };

    const handleImageMouseEnter = () => {
        // Basic guard: skip zoom on very small screens
        if (window.innerWidth < 768) return;
        setIsZoomActive(true);
    };

    const handleImageMouseLeave = () => {
        setIsZoomActive(false);
        setZoomTransform(null);
    };

    const handleImageMouseMove = (e) => {
        if (!isZoomActive) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomTransform({
            transformOrigin: `${x}% ${y}%`,
            transform: 'scale(1.7)',
        });
    };

    if (loading)
        return (
            <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
                <div className="loading-spinner large"></div>
                <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>Loading product...</p>
            </div>
        );
    if (error) return <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>{error}</div>;
    if (!product) return null;

    const hasDiscount =
        typeof product.originalPrice === 'number' &&
        product.originalPrice > effectivePrice;
    const discountPercent = hasDiscount
        ? Math.round(((product.originalPrice - effectivePrice) / product.originalPrice) * 100)
        : null;

    const categoryParam = product.category ? encodeURIComponent(product.category) : '';
    const metaCategories = Array.from(
        new Map(
            [
                ...(Array.isArray(product.categories) ? product.categories : []),
                product.category,
                product.subCategory,
            ]
                .filter(Boolean)
                .map((c) => [String(c).trim().toLowerCase(), String(c).trim()])
        ).values()
    );

    const pageTitle =
        product.metaTitle && product.metaTitle.trim().length > 0
            ? product.metaTitle
            : `${product.name} | CaseProz Kenya`;

    const metaDescription =
        product.metaDescription && product.metaDescription.trim().length > 0
            ? product.metaDescription
            : `Buy ${product.name} online at CaseProz Kenya. ${hasDiscount ? `Save ${discountPercent}% off the original price. ` : ''}Fast delivery and genuine accessories.`;

    const mainImageUrl =
        Array.isArray(product.images) && product.images.length > 0
            ? product.images[0]
            : undefined;

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.images || [],
        description: metaDescription,
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
            url: typeof window !== 'undefined' ? window.location.href : undefined,
        },
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
                name: product.category || 'Category',
                item: product.category
                    ? `https://www.caseproz.co.ke/search?category=${encodeURIComponent(product.category)}`
                    : 'https://www.caseproz.co.ke/search',
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: product.name,
                item: `https://www.caseproz.co.ke/product/${product.slug}`,
            },
        ],
    };

    return (
        <div className="product-details-page container">
            <SeoMeta
                title={pageTitle}
                description={metaDescription}
                canonicalPath={`/product/${product.slug}`}
                image={mainImageUrl}
                type="product"
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify(breadcrumbSchema)}
                </script>
            </Helmet>
            <div className="pd-layout">
                {/* Left: Thumbnails + Main image area (feature headline, image, notes) */}
                <div className="pd-images">
                    <div className="pd-thumbnails-col">
                        {product.images?.length > 0 && product.images.map((img, index) => (
                            <div
                                key={index}
                                className={`pd-thumb ${mainImage === img ? 'active' : ''}`}
                                onClick={() => setMainImage(img)}
                            >
                                <img src={img} alt={`${product.name} thumbnail ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                    <div className="pd-main-col">
                        {(product.featureHeadline || product.featureSubtext) && (
                            <div className="pd-feature-headline">
                                {product.featureHeadline && (
                                    <div className="pd-feature-headline-text">{product.featureHeadline}</div>
                                )}
                                {product.featureSubtext && (
                                    <div className="pd-feature-subtext">{product.featureSubtext}</div>
                                )}
                            </div>
                        )}
                        <div
                            className={`pd-main-image ${isZoomActive ? 'pd-main-image--zoom' : ''}`}
                            onMouseEnter={handleImageMouseEnter}
                            onMouseLeave={handleImageMouseLeave}
                            onMouseMove={handleImageMouseMove}
                        >
                            <img
                                src={effectiveImage}
                                alt={product.name}
                                style={zoomTransform || undefined}
                            />
                        </div>
                        {product.notes && product.notes.length > 0 && (
                            <div className="pd-notes">
                                <div className="pd-notes-title">Notes</div>
                                <ul>
                                    {product.notes.map((note, index) => (
                                        <li key={index}>{note}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Breadcrumb, title, price, features, actions, metadata */}
                <div className="pd-info">
                    <nav className="pd-breadcrumb">
                        <Link to="/">HOME</Link>
                        <span>/</span>
                        <Link to={categoryParam ? `/search?category=${categoryParam}` : '#'}>{product.category?.toUpperCase()}</Link>
                    </nav>

                    <h1 className="pd-name">{product.name}</h1>
             

                    <div className="pd-price-row">
                        <span className="pd-price-dot"></span>
                        <span className="pd-price">KSh {effectivePrice.toLocaleString()}</span>
                        {hasDiscount && (
                            <>
                                <span className="pd-original-price">
                                    KSh {product.originalPrice.toLocaleString()}
                                </span>
                                {discountPercent !== null && (
                                    <span className="pd-saving-pill">Save {discountPercent}%</span>
                                )}
                            </>
                        )}
                        {product.onSale && !hasDiscount && (
                            <span className="pd-sale-badge">SALE</span>
                        )}
                    </div>

                    {product.keyFeatures && product.keyFeatures.length > 0 && (
                        <div className="pd-features">
                            <ul>
                                {product.keyFeatures.map((feature, index) => (
                                    <li key={index}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="pd-actions">
                        <div className="pd-qty">
                            <button type="button" onClick={() => handleQuantityChange('dec')} aria-label="Decrease quantity">−</button>
                            <input type="text" value={quantity} readOnly aria-label="Quantity" />
                            <button type="button" onClick={() => handleQuantityChange('inc')} aria-label="Increase quantity">+</button>
                        </div>
                        <button
                            className="pd-add-to-cart"
                            onClick={handleAddToCart}
                            disabled={effectiveStock <= 0}
                            style={{
                                transform: addedToCart ? 'scale(1.03)' : 'scale(1)',
                                boxShadow: addedToCart
                                    ? '0 14px 28px rgba(0,0,0,0.20)'
                                    : '0 10px 20px rgba(0,0,0,0.12)',
                                transition: 'transform 0.18s ease-out, box-shadow 0.18s ease-out',
                            }}
                        >
                            {effectiveStock <= 0 ? 'Out of stock' : addedToCart ? '✓ Added to cart' : 'ADD TO CART'}
                        </button>
                    </div>

                    <button
                        type="button"
                        className="pd-add-to-wishlist-link"
                        onClick={handleToggleFavourite}
                        title={isFavourite(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <i className={isFavourite(product._id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                        <span>ADD TO WISHLIST</span>
                    </button>

                    <div className="pd-meta">
                        {product.sku && (
                            <div className="pd-meta-row">
                                <span className="pd-meta-label">SKU:</span>
                                <span className="pd-meta-value">{selectedVariant?.sku || product.sku}</span>
                            </div>
                        )}
                        <div className="pd-meta-row">
                            <span className="pd-meta-label">CATEGORIES:</span>
                            <span className="pd-meta-value">
                                {metaCategories.length > 0 ? (
                                    <>
                                        <Link to={categoryParam ? `/search?category=${categoryParam}` : '#'}>{metaCategories[0]}</Link>
                                        {metaCategories.slice(1).map((c) => `, ${c}`)}
                                    </>
                                ) : (
                                    '-'
                                )}
                            </span>
                        </div>
                        {product.brand && (
                            <div className="pd-meta-row">
                                <span className="pd-meta-label">Brand:</span>
                                <span className="pd-meta-value">{product.brand}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {Array.isArray(product.variants) && product.variants.length > 0 && (
                <section className="pd-variants-gallery">
                    <div className="pd-variants-gallery-header">
                        <span className="pd-variants-label">Choose Option</span>
                    </div>
                    <div className="pd-variants-thumbnails">
                        {product.variants.map((variant) => {
                            const thumbSrc = variant.image || product.images?.[0] || '';
                            return (
                                <button
                                    key={variant.sku}
                                    type="button"
                                    className={`pd-variant-thumb-card ${variant.sku === selectedVariantSku ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedVariantSku(variant.sku);
                                        if (variant.image) setMainImage(variant.image);
                                    }}
                                >
                                    <div className="pd-variant-thumb-image-wrap">
                                        {thumbSrc ? (
                                            <img
                                                src={thumbSrc}
                                                alt={buildVariantDisplayName(variant)}
                                                className="pd-variant-thumb-image"
                                            />
                                        ) : (
                                            <div className="pd-variant-thumb-placeholder">No image</div>
                                        )}
                                    </div>
                                    <div className="pd-variant-thumb-meta">
                                        <span className="pd-variant-thumb-label">{buildVariantDisplayName(variant)}</span>
                                        <span className="pd-variant-thumb-stock">
                                            {variant.stock > 0 ? 'In stock' : 'Out of stock'}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}

            <ProductDescriptionSection html={product.description} specs={product.specs} />

            {relatedProducts.length > 0 && (
                <section className="pd-related">
                    <div className="pd-related-header">
                        <div>
                            <h2 className="pd-related-title">Related products</h2>
                            <p className="pd-related-subtitle">Customers also viewed these</p>
                        </div>
                    </div>
                    <div
                        className="product-grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
                            gap: '12px',
                        }}
                    >
                        {relatedProducts.slice(0, 4).map((rp) => (
                            <div
                                key={rp._id}
                                style={{
                                    maxWidth: 210,
                                    margin: '0 auto',
                                    transform: 'scale(0.9)',
                                    transformOrigin: 'top center',
                                }}
                            >
                                <ProductCard product={rp} />
                            </div>
                        ))}
                    </div>
                </section>
            )}
            {/* Lightweight add-to-cart toast */}
            {addedToCart && (
                <div
                    style={{
                        position: 'fixed',
                        right: '24px',
                        bottom: '24px',
                        zIndex: 3000,
                        backgroundColor: '#111827',
                        color: '#f9fafb',
                        padding: '14px 18px',
                        borderRadius: '999px',
                        boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                    }}
                >
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '22px',
                            height: '22px',
                            borderRadius: '999px',
                            backgroundColor: '#22c55e',
                            color: '#022c22',
                            fontSize: '12px',
                            fontWeight: 700,
                        }}
                    >
                        ✓
                    </span>
                    <span>
                        Added to cart.{' '}
                        <Link
                            to="/cart"
                            style={{ color: '#fde68a', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                        >
                            View cart
                        </Link>
                    </span>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
