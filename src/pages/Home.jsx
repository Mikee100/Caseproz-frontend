import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import HomeSlider from '../components/HomeSlider';
import CategoryShowcase from '../components/CategoryShowcase';
import ProductCard from '../components/ProductCard';
import SkeletonProduct from '../components/SkeletonProduct';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import ErrorBanner from '../components/ErrorBanner';
import { apiFetch, ApiError } from '../utils/apiClient';
import SeoMeta from '../components/SeoMeta';
import {
    DEFAULT_OG_IMAGE,
    SITE_URL,
    SOCIAL_PROFILES,
    SUPPORT_EMAIL,
    SUPPORT_PHONE,
} from '../utils/seo';
import { trackEvent } from '../utils/analytics';

const CASE_STYLE_DEFINITIONS = [
    { key: 'silicone', label: 'Silicone', searchQuery: 'silicone', terms: ['silicone'] },
    { key: 'leopard', label: 'Leopard', searchQuery: 'leopard', terms: ['leopard'] },
    { key: 'magsafe', label: 'MagSafe', searchQuery: 'magsafe', terms: ['magsafe', 'mag safe'] },
    { key: 'rugged', label: 'Rugged', searchQuery: 'rugged', terms: ['rugged', 'shockproof'] },
    { key: 'clear', label: 'Clear', searchQuery: 'clear', terms: ['clear', 'transparent'] },
    { key: 'leather', label: 'Leather', searchQuery: 'leather', terms: ['leather'] },
];

const BUNDLE_SAVE_ITEMS = [
    {
        key: 'case-screen-protector',
        title: 'Case + Screen Protector',
        description: 'Protect both screen and body in one go with a practical everyday combo.',
        path: '/search?q=case%20screen%20protector',
        badge: 'Popular Bundle',
    },
    {
        key: 'charger-cable',
        title: 'Charger + Cable',
        description: 'Get a reliable charging setup for home, office, or travel at a better combined value.',
        path: '/search?q=charger%20cable',
        badge: 'Power Bundle',
    },
];

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

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildCaseStyleHaystack = (product) => {
    const name = String(product?.name || '').toLowerCase();
    const category = String(product?.category || '').toLowerCase();
    const subCategory = String(product?.subCategory || '').toLowerCase();
    const categories = Array.isArray(product?.categories)
        ? product.categories.map((c) => String(c || '').toLowerCase()).join(' ')
        : '';
    const variantLabels = Array.isArray(product?.variants)
        ? product.variants.map((v) => String(v?.label || '').toLowerCase()).join(' ')
        : '';
    const variantStyles = Array.isArray(product?.variants)
        ? product.variants.map((v) => String(v?.style || '').toLowerCase()).join(' ')
        : '';

    return `${name} ${category} ${subCategory} ${categories} ${variantLabels} ${variantStyles}`;
};

const matchesAnyCaseStyleTerm = (haystack, terms = []) => {
    if (!haystack || !terms.length) return false;

    return terms.some((term) => {
        const safeTerm = escapeRegex(term.toLowerCase().trim());
        if (!safeTerm) return false;
        const pattern = new RegExp(`(^|[^a-z0-9])${safeTerm}([^a-z0-9]|$)`, 'i');
        return pattern.test(haystack);
    });
};

const pickBalancedProducts = (list, options = {}) => {
    const {
        total = 8,
        maxCaseItems = 3,
        minNonCaseItems = 4,
        excludeIds = new Set(),
    } = options;

    const nonCases = [];
    const cases = [];

    for (const item of list) {
        if (!item?._id || excludeIds.has(item._id)) continue;
        if (isCaseProduct(item)) {
            cases.push(item);
        } else {
            nonCases.push(item);
        }
    }

    const selected = [];
    const addUntil = (source, limit) => {
        for (const item of source) {
            if (selected.length >= limit) break;
            selected.push(item);
        }
    };

    addUntil(nonCases, Math.min(minNonCaseItems, total));
    addUntil(cases, Math.min(total, selected.length + maxCaseItems));

    if (selected.length < total) {
        addUntil(nonCases.slice(selected.length), total);
    }

    if (selected.length < total) {
        addUntil(cases.slice(maxCaseItems), total);
    }

    return selected.slice(0, total);
};

const renderHomeSkeletonGrid = (count = 8) => (
    <div className="product-grid home-skeleton-grid" aria-busy="true" aria-live="polite">
        {Array.from({ length: count }).map((_, idx) => (
            <SkeletonProduct key={`home-skeleton-${idx}`} />
        ))}
    </div>
);

