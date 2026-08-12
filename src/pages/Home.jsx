import React, { useState, useEffect } from 'react';
import HomeSlider from '../components/HomeSlider';
import CategoryShowcase from '../components/CategoryShowcase';
import ProductCard from '../components/ProductCard';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import ErrorBanner from '../components/ErrorBanner';
import { apiFetch, ApiError } from '../utils/apiClient';
import SeoMeta from '../components/SeoMeta';
import { trackEvent } from '../utils/analytics';

const CASE_STYLE_DEFINITIONS = [
    { key: 'silicone', label: 'Silicone', searchQuery: 'silicone', terms: ['silicone'] },
    { key: 'leopard', label: 'Leopard', searchQuery: 'leopard', terms: ['leopard'] },
    { key: 'magsafe', label: 'MagSafe', searchQuery: 'magsafe', terms: ['magsafe', 'mag safe'] },
    { key: 'rugged', label: 'Rugged', searchQuery: 'rugged', terms: ['rugged', 'shockproof'] },
    { key: 'clear', label: 'Clear', searchQuery: 'clear', terms: ['clear', 'transparent'] },
    { key: 'leather', label: 'Leather', searchQuery: 'leather', terms: ['leather'] },
];

const PHONE_MODEL_LINKS = [
    { label: 'iPhone 17 Pro Max', path: '/category/iphone-17-pro-max-case' },
    { label: 'iPhone 17 Pro', path: '/category/iphone-17-pro-case' },
    { label: 'iPhone 16 Pro Max', path: '/category/iphone-16-pro-max-case' },
    { label: 'Galaxy S26', path: '/category/galaxy-s26-case' },
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

    const productCount = products.length;

    return (
        <div className="home-page">
            <SeoMeta
                title="CaseProz | Premium Tech, Cases & Accessories in Kenya"
                description="Shop premium phone cases, chargers, audio, power and accessories at CaseProz. Fast delivery across Kenya and curated picks from brands like Anker, Soundcore, Samsung and more."
                keywords="CaseProz, phone cases Kenya, Anker Kenya, chargers, power banks, headphones, electronics accessories Nairobi"
                canonicalPath="/"
                noIndex={productCount <= 0}
            />

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

            <section className="home-model-fit container">
                <div className="section-header">
                    <div className="title-area">
                        <span className="subtitle">SHOP BY PHONE MODEL</span>
                        <h2 className="main-title">Find Your Exact Fit</h2>
                        <p className="home-model-fit-note">Jump directly into cases made for your exact device.</p>
                    </div>
                </div>
                <div className="home-model-fit-row">
                    {PHONE_MODEL_LINKS.map((item) => (
                        <Link
                            key={item.label}
                            to={item.path}
                            className="home-model-fit-pill"
                            onClick={() =>
                                trackHomeClick('home_model_fit_click', 'model_fit', item.label)
                            }
                        >
                            <span className="home-model-fit-pill-title">{item.label}</span>
                            <span className="home-model-fit-pill-cta">Shop fit</span>
                        </Link>
                    ))}
                </div>
            </section>

            <CategoryShowcase products={products} />

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
                    <div className="loading-state">Loading products...</div>
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

        </div>
    );
};

export default Home;
