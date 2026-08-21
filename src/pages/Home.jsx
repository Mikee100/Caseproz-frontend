import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import ProductCard from '../components/ProductCard';
import SkeletonProduct from '../components/SkeletonProduct';
import ErrorBanner from '../components/ErrorBanner';
import { apiFetch, ApiError } from '../utils/apiClient';
import SeoMeta from '../components/SeoMeta';
import {
    buildLocalBusinessSchema,
    buildOrganizationSchema,
    buildWebSiteSchema,
    DEFAULT_OG_IMAGE,
    SITE_URL,
    SOCIAL_PROFILES,
} from '../utils/seo';
import { trackEvent } from '../utils/analytics';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

const SHOW_PHONE_CASES = false;
const NEWEST_PAGE_SIZE = 16;
const FEATURED_PAGE_SIZE = 24;
const ON_SALE_PAGE_SIZE = 24;
const HOME_GRID_SIZE = 6;

const isCaseProduct = (product) => {
    const category = String(product?.category || '').toLowerCase();
    const subCategory = String(product?.subCategory || '').toLowerCase();
    const name = String(product?.name || '').toLowerCase();
    const tags = Array.isArray(product?.categories)
        ? product.categories.map((c) => String(c || '').toLowerCase())
        : [];

    return (
        category.includes('case') ||
        subCategory.includes('case') ||
        name.includes(' case') ||
        tags.some((tag) => tag.includes('case'))
    );
};

const isAnkerProduct = (product) => {
    const brand = String(product?.brand || '').toLowerCase();
    const name = String(product?.name || '').toLowerCase();
    return brand.includes('anker') || name.includes('anker');
};

const isSoundcoreProduct = (product) => {
    const brand = String(product?.brand || '').toLowerCase();
    const name = String(product?.name || '').toLowerCase();
    return brand.includes('soundcore') || name.includes('soundcore');
};


const renderHomeSkeletonGrid = (count = 8) => (
    <div className="product-grid home-skeleton-grid" aria-busy="true" aria-live="polite">
        {Array.from({ length: count }).map((_, idx) => (
            <SkeletonProduct key={`home-skeleton-${idx}`} />
        ))}
    </div>
);

const formatKes = (value) => `KES ${Number(value || 0).toLocaleString()}`;

const getProductTimestamp = (product) => {
    const candidates = [
        product?.createdAt,
        product?.created_at,
        product?.dateAdded,
        product?.date_added,
        product?.dateCreated,
        product?.date_created,
        product?.updatedAt,
        product?.updated_at,
    ];

    for (const candidate of candidates) {
        const parsed = Date.parse(candidate);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }

    return 0;
};

const isProductMarkedNew = (product) => (
    Boolean(product?.isNew) ||
    Boolean(product?.new) ||
    Boolean(product?.is_new)
);

const hasRealDiscount = (product) => Number(product?.originalPrice || 0) > Number(product?.price || 0);

const getHeroOrder = (product) => {
    const value = Number(product?.heroOrder);
    return Number.isFinite(value) ? value : 100;
};

const getDiscountPercent = (product) => {
    const original = Number(product?.originalPrice || 0);
    const current = Number(product?.price || 0);
    if (original <= 0 || current <= 0 || current >= original) return 0;
    return Math.round(((original - current) / original) * 100);
};