const Home = () => {
    const [products, setProducts] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [onSaleProducts, setOnSaleProducts] = useState([]);
    const [loadingNewest, setLoadingNewest] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            const baseUrl = `${import.meta.env.VITE_API_URL}/api/products`;

            try {
                const newestData = await apiFetch(`${baseUrl}?page=1&pageSize=36&sort=newest&isActive=true`);
                setProducts(Array.isArray(newestData?.products) ? newestData.products : []);
            } catch (err) {
                console.error('Error fetching newest products:', err);
                if (err instanceof ApiError) {
                    setError(err.message || 'We could not load products right now.');
                } else {
                    setError('We could not load products right now. Please refresh in a moment.');
                }
            } finally {
                setLoadingNewest(false);
            }

            const [featuredResult, onSaleResult] = await Promise.allSettled([
                apiFetch(`${baseUrl}?page=1&pageSize=24&sort=newest&isActive=true&isFeatured=true`),
                apiFetch(`${baseUrl}?page=1&pageSize=24&sort=newest&isActive=true&onSale=true`),
            ]);

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

        fetchProducts();
    }, []);

    const trackHomeClick = (eventName, section, label, metadata = {}) => {
        trackEvent(eventName, {
            page: 'home',
            section,
            label,
            metadata,
        });
    };

    const onSale = onSaleProducts.length > 0 ? onSaleProducts : products.filter((p) => p.onSale);
    const sortedNewest = [...products]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const allCaseProducts = sortedNewest.filter((p) => isCaseProduct(p));
    const caseFamilyCards = CASE_STYLE_DEFINITIONS.map((def) => {
        const matches = allCaseProducts.filter((p) => {
            const haystack = buildCaseStyleHaystack(p);
            return matchesAnyCaseStyleTerm(haystack, def.terms);
        });

        return {
            ...def,
            count: matches.length,
            image:
                matches.find((p) => Array.isArray(p.images) && p.images[0])?.images?.[0] ||
                '/placeholder-product.svg',
        };
    }).filter((card) => card.count > 0);

    const latest = pickBalancedProducts(sortedNewest, {
        total: 8,
        maxCaseItems: 3,
        minNonCaseItems: 4,
    });

    const featuredByFlag = featuredProducts.length > 0
        ? featuredProducts.slice(0, 12)
        : products.filter((p) => p.isFeatured).slice(0, 12);
    const bestSellerCandidates = featuredByFlag.length > 0 ? featuredByFlag : (onSale.length > 0 ? onSale : products);
    const latestIds = new Set(latest.map((p) => p._id));
    const bestSellers = pickBalancedProducts(bestSellerCandidates, {
        total: 8,
        maxCaseItems: 3,
        minNonCaseItems: 4,
        excludeIds: latestIds,
    });

    const nonCaseSpotlight = sortedNewest
        .filter((p) => !isCaseProduct(p))
        .slice(0, 8);

    const ankerSpotlight = sortedNewest
        .filter((p) => isAnkerProduct(p))
        .slice(0, 8);

    const soundcoreSpotlight = sortedNewest
        .filter((p) => isSoundcoreProduct(p))
        .slice(0, 8);

    const productCount = products.length;

    const onlineStoreSchema = {
        '@context': 'https://schema.org',
        '@type': 'OnlineStore',
        name: 'CaseProz',
        url: SITE_URL,
        logo: DEFAULT_OG_IMAGE,
        description: 'Shop premium phone cases, covers, screen protectors, Anker chargers & tech accessories in Nairobi, Kenya.',
        priceRange: 'KSh',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Nairobi CBD',
            addressLocality: 'Nairobi',
            postalCode: '00100',
            addressCountry: 'KE',
        },
    };

    const localBusinessSchema = {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: 'CaseProz',
        image: DEFAULT_OG_IMAGE,
        url: SITE_URL,
        telephone: SUPPORT_PHONE,
        email: SUPPORT_EMAIL,
        priceRange: 'KSh',
        description: 'Premium phone cases, Anker chargers, screen protectors and mobile accessories. Fast delivery across Kenya.',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Nairobi CBD',
            addressLocality: 'Nairobi',
            addressRegion: 'Nairobi County',
            postalCode: '00100',
            addressCountry: 'KE',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: -1.2864,
            longitude: 36.8172,
        },
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '09:00',
                closes: '16:00',
            },
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Saturday'],
                opens: '09:00',
                closes: '12:00',
            },
        ],
        currenciesAccepted: 'KES',
        paymentAccepted: 'Cash, Mobile Money, Card, Pay on Delivery',
        areaServed: {
            '@type': 'Country',
            name: 'Kenya',
        },
        sameAs: SOCIAL_PROFILES,
    };

    return (
        <div className="home-page">
            <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                CaseProz - Buy Phone Cases, Covers &amp; Accessories in Kenya
            </h1>
            <SeoMeta
                title="Buy Phone Cases, Covers & Accessories in Kenya | CaseProz"
                description="Shop premium phone cases, chargers, audio, power and accessories at CaseProz. Fast delivery across Kenya with curated picks from Anker, Soundcore, Samsung and Apple."
                keywords="phone cases Kenya, iPhone cases Nairobi, Samsung covers Kenya, Anker Kenya, chargers, power banks, headphones, CaseProz"
                canonicalPath="/"
                noIndex={productCount <= 0}
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(onlineStoreSchema)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify(localBusinessSchema)}
                </script>
            </Helmet>

            <HomeSlider />

            {false && (
                <section className="home-case-families container">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">FEATURED CASE FAMILIES</span>
                            <h2 className="main-title">Shop by Case Style</h2>
                            <p className="home-case-families-note">Pick your look first, then choose your phone fit.</p>
                        </div>
                    </div>
                    <div className="home-case-style-grid">
                        {caseFamilyCards.map((card) => (
                            <Link
                                key={card.key}
                                to={`/search?q=${encodeURIComponent(card.searchQuery)}`}
                                className="home-case-style-card"
                                onClick={() =>
                                    trackHomeClick('home_case_family_click', 'case_families', card.key, {
                                        count: card.count,
                                    })
                                }
                            >
                                <div className="home-case-style-image-wrap">
                                    <img src={card.image} alt={`${card.label} case`} />
                                    <span className="home-case-style-chip">{card.label}</span>
                                </div>
                                <div className="home-case-style-meta">
                                    <h3>{card.label}</h3>
                                    <p>{card.count} products</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <CategoryShowcase products={products} />

            <section className="home-bundles container">
                <div className="section-header">
                    <div className="title-area">
                        <span className="subtitle">BUNDLE &amp; SAVE</span>
                        <h2 className="main-title">Shop Smart Combos</h2>
                    </div>
                </div>
                <div className="home-bundle-grid">
                    {BUNDLE_SAVE_ITEMS.map((bundle) => (
                        <Link
                            key={bundle.key}
                            to={bundle.path}
                            className="home-bundle-card"
                            onClick={() =>
                                trackHomeClick('home_bundle_click', 'bundle_save', bundle.key)
                            }
                        >
                            <span className="home-bundle-badge">{bundle.badge}</span>
                            <h3>{bundle.title}</h3>
                            <p>{bundle.description}</p>
                            <span className="home-bundle-cta">View bundle</span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="featured-section container">
                <div className="section-header">
                    <div className="title-area">
                        <span className="subtitle">JUST IN</span>
                        <h2 className="main-title">New Arrivals</h2>
                    </div>
                    <Link
                        to="/search?sort=newest"
                        className="view-all"
                        onClick={() => trackHomeClick('home_section_cta_click', 'new_arrivals', 'shop_new')}
                    >
                        Shop New <ChevronRight size={16} />
                    </Link>
                </div>

                {loadingNewest ? (
                    renderHomeSkeletonGrid(8)
                ) : (
                    <div className="product-grid">
                        {latest.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </section>

            {!loadingNewest && bestSellers.length > 0 && (
                <section className="featured-section container">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">CURATED</span>
                            <h2 className="main-title">Best Sellers</h2>
                        </div>
                        <Link
                            to="/search"
                            className="view-all"
                            onClick={() => trackHomeClick('home_section_cta_click', 'best_sellers', 'shop_the_edit')}
                        >
                            Shop the Edit <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="product-grid">
                        {bestSellers.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {!loadingNewest && nonCaseSpotlight.length > 0 && (
                <section className="featured-section container">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">BEYOND CASES</span>
                            <h2 className="main-title">Power, Audio & More</h2>
                        </div>
                        <Link
                            to="/search"
                            className="view-all"
                            onClick={() => trackHomeClick('home_section_cta_click', 'beyond_cases', 'shop_all_products')}
                        >
                            Shop All Products <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="product-grid">
                        {nonCaseSpotlight.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {!loadingNewest && ankerSpotlight.length > 0 && (
                <section className="home-anker-spotlight">
                    <div className="container">
                        <div className="section-header">
                            <div className="title-area">
                                <span className="subtitle">POWERED BY ANKER</span>
                                <h2 className="main-title">Only Anker Picks</h2>
                                <p className="home-anker-copy">
                                    Premium charging, audio and everyday essentials from Anker, curated for reliability.
                                </p>
                            </div>
                            <Link
                                to="/search?q=anker"
                                className="view-all"
                                onClick={() => trackHomeClick('home_section_cta_click', 'anker_spotlight', 'shop_anker')}
                            >
                                Shop Anker <ChevronRight size={16} />
                            </Link>
                        </div>

                        <div className="product-grid home-anker-grid">
                            {ankerSpotlight.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {!loadingNewest && soundcoreSpotlight.length > 0 && (
                <section className="home-soundcore-spotlight">
                    <div className="container">
                        <div className="section-header">
                            <div className="title-area">
                                <span className="subtitle">AUDIO BY SOUNDCORE</span>
                                <h2 className="main-title">Only Soundcore Picks</h2>
                                <p className="home-anker-copy">
                                    Signature sound, daily comfort and dependable battery life in one focused collection.
                                </p>
                            </div>
                            <Link
                                to="/search?q=soundcore"
                                className="view-all"
                                onClick={() => trackHomeClick('home_section_cta_click', 'soundcore_spotlight', 'shop_soundcore')}
                            >
                                Shop Soundcore <ChevronRight size={16} />
                            </Link>
                        </div>

                        <div className="product-grid home-anker-grid">
                            {soundcoreSpotlight.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

        </div>
    );
};

export default Home;
