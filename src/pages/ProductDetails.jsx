import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/apiClient';
import ProductDescriptionSection from '../components/ProductDescriptionSection';
import ProductCard from '../components/ProductCard';
import SeoMeta from '../components/SeoMeta';
import LoadingState from '../components/LoadingState';
import { buildProductSeo } from '../utils/seo';

const buildVariantDisplayName = (variant) => {
    if (!variant) return 'Option';
    return variant.label || variant.color || variant.style || variant.sku || 'Option';
};

const getVariantSelectorLabel = (product) => {
    const nameBlob = `${product?.name || ''} ${product?.category || ''} ${product?.subCategory || ''}`.toLowerCase();
    if (nameBlob.includes('iphone') || nameBlob.includes('samsung') || nameBlob.includes('phone')) {
        return 'Select your phone model';
    }
    return 'Choose style';
};

const renderRatingStars = (ratingValue) => {
    const safeRating = Math.max(0, Math.min(5, Number(ratingValue || 0)));
    const rounded = Math.round(safeRating);
    return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
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
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [showStickyPurchaseBar, setShowStickyPurchaseBar] = useState(false);
    const touchStartXRef = useRef(null);
    const addToCartRef = useRef(null);
    const mainImageRef = useRef(null);

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

    const galleryImages = useMemo(() => {
        if (!product) return [];
        return Array.from(
            new Set([
                ...(Array.isArray(product.images) ? product.images : []),
                ...(Array.isArray(product.variants)
                    ? product.variants.map((variant) => variant.image).filter(Boolean)
                    : []),
            ])
        );
    }, [product]);

    const effectiveImage = mainImage || selectedVariant?.image || product?.images?.[0] || '';
    const activeImageIndex = galleryImages.indexOf(effectiveImage);
    const visibleImageIndex = activeImageIndex >= 0 ? activeImageIndex : 0;

    useEffect(() => {
        if (!effectiveImage) {
            setIsImageLoading(false);
            return undefined;
        }

        setIsImageLoading(true);

        // Fallback guard: if the browser already has this image cached, onLoad may not fire again.
        const rafId = window.requestAnimationFrame(() => {
            const img = mainImageRef.current;
            if (img && img.complete && img.naturalWidth > 0) {
                setIsImageLoading(false);
            }
        });

        // Hard timeout so UI never gets stuck in loading state for slow/broken image responses.
        const timeoutId = window.setTimeout(() => {
            setIsImageLoading(false);
        }, 7000);

        return () => {
            window.cancelAnimationFrame(rafId);
            window.clearTimeout(timeoutId);
        };
    }, [effectiveImage]);

    useEffect(() => {
        const onScrollOrResize = () => {
            if (!addToCartRef.current || window.innerWidth > 900) {
                setShowStickyPurchaseBar(false);
                return;
            }

            const rect = addToCartRef.current.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            setShowStickyPurchaseBar(!isVisible);
        };

        onScrollOrResize();
        window.addEventListener('scroll', onScrollOrResize, { passive: true });
        window.addEventListener('resize', onScrollOrResize);

        return () => {
            window.removeEventListener('scroll', onScrollOrResize);
            window.removeEventListener('resize', onScrollOrResize);
        };
    }, [product, selectedVariantSku]);

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

    const handleSelectMainImage = (imageUrl) => {
        if (!imageUrl) return;
        setMainImage(imageUrl);
        setIsZoomActive(false);
        setZoomTransform(null);
    };

    const handleCycleImage = useCallback((direction) => {
        if (galleryImages.length <= 1) return;
        const currentIndex = galleryImages.indexOf(effectiveImage);
        const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex = (safeCurrentIndex + direction + galleryImages.length) % galleryImages.length;
        handleSelectMainImage(galleryImages[nextIndex]);
    }, [galleryImages, effectiveImage]);

    useEffect(() => {
        if (!isLightboxOpen) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsLightboxOpen(false);
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                handleCycleImage(1);
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                handleCycleImage(-1);
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [isLightboxOpen, handleCycleImage]);

    const handleMainImageClick = () => {
        if (window.innerWidth < 768 && effectiveImage) {
            setIsLightboxOpen(true);
        }
    };

    const handleLightboxTouchStart = (event) => {
        touchStartXRef.current = event.touches?.[0]?.clientX ?? null;
    };

    const handleLightboxTouchEnd = (event) => {
        if (touchStartXRef.current === null) return;
        const touchEndX = event.changedTouches?.[0]?.clientX;
        if (typeof touchEndX !== 'number') {
            touchStartXRef.current = null;
            return;
        }

        const deltaX = touchStartXRef.current - touchEndX;
        touchStartXRef.current = null;

        if (Math.abs(deltaX) < 40) return;
        handleCycleImage(deltaX > 0 ? 1 : -1);
    };

    const loadingSeo = buildProductSeo(null, slug);

    if (loading)
        return (
            <>
                <SeoMeta
                    title={loadingSeo.title}
                    description={loadingSeo.description}
                    canonicalPath={loadingSeo.canonicalPath}
                />
                <div className="container" style={{ padding: '100px 0' }}>
                    <LoadingState message="Loading product..." />
                </div>
            </>
        );
    if (error) return <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>{error}</div>;
    if (!product) return null;

    const hasDiscount =
        typeof product.originalPrice === 'number' &&
        product.originalPrice > effectivePrice;
    const discountPercent = hasDiscount
        ? Math.round(((product.originalPrice - effectivePrice) / product.originalPrice) * 100)
        : null;

    const productSeo = buildProductSeo(product, slug);

    const categoryParam = product.category ? encodeURIComponent(product.category) : '';
    const ratingValue = Number(product.ratingAverage || product.rating || 0);
    const reviewsCount = Number(product.reviewsCount || product.numReviews || 0);
    const hasReviews = ratingValue > 0 && reviewsCount > 0;
    const variantSelectorLabel = getVariantSelectorLabel(product);
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

    return (
        <div className="product-details-page container">
            <SeoMeta
                title={productSeo.title}
                description={productSeo.description}
                canonicalPath={productSeo.canonicalPath}
                image={productSeo.image}
                type="product"
            />
            <Helmet>
                {productSeo.jsonLd.map((schema, index) => (
                    <script key={index} type="application/ld+json">
                        {JSON.stringify(schema)}
                    </script>
                ))}
            </Helmet>
            <div className="pd-layout">
                {/* Left: Thumbnails + Main image area (feature headline, image, notes) */}
                <div className="pd-images">
                    <div className="pd-thumbnails-col">
                        {galleryImages.length > 0 && galleryImages.map((img, index) => (
                            <button
                                key={index}
                                type="button"
                                className={`pd-thumb ${effectiveImage === img ? 'active' : ''}`}
                                onClick={() => handleSelectMainImage(img)}
                                aria-label={`Show image ${index + 1} of ${galleryImages.length}`}
                                aria-pressed={effectiveImage === img}
                            >
                                <img
                                    src={img}
                                    alt={`${product.name} thumbnail ${index + 1}`}
                                    loading="lazy"
                                    decoding="async"
                                />
                            </button>
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
                            className={`pd-main-image ${isZoomActive ? 'pd-main-image--zoom' : ''} ${isImageLoading ? 'is-loading' : ''}`}
                            onMouseEnter={handleImageMouseEnter}
                            onMouseLeave={handleImageMouseLeave}
                            onMouseMove={handleImageMouseMove}
                            onClick={handleMainImageClick}
                            role="button"
                            tabIndex={0}
                            aria-label="Open full screen image view"
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleMainImageClick();
                                }
                            }}
                        >
                            {galleryImages.length > 1 && (
                                <div className="pd-image-index" aria-live="polite">
                                    {visibleImageIndex + 1}/{galleryImages.length}
                                </div>
                            )}
                            {isImageLoading && <div className="pd-main-image-loader" aria-hidden="true"></div>}
                            <img
                                ref={mainImageRef}
                                src={effectiveImage}
                                alt={product.name}
                                loading="eager"
                                fetchPriority="high"
                                decoding="async"
                                className={isImageLoading ? 'is-loading' : 'is-loaded'}
                                style={zoomTransform || undefined}
                                onLoad={() => setIsImageLoading(false)}
                                onError={() => setIsImageLoading(false)}
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

                    <div className="pd-reviews-row" aria-label="Product rating summary">
                        <span className="pd-rating-stars">{renderRatingStars(ratingValue)}</span>
                        {hasReviews ? (
                            <>
                                <span className="pd-rating-value">{ratingValue.toFixed(1)}</span>
                                <span className="pd-rating-count">({reviewsCount} reviews)</span>
                            </>
                        ) : (
                            <span className="pd-rating-empty">No reviews yet</span>
                        )}
                    </div>

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

                    <p className="pd-price-tax-note">Inclusive of applicable taxes.</p>

                    <div className="pd-stock-row" role="status" aria-live="polite">
                        <span className={`pd-stock-pill ${effectiveStock > 0 ? 'in-stock' : 'out-stock'}`}>
                            {effectiveStock > 0 ? '✓ In stock' : 'Out of stock'}
                        </span>
                    </div>

                    {Array.isArray(product.variants) && product.variants.length > 0 && (
                        <section className="pd-variants-gallery pd-variants-gallery--inline">
                            <div className="pd-variants-gallery-header">
                                <span className="pd-variants-label">{variantSelectorLabel}</span>
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
                                                if (variant.image) handleSelectMainImage(variant.image);
                                            }}
                                            aria-pressed={variant.sku === selectedVariantSku}
                                        >
                                            <div className="pd-variant-thumb-image-wrap">
                                                {thumbSrc ? (
                                                    <img
                                                        src={thumbSrc}
                                                        alt={buildVariantDisplayName(variant)}
                                                        loading="lazy"
                                                        decoding="async"
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
                            ref={addToCartRef}
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

                    <div className="pd-assurance">
                        <div className="pd-assurance-item">
                            <span className="pd-assurance-icon">🚚</span>
                            <div>
                                <strong>Delivery</strong>
                                <p>Nairobi: same/next day. Outside Nairobi: 1-3 business days.</p>
                            </div>
                        </div>
                        <div className="pd-assurance-item">
                            <span className="pd-assurance-icon">💳</span>
                            <div>
                                <strong>Secure payment</strong>
                                <p>M-Pesa, card, and other available checkout methods.</p>
                            </div>
                        </div>
                        <div className="pd-assurance-item">
                            <span className="pd-assurance-icon">↩</span>
                            <div>
                                <strong>Returns</strong>
                                <p>Easy return process for eligible products.</p>
                            </div>
                        </div>
                    </div>

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

            <ProductDescriptionSection html={product.description} specs={product.specs} keyFeatures={product.keyFeatures} />

            {relatedProducts.length > 0 && (
                <section className="pd-related">
                    <div className="pd-related-header">
                        <div>
                            <h2 className="pd-related-title">You may also like</h2>
                            <p className="pd-related-subtitle">Customers also viewed these products</p>
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

            <section className="pd-faq" aria-label="Frequently asked questions">
                <h2 className="pd-faq-title">Frequently Asked Questions</h2>
                <p className="pd-faq-subtitle">Quick answers to common questions before checkout.</p>
                <div className="pd-faq-list">
                    <details className="pd-faq-item">
                        <summary>
                            <span>Will this case fit my iPhone model?</span>
                            <span className="pd-faq-icon" aria-hidden="true">+</span>
                        </summary>
                        <p>Select your exact model from the option list before adding to cart.</p>
                    </details>
                    <details className="pd-faq-item">
                        <summary>
                            <span>How long does delivery take in Kenya?</span>
                            <span className="pd-faq-icon" aria-hidden="true">+</span>
                        </summary>
                        <p>Nairobi orders are usually same or next day, and upcountry orders take 1-3 business days.</p>
                    </details>
                    <details className="pd-faq-item">
                        <summary>
                            <span>Which payment methods are available?</span>
                            <span className="pd-faq-icon" aria-hidden="true">+</span>
                        </summary>
                        <p>You can pay using the methods shown at checkout, including M-Pesa and card where available.</p>
                    </details>
                    <details className="pd-faq-item">
                        <summary>
                            <span>Can I return an item?</span>
                            <span className="pd-faq-icon" aria-hidden="true">+</span>
                        </summary>
                        <p>Eligible products can be returned through our simple returns process.</p>
                    </details>
                </div>
            </section>
            {isLightboxOpen && (
                <div
                    className="pd-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Product image preview"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        type="button"
                        className="pd-lightbox-close"
                        aria-label="Close image preview"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        ×
                    </button>
                    <div className="pd-lightbox-image-wrap" onClick={(event) => event.stopPropagation()}>
                        {galleryImages.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className="pd-lightbox-nav pd-lightbox-nav--prev"
                                    aria-label="Previous image"
                                    onClick={() => handleCycleImage(-1)}
                                >
                                    ‹
                                </button>
                                <button
                                    type="button"
                                    className="pd-lightbox-nav pd-lightbox-nav--next"
                                    aria-label="Next image"
                                    onClick={() => handleCycleImage(1)}
                                >
                                    ›
                                </button>
                            </>
                        )}
                        <img
                            src={effectiveImage}
                            alt={`${product.name} preview`}
                            className="pd-lightbox-image"
                            loading="eager"
                            decoding="async"
                        />
                        {galleryImages.length > 1 && (
                            <div className="pd-lightbox-index" aria-live="polite">
                                {visibleImageIndex + 1}/{galleryImages.length}
                            </div>
                        )}
                        <div
                            className="pd-lightbox-swipe-layer"
                            onTouchStart={handleLightboxTouchStart}
                            onTouchEnd={handleLightboxTouchEnd}
                            aria-hidden="true"
                        ></div>
                    </div>
                </div>
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
            {showStickyPurchaseBar && (
                <div className="pd-sticky-purchase" role="region" aria-label="Quick add to cart">
                    <div className="pd-sticky-product">
                        <strong>{product.name}</strong>
                        <span>KSh {effectivePrice.toLocaleString()}</span>
                    </div>
                    <button
                        className="pd-sticky-add"
                        onClick={handleAddToCart}
                        disabled={effectiveStock <= 0}
                    >
                        {effectiveStock <= 0 ? 'Out of stock' : 'Add to cart'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