const cleanText = (value = '') => String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const truncateText = (value = '', max = 90) => {
    const text = cleanText(value);
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1).trim()}...`;
};

const isValidArrivalTeaserLine = (value = '') => {
    const text = cleanText(value);
    if (!text) return false;

    // Skip generic promo/shipping/coupon text that does not describe product attributes.
    const promoPattern = /(free\s+delivery|free\s+shipping|orders?\s+over|order\s+over|shop\s+now|buy\s+now|limited\s+time|deal|discount|coupon|warranty\s+registration|manuals?\s*&\s*downloads|contact\s+us|log\s*in|sign\s*up|subscribe|returns?\s+policy|privacy\s+policy|terms?\s+of\s+service)/i;
    if (promoPattern.test(text)) return false;

    // Skip URL-like / navigation-like text fragments.
    if (/(https?:\/\/|www\.|\.com\b|\.co\b|\/product\/)/i.test(text)) return false;

    return text.length >= 8;
};

const buildArrivalTeaser = (product) => {
    const feature = Array.isArray(product?.keyFeatures)
        ? product.keyFeatures.map((item) => cleanText(item)).find((line) => isValidArrivalTeaserLine(line))
        : '';

    if (feature) {
        return truncateText(feature, 88);
    }

    const specs = product?.specs;
    if (Array.isArray(specs)) {
        const firstSpec = specs.find((item) => item && typeof item === 'object' && (item.key || item.label) && (item.value || item.val));
        if (firstSpec) {
            const key = cleanText(firstSpec.key || firstSpec.label);
            const value = cleanText(firstSpec.value || firstSpec.val);
            const specLine = `${key}: ${value}`;
            if (key && value && isValidArrivalTeaserLine(specLine)) return truncateText(specLine, 88);
        }
    } else if (specs && typeof specs === 'object') {
        const firstEntry = Object.entries(specs).find(([key, value]) => {
            if (!Number.isNaN(Number(key))) return false;
            const specLine = `${cleanText(key)}: ${cleanText(value)}`;
            return isValidArrivalTeaserLine(specLine);
        });
        if (firstEntry) {
            const [key, value] = firstEntry;
            return truncateText(`${cleanText(key)}: ${cleanText(value)}`, 88);
        }
    }

    const description = cleanText(product?.description || '');
    if (description && isValidArrivalTeaserLine(description)) {
        return truncateText(description, 88);
    }

    return truncateText(product?.name || '', 88);
};

const buildHeroDescription = (product) => {
    if (!product) return 'Premium electronics built for everyday performance.';

    if (Array.isArray(product.keyFeatures) && product.keyFeatures.length > 0) {
        return product.keyFeatures
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .slice(0, 3)
            .join(' • ');
    }

    const description = String(product.description || '').trim();
    if (description) {
        return description.length > 110 ? `${description.slice(0, 107)}...` : description;
    }

    const subCategory = String(product.subCategory || '').trim();
    const category = String(product.category || '').trim();
    if (subCategory && category) {
        return `${subCategory} • ${category}`;
    }

    return subCategory || category || 'Premium electronics built for everyday performance.';
};

const Home = () => {
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { isFavourite, toggleFavourite } = useFavorites();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [onSaleProducts, setOnSaleProducts] = useState([]);
    const [loadingNewest, setLoadingNewest] = useState(true);
    const [error, setError] = useState('');
    const [heroIndex, setHeroIndex] = useState(0);
    const [heroPaused, setHeroPaused] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const [showBelowFoldSections, setShowBelowFoldSections] = useState(false);
    const heroTouchStartX = useRef(null);
    const heroResumeTimeoutRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        const fetchProducts = async () => {
            const baseUrl = `${import.meta.env.VITE_API_URL}/api/products`;

            try {
                const newestData = await apiFetch(
                    `${baseUrl}?page=1&pageSize=${NEWEST_PAGE_SIZE}&sort=newest&isActive=true`
                );
                if (isMounted) {
                    setProducts(Array.isArray(newestData?.products) ? newestData.products : []);
                }
            } catch (err) {
                console.error('Error fetching newest products:', err);
                if (err instanceof ApiError) {
                    if (isMounted) setError(err.message || 'We could not load products right now.');
                } else {
                    if (isMounted) setError('We could not load products right now. Please refresh in a moment.');
                }
            } finally {
                if (isMounted) setLoadingNewest(false);
            }

            // Defer non-critical sections so first paint is not blocked by extra payload.
            const runDeferredFetch = async () => {
                const [featuredResult, onSaleResult] = await Promise.allSettled([
                    apiFetch(`${baseUrl}?page=1&pageSize=${FEATURED_PAGE_SIZE}&sort=hero&isActive=true&isFeatured=true`),
                    apiFetch(`${baseUrl}?page=1&pageSize=${ON_SALE_PAGE_SIZE}&sort=newest&isActive=true&onSale=true`),
                ]);

                if (!isMounted) return;

                if (featuredResult.status === 'fulfilled') {
                    setFeaturedProducts(Array.isArray(featuredResult.value?.products) ? featuredResult.value.products : []);
                } else {
                    console.error('Error fetching featured products:', featuredResult.reason);
                }

                if (onSaleResult.status === 'fulfilled') {
                    setOnSaleProducts(Array.isArray(onSaleResult.value?.products) ? onSaleResult.value.products : []);
                } else {
                    console.error('Error fetching on-sale products:', onSaleResult.reason);
                }
            };

            if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(runDeferredFetch, { timeout: 1200 });
            } else {
                setTimeout(runDeferredFetch, 0);
            }
        };

        fetchProducts();

        return () => {
            isMounted = false;
        };
    }, []);

    const trackHomeClick = (eventName, section, label, metadata = {}) => {
        trackEvent(eventName, {
            page: 'home',
            section,
            label,
            metadata,
        });
    };

    const sortedNewest = useMemo(
        () => [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        [products]
    );

    const activeMerchPool = useMemo(() => (
        SHOW_PHONE_CASES ? sortedNewest : sortedNewest.filter((p) => !isCaseProduct(p))
    ), [sortedNewest]);

    const focusPool = useMemo(() => {
        const focused = activeMerchPool.filter((p) => isAnkerProduct(p) || isSoundcoreProduct(p));
        return focused.length > 0 ? focused : activeMerchPool;
    }, [activeMerchPool]);

    const newArrivalsProducts = useMemo(() => {
        const filtered = activeMerchPool.filter((p) => isAnkerProduct(p) || isSoundcoreProduct(p));
        if (filtered.length === 0) return [];

        return [...filtered]
            .sort((a, b) => getProductTimestamp(b) - getProductTimestamp(a))
            .slice(0, 6);
    }, [activeMerchPool]);

    const newestArrivalTimestamp = newArrivalsProducts.length > 0
        ? getProductTimestamp(newArrivalsProducts[0])
        : 0;

    const shouldRenderNewArrivals = loadingNewest || newArrivalsProducts.length > 0;

    const productCount = products.length;
    const heroCarouselProducts = useMemo(() => {
        const featuredFocus = featuredProducts.filter((p) => {
            if (!p) return false;
            if (!SHOW_PHONE_CASES && isCaseProduct(p)) return false;
            return isAnkerProduct(p) || isSoundcoreProduct(p);
        });

        if (featuredFocus.length > 0) {
            return [...featuredFocus]
                .sort((a, b) => {
                    const orderDelta = getHeroOrder(a) - getHeroOrder(b);
                    if (orderDelta !== 0) return orderDelta;
                    return getProductTimestamp(b) - getProductTimestamp(a);
                })
                .slice(0, 5);
        }

        return focusPool.slice(0, 5);
    }, [featuredProducts, focusPool]);

    const activeHeroProduct = heroCarouselProducts[heroIndex] || null;

    const soundcoreSpotlight = useMemo(
        () => focusPool.filter((p) => isSoundcoreProduct(p)).slice(0, HOME_GRID_SIZE),
        [focusPool]
    );
    const ankerSpotlight = useMemo(
        () => focusPool.filter((p) => isAnkerProduct(p)).slice(0, HOME_GRID_SIZE),
        [focusPool]
    );
    const soundcoreSectionProducts = soundcoreSpotlight.length > 0 ? soundcoreSpotlight : focusPool.slice(0, HOME_GRID_SIZE);
    const ankerSectionProducts = ankerSpotlight.length > 0 ? ankerSpotlight : focusPool.slice(0, HOME_GRID_SIZE);

    const featuredByFlag = (featuredProducts.length > 0
        ? featuredProducts
        : products.filter((p) => p.isFeatured)
    ).filter((p) => (SHOW_PHONE_CASES ? true : !isCaseProduct(p)));

    const customerFavorites = (featuredByFlag.length > 0 ? featuredByFlag : focusPool).slice(0, HOME_GRID_SIZE);

    const featuredSavingsProducts = useMemo(() => {
        const merged = [...onSaleProducts, ...activeMerchPool];
        const deduped = [];
        const seen = new Set();

        for (const item of merged) {
            if (!item?._id || seen.has(item._id)) continue;
            seen.add(item._id);
            deduped.push(item);
        }

        const discounted = deduped.filter((product) => {
            if (!product) return false;
            if (!SHOW_PHONE_CASES && isCaseProduct(product)) return false;
            return hasRealDiscount(product);
        });

        const focused = discounted.filter((p) => isAnkerProduct(p) || isSoundcoreProduct(p));
        const fallback = discounted.filter((p) => !(isAnkerProduct(p) || isSoundcoreProduct(p)));

        const ranked = [...focused, ...fallback].sort((a, b) => {
            const discountDelta = getDiscountPercent(b) - getDiscountPercent(a);
            if (discountDelta !== 0) return discountDelta;
            return getProductTimestamp(b) - getProductTimestamp(a);
        });

        return ranked.slice(0, 6);
    }, [onSaleProducts, activeMerchPool]);

    const shouldRenderFeaturedSavings = loadingNewest || featuredSavingsProducts.length > 0;

    const promoProducts = focusPool.slice(0, 3);

    useEffect(() => {
        if (heroIndex >= heroCarouselProducts.length) {
            setHeroIndex(0);
        }
    }, [heroCarouselProducts.length, heroIndex]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setPrefersReducedMotion(query.matches);
        update();

        if (query.addEventListener) {
            query.addEventListener('change', update);
            return () => query.removeEventListener('change', update);
        }

        query.addListener(update);
        return () => query.removeListener(update);
    }, []);

    useEffect(() => {
        if (prefersReducedMotion || heroPaused || heroCarouselProducts.length < 2) return;

        const timer = window.setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % heroCarouselProducts.length);
        }, 6000);

        return () => window.clearInterval(timer);
    }, [prefersReducedMotion, heroPaused, heroCarouselProducts.length]);

    useEffect(() => () => {
        if (heroResumeTimeoutRef.current) {
            window.clearTimeout(heroResumeTimeoutRef.current);
        }
    }, []);

    useEffect(() => {
        let timeoutId = null;
        let idleId = null;

        const revealBelowFold = () => setShowBelowFoldSections(true);

        if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
            idleId = window.requestIdleCallback(revealBelowFold, { timeout: 1600 });
        } else {
            timeoutId = window.setTimeout(revealBelowFold, 700);
        }

        return () => {
            if (idleId && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(idleId);
            }
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        };
    }, []);

    const pauseHeroAutoplayTemporarily = (ms = 9000) => {
        setHeroPaused(true);
        if (heroResumeTimeoutRef.current) {
            window.clearTimeout(heroResumeTimeoutRef.current);
        }
        heroResumeTimeoutRef.current = window.setTimeout(() => {
            setHeroPaused(false);
        }, ms);
    };

    const goToHeroSlide = (targetIndex) => {
        if (heroCarouselProducts.length === 0) return;
        setHeroIndex((targetIndex + heroCarouselProducts.length) % heroCarouselProducts.length);
        pauseHeroAutoplayTemporarily();
    };

    const goToNextHeroSlide = () => goToHeroSlide(heroIndex + 1);
    const goToPrevHeroSlide = () => goToHeroSlide(heroIndex - 1);

    const handleHeroTouchStart = (event) => {
        heroTouchStartX.current = event.targetTouches?.[0]?.clientX ?? null;
    };

    const handleHeroTouchEnd = (event) => {
        const startX = heroTouchStartX.current;
        const endX = event.changedTouches?.[0]?.clientX ?? null;
        if (startX === null || endX === null) return;

        const delta = startX - endX;
        if (Math.abs(delta) > 45) {
            if (delta > 0) goToNextHeroSlide();
            else goToPrevHeroSlide();
        }
        heroTouchStartX.current = null;
    };

    const handleHeroAddToCart = () => {
        if (!activeHeroProduct) return;
        addToCart(activeHeroProduct, 1);
        trackHomeClick('home_hero_add_to_cart', 'hero', activeHeroProduct.slug || activeHeroProduct._id || 'unknown');
    };

    const isArrivalProductNew = (product) => {
        if (!product) return false;
        if (isProductMarkedNew(product)) return true;

        const timestamp = getProductTimestamp(product);
        if (!timestamp || !newestArrivalTimestamp) return false;

        const ageInDays = Math.abs(newestArrivalTimestamp - timestamp) / (1000 * 60 * 60 * 24);
        return ageInDays <= 45;
    };

    const handleNewArrivalAddToCart = (product) => {
        if (!product) return;
        addToCart(product, 1);
        trackHomeClick('home_new_arrivals_add_to_cart', 'new_arrivals', product.slug || product._id || 'unknown');
    };

    const handleFeaturedSavingsAddToCart = (product) => {
        if (!product) return;
        if (Number(product?.stock || 0) <= 0) return;
        addToCart(product, 1);
        trackHomeClick('home_featured_savings_add_to_cart', 'featured_savings', product.slug || product._id || 'unknown');
    };

    const handleNewArrivalToggleFavourite = (event, product) => {
        event.preventDefault();
        event.stopPropagation();
        if (!product) return;

        if (!user) {
            navigate('/login');
            return;
        }

        toggleFavourite(product);
    };

    const onlineStoreSchema = buildOrganizationSchema({
        url: SITE_URL,
        logo: DEFAULT_OG_IMAGE,
        sameAs: SOCIAL_PROFILES,
        description:
            'CaseProz is a Kenyan ecommerce store for premium phone accessories, chargers, power banks, audio products and tech essentials.',
    });

    const webSiteSchema = buildWebSiteSchema({
        url: SITE_URL,
    });

    const homepageSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'CaseProz Kenya | Phone Cases, Accessories & Tech',
        description: 'Shop premium phone cases, chargers, power banks, audio products and tech accessories in Kenya. Quality products and convenient delivery from CaseProz.',
        url: SITE_URL,
        isPartOf: SITE_URL,
    };

    const storeSchema = buildLocalBusinessSchema({
        type: 'ElectronicsStore',
        image: DEFAULT_OG_IMAGE,
        url: SITE_URL,
        sameAs: SOCIAL_PROFILES,
        description:
            'Shop premium phone accessories, chargers, power banks and audio products at CaseProz, Simara Mall Nairobi.',
    });

    return (
        <div className="home-page caseproz-premium-home">
            <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                Premium Phone Cases and Tech Accessories in Kenya
            </h1>
            <SeoMeta
                title="CaseProz Kenya | Phone Cases, Accessories & Tech"
                description="Shop phone cases, chargers, power banks, earbuds and premium tech accessories in Kenya. Visit CaseProz at Simara Mall, Tom Mboya Street, Nairobi."
                keywords="phone accessories Kenya, chargers Nairobi, power banks Kenya, earbuds Nairobi, electronics store Nairobi CBD, CaseProz"
                canonicalPath="/"
                noIndex={productCount <= 0}
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(onlineStoreSchema)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify(webSiteSchema)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify(homepageSchema)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify(storeSchema)}
                </script>
            </Helmet>

            {error && <ErrorBanner message={error} />}

            <section
                className="home-premium-hero home-premium-hero-carousel"
                aria-label="Featured product carousel"
                onMouseEnter={() => setHeroPaused(true)}
                onMouseLeave={() => setHeroPaused(false)}
                onTouchStart={handleHeroTouchStart}
                onTouchEnd={handleHeroTouchEnd}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowRight') {
                        event.preventDefault();
                        goToNextHeroSlide();
                    }
                    if (event.key === 'ArrowLeft') {
                        event.preventDefault();
                        goToPrevHeroSlide();
                    }
                }}
            >
                <div className="container home-premium-hero-grid" tabIndex={0}>
                    {loadingNewest ? null : !activeHeroProduct ? (
                        <div className="home-hero-empty-state">
                            <h2 id="hero-title">Premium Electronics for Everyday Power</h2>
                            <p>Explore our latest Anker and Soundcore products.</p>
                            <Link to="/search" className="home-primary-cta">Shop now</Link>
                        </div>
                    ) : (
                        <>
                            <div
                                key={`hero-copy-${activeHeroProduct._id || heroIndex}`}
                                className="home-premium-hero-copy home-hero-copy-animated"
                                aria-live="polite"
                            >
                                <span className="hero-eyebrow">{String(activeHeroProduct.brand || 'CaseProz').toUpperCase()}</span>
                                <h2 id="hero-title">{activeHeroProduct.name}</h2>
                                <p>{buildHeroDescription(activeHeroProduct)}</p>

                                <div className="home-hero-price-wrap">
                                    {Number(activeHeroProduct?.originalPrice || 0) > Number(activeHeroProduct?.price || 0) && (
                                        <span className="home-hero-price-old">{formatKes(activeHeroProduct.originalPrice)}</span>
                                    )}
                                    <span className="home-hero-price-current">{formatKes(activeHeroProduct.price)}</span>
                                </div>

                                <div className="hero-actions">
                                    <button
                                        type="button"
                                        className="home-primary-cta"
                                        onClick={handleHeroAddToCart}
                                        aria-label={`Add ${activeHeroProduct.name} to cart`}
                                    >
                                        Add to cart
                                    </button>
                                    <Link
                                        to={`/product/${activeHeroProduct.slug}`}
                                        className="home-secondary-cta"
                                        onClick={() => trackHomeClick('home_hero_cta_click', 'hero', activeHeroProduct.slug || 'view_product')}
                                    >
                                        View product
                                    </Link>
                                </div>
                            </div>

                            <div className="home-premium-hero-stage" aria-label="Featured product image">
                                <Link
                                    to={`/product/${activeHeroProduct.slug}`}
                                    className="home-hero-primary home-hero-stage-animated"
                                    onClick={() => trackHomeClick('home_hero_product_click', 'hero_primary', activeHeroProduct.slug || 'unknown')}
                                >
                                    <img
                                        src={(Array.isArray(activeHeroProduct.images) && activeHeroProduct.images[0]) || '/placeholder-product.svg'}
                                        alt={activeHeroProduct.name || 'Featured product'}
                                        loading="eager"
                                        fetchPriority="high"
                                        decoding="async"
                                    />
                                </Link>

                                <div className="home-hero-controls" aria-label="Hero carousel controls">
                                    <button
                                        type="button"
                                        className="hero-nav-btn hero-nav-btn-prev"
                                        onClick={goToPrevHeroSlide}
                                        aria-label="Previous product"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    <div className="hero-dot-list" role="tablist" aria-label="Choose featured product slide">
                                        {heroCarouselProducts.map((item, index) => (
                                            <button
                                                key={item._id || `hero-dot-${index}`}
                                                type="button"
                                                role="tab"
                                                aria-selected={index === heroIndex}
                                                aria-label={`Go to slide ${index + 1}: ${item.name}`}
                                                className={`hero-dot ${index === heroIndex ? 'active' : ''}`}
                                                onClick={() => goToHeroSlide(index)}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        className="hero-nav-btn hero-nav-btn-next"
                                        onClick={goToNextHeroSlide}
                                        aria-label="Next product"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {shouldRenderNewArrivals && (
                <section className="home-new-arrivals" aria-labelledby="new-arrivals-title">
                    <div className="home-new-arrivals-strip">
                        <div className="container">
                            <h2 id="new-arrivals-title">NEW ARRIVALS</h2>
                        </div>
                    </div>

                    <div className="container home-new-arrivals-content">
                        {loadingNewest ? (
                            <div className="home-new-arrivals-grid home-new-arrivals-grid-skeleton" aria-busy="true" aria-live="polite">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                    <article key={`new-arrivals-skeleton-${idx}`} className="home-new-arrivals-item-skeleton" aria-hidden="true">
                                        <div className="home-new-arrivals-image-skeleton shimmer" />
                                        <div className="home-new-arrivals-line-skeleton shimmer" />
                                        <div className="home-new-arrivals-line-skeleton short shimmer" />
                                        <div className="home-new-arrivals-line-skeleton tiny shimmer" />
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="home-new-arrivals-grid" role="list">
                                    {newArrivalsProducts.map((product, index) => {
                                        const image = (Array.isArray(product?.images) && product.images[0]) || '/placeholder-product.svg';
                                        const secondaryImage = (Array.isArray(product?.images) && product.images[1]) || null;
                                        const hasSale = Number(product?.originalPrice || 0) > Number(product?.price || 0);

                                        return (
                                            <article key={product._id || product.slug || product.name} className="home-new-arrivals-item" role="listitem">
                                                <div className={`home-new-arrivals-image-wrap ${secondaryImage ? 'has-secondary-image' : ''}`}>
                                                    {isArrivalProductNew(product) && <span className="home-new-arrivals-badge">NEW!</span>}
                                                    <Link
                                                        to={`/product/${product.slug}`}
                                                        className="home-new-arrivals-image-link"
                                                        onClick={() => trackHomeClick('home_new_arrivals_product_click', 'new_arrivals', product.slug || product._id || 'unknown')}
                                                    >
                                                        <span className="home-new-arrivals-image-stage">
                                                            <img
                                                                className="home-new-arrivals-image-primary"
                                                                src={image}
                                                                alt={product.name || 'Product image'}
                                                                loading={index < 1 ? 'eager' : 'lazy'}
                                                                fetchPriority={index < 1 ? 'high' : 'auto'}
                                                                decoding="async"
                                                                width="520"
                                                                height="520"
                                                            />
                                                            {secondaryImage && (
                                                                <img
                                                                    className="home-new-arrivals-image-secondary"
                                                                    src={secondaryImage}
                                                                    alt={`${product.name || 'Product'} alternate view`}
                                                                    loading="lazy"
                                                                    fetchPriority="low"
                                                                    decoding="async"
                                                                    width="520"
                                                                    height="520"
                                                                />
                                                            )}
                                                        </span>
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        className="home-new-arrivals-fav-btn"
                                                        title={isFavourite(product._id) ? 'Remove from favourites' : 'Add to favourites'}
                                                        aria-label={isFavourite(product._id) ? `Remove ${product.name} from favourites` : `Add ${product.name} to favourites`}
                                                        onClick={(event) => handleNewArrivalToggleFavourite(event, product)}
                                                    >
                                                        <i className={isFavourite(product._id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                                                    </button>
                                                </div>

                                                {product.brand && <p className="home-new-arrivals-brand">{String(product.brand).toUpperCase()}</p>}

                                                <Link
                                                    to={`/product/${product.slug}`}
                                                    className="home-new-arrivals-name"
                                                    onClick={() => trackHomeClick('home_new_arrivals_product_click', 'new_arrivals_name', product.slug || product._id || 'unknown')}
                                                >
                                                    {product.name}
                                                </Link>

                                                <div className="home-new-arrivals-meta-row">
                                                    <div className="home-new-arrivals-price-wrap">
                                                        <span className="home-new-arrivals-price-current">{formatKes(product.price)}</span>
                                                        {hasSale && <span className="home-new-arrivals-price-old">{formatKes(product.originalPrice)}</span>}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="home-new-arrivals-add"
                                                        onClick={() => handleNewArrivalAddToCart(product)}
                                                        aria-label={`Add ${product.name} to cart`}
                                                    >
                                                        ADD TO CART
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                <div className="home-new-arrivals-footer">
                                    <Link
                                        to="/search"
                                        className="home-new-arrivals-view-all"
                                        onClick={() => trackHomeClick('home_new_arrivals_view_all_click', 'new_arrivals', 'view_all_new_arrivals')}
                                    >
                                        VIEW ALL NEW ARRIVALS <ChevronRight size={16} />
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            )}

            {shouldRenderFeaturedSavings && (
                <section className="home-featured-savings" aria-labelledby="featured-savings-title">
                    <div className="home-featured-savings-strip">
                        <div className="container">
                            <h2 id="featured-savings-title">FEATURED SAVINGS</h2>
                        </div>
                    </div>

                    <div className="container home-featured-savings-content">
                        {loadingNewest ? (
                            <div className="home-new-arrivals-grid home-new-arrivals-grid-skeleton" aria-busy="true" aria-live="polite">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                    <article key={`featured-savings-skeleton-${idx}`} className="home-new-arrivals-item-skeleton" aria-hidden="true">
                                        <div className="home-new-arrivals-image-skeleton shimmer" />
                                        <div className="home-new-arrivals-line-skeleton shimmer" />
                                        <div className="home-new-arrivals-line-skeleton short shimmer" />
                                        <div className="home-new-arrivals-line-skeleton tiny shimmer" />
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="home-new-arrivals-grid" role="list">
                                    {featuredSavingsProducts.map((product, index) => {
                                        const image = (Array.isArray(product?.images) && product.images[0]) || '/placeholder-product.svg';
                                        const secondaryImage = (Array.isArray(product?.images) && product.images[1]) || null;
                                        const discountPercent = getDiscountPercent(product);
                                        const outOfStock = Number(product?.stock || 0) <= 0;

                                        return (
                                            <article key={product._id || product.slug || product.name} className="home-new-arrivals-item home-featured-savings-item" role="listitem">
                                                <div className={`home-new-arrivals-image-wrap ${secondaryImage ? 'has-secondary-image' : ''}`}>
                                                    <span className="home-new-arrivals-badge home-featured-savings-badge">SALE{discountPercent > 0 ? ` -${discountPercent}%` : '!'}</span>
                                                    {outOfStock && <span className="home-featured-savings-stock-badge">OUT OF STOCK</span>}

                                                    <Link
                                                        to={`/product/${product.slug}`}
                                                        className="home-new-arrivals-image-link"
                                                        onClick={() => trackHomeClick('home_featured_savings_product_click', 'featured_savings', product.slug || product._id || 'unknown')}
                                                    >
                                                        <span className="home-new-arrivals-image-stage">
                                                            <img
                                                                className="home-new-arrivals-image-primary"
                                                                src={image}
                                                                alt={product.name || 'Product image'}
                                                                loading={index < 1 ? 'eager' : 'lazy'}
                                                                fetchPriority={index < 1 ? 'high' : 'auto'}
                                                                decoding="async"
                                                                width="520"
                                                                height="520"
                                                            />
                                                            {secondaryImage && (
                                                                <img
                                                                    className="home-new-arrivals-image-secondary"
                                                                    src={secondaryImage}
                                                                    alt={`${product.name || 'Product'} alternate view`}
                                                                    loading="lazy"
                                                                    fetchPriority="low"
                                                                    decoding="async"
                                                                    width="520"
                                                                    height="520"
                                                                />
                                                            )}
                                                        </span>
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        className="home-new-arrivals-fav-btn"
                                                        title={isFavourite(product._id) ? 'Remove from favourites' : 'Add to favourites'}
                                                        aria-label={isFavourite(product._id) ? `Remove ${product.name} from favourites` : `Add ${product.name} to favourites`}
                                                        onClick={(event) => handleNewArrivalToggleFavourite(event, product)}
                                                    >
                                                        <i className={isFavourite(product._id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                                                    </button>
                                                </div>

                                                {product.brand && <p className="home-new-arrivals-brand">{String(product.brand).toUpperCase()}</p>}

                                                <Link
                                                    to={`/product/${product.slug}`}
                                                    className="home-new-arrivals-name"
                                                    onClick={() => trackHomeClick('home_featured_savings_product_click', 'featured_savings_name', product.slug || product._id || 'unknown')}
                                                >
                                                    {product.name}
                                                </Link>

                                                <div className="home-new-arrivals-meta-row">
                                                    <div className="home-new-arrivals-price-wrap home-featured-savings-price-wrap">
                                                        <span className="home-new-arrivals-price-old">{formatKes(product.originalPrice)}</span>
                                                        <span className="home-new-arrivals-price-current">{formatKes(product.price)}</span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="home-new-arrivals-add"
                                                        onClick={() => handleFeaturedSavingsAddToCart(product)}
                                                        disabled={outOfStock}
                                                        aria-label={outOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
                                                    >
                                                        {outOfStock ? 'UNAVAILABLE' : 'ADD TO CART'}
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                <div className="home-new-arrivals-footer">
                                    <Link
                                        to="/search?onSale=true"
                                        className="home-new-arrivals-view-all"
                                        onClick={() => trackHomeClick('home_featured_savings_view_all_click', 'featured_savings', 'view_all_savings')}
                                    >
                                        VIEW ALL SAVINGS <ChevronRight size={16} />
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            )}

            {showBelowFoldSections && (
                <>
            <section className="home-brand-hero container" aria-label="Shop by brand">
                <div className="section-header">
                    <div className="title-area">
                        <span className="subtitle">SHOP BY BRAND</span>
                        <h2 className="main-title">Choose Your Brand</h2>
                    </div>
                </div>
                <div className="home-brand-hero-grid">
                    <Link
                        to="/search?q=anker"
                        className="home-brand-hero-card home-brand-hero-anker"
                        onClick={() => trackHomeClick('home_brand_hero_click', 'brand_hero', 'anker')}
                    >
                        <span className="home-brand-hero-eyebrow">ANKER</span>
                        <h3>Anker</h3>
                        <p>Power, charging and everyday tech essentials.</p>
                        <span className="home-brand-hero-cta">Shop Anker <ChevronRight size={16} /></span>
                    </Link>

                    <Link
                        to="/search?q=soundcore"
                        className="home-brand-hero-card home-brand-hero-soundcore"
                        onClick={() => trackHomeClick('home_brand_hero_click', 'brand_hero', 'soundcore')}
                    >
                        <span className="home-brand-hero-eyebrow">SOUNDCORE</span>
                        <h3>Soundcore</h3>
                        <p>Immersive audio for every moment.</p>
                        <span className="home-brand-hero-cta">Shop Soundcore <ChevronRight size={16} /></span>
                    </Link>
                </div>
            </section>

            <section className="container home-mid-banner" aria-label="Anker and Soundcore banner">
                <img
                    src="/1772589843.jfif"
                    alt="Anker and Soundcore top banner"
                    loading="lazy"
                    decoding="async"
                    width="852"
                    height="350"
                />
            </section>

            <section className="featured-section container home-theme-section home-theme-section-soundcore">
                <div className="section-header">
                    <div className="title-area">
                        <span className="subtitle">EXPERIENCE SOUNDCORE</span>
                        <h2 className="main-title">Immersive Sound. Smarter Listening.</h2>
                    </div>
                    <Link
                        to="/search?q=soundcore"
                        className="view-all"
                        onClick={() => trackHomeClick('home_section_cta_click', 'soundcore_spotlight', 'shop_soundcore')}
                    >
                        Shop Soundcore <ChevronRight size={16} />
                    </Link>
                </div>

                {loadingNewest ? (
                    renderHomeSkeletonGrid(4)
                ) : (
                    <div className="product-grid">
                        {soundcoreSectionProducts.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </section>

            <section className="featured-section container home-theme-section home-theme-section-anker">
                <div className="section-header">
                    <div className="title-area">
                        <span className="subtitle">POWER &amp; CHARGE WITH ANKER</span>
                        <h2 className="main-title">Reliable Power for Everyday Use</h2>
                    </div>
                    <Link
                        to="/search?q=anker"
                        className="view-all"
                        onClick={() => trackHomeClick('home_section_cta_click', 'anker_spotlight', 'shop_anker')}
                    >
                        Shop Anker <ChevronRight size={16} />
                    </Link>
                </div>

                {loadingNewest ? (
                    renderHomeSkeletonGrid(4)
                ) : (
                    <div className="product-grid">
                        {ankerSectionProducts.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </section>

            <section className="featured-section container">
                <div className="section-header">
                    <div className="title-area">
                        <span className="subtitle">CUSTOMER FAVORITES</span>
                        <h2 className="main-title">Top Picks This Week</h2>
                    </div>
                    <Link to="/search" className="view-all">
                        Shop all <ChevronRight size={16} />
                    </Link>
                </div>
                {loadingNewest ? (
                    renderHomeSkeletonGrid(4)
                ) : (
                    <div className="product-grid">
                        {customerFavorites.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </section>

            <section className="container home-premium-promo" aria-label="Promotional banner">
                <div className="home-premium-promo-copy">
                    <span className="promo-eyebrow">UPGRADE YOUR EVERYDAY TECH</span>
                    <h2>Premium Anker and Soundcore products, available in Kenya.</h2>
                    <p>
                        Shop dependable charging, immersive audio and practical electronics for home,
                        office and travel.
                    </p>
                    <Link to="/search" className="home-primary-cta">
                        Explore Collection
                    </Link>
                </div>
                <div className="home-premium-promo-media">
                    {promoProducts.map((item) => {
                        const image = (Array.isArray(item?.images) && item.images[0]) || '/placeholder-product.svg';
                        return (
                            <Link key={item._id} to={`/product/${item.slug}`} className="home-premium-promo-item">
                                <img src={image} alt={item.name} loading="lazy" decoding="async" />
                            </Link>
                        );
                    })}
                </div>
            </section>
                </>
            )}

        </div>
    );
};

export default Home;
