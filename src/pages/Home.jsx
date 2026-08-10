import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import HomeSlider from '../components/HomeSlider';
import CategoryShowcase from '../components/CategoryShowcase';
import ProductCard from '../components/ProductCard';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import ErrorBanner from '../components/ErrorBanner';
import { apiFetch, ApiError } from '../utils/apiClient';
import SeoMeta from '../components/SeoMeta';
import { trackEvent } from '../utils/analytics';

const homeBrands = [
    'Anker',
    'Baseus',
    'Belkin',
    'DJI',
    'EcoFlow',
    'JBL',
    'Logitech',
    'Samsung',
    'Sandisk',
    'Soundcore',
];

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products`);
                setProducts(Array.isArray(data.products) ? data.products : []);
            } catch (err) {
                console.error('Error fetching products:', err);
                if (err instanceof ApiError) {
                    setError(err.message || 'We could not load products right now.');
                } else {
                    setError('We could not load products right now. Please refresh in a moment.');
                }
            } finally {
                setLoading(false);
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

    const featured = products.slice(0, 16);
    const onSale = products.filter((p) => p.onSale).slice(0, 8);
    const latest = [...products]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8);

    const featuredByFlag = products.filter((p) => p.isFeatured).slice(0, 8);

    const productCount = products.length;
    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'CaseProz Kenya',
        url: 'https://caseproz.vercel.app',
        logo: 'https://caseproz.vercel.app/favicon.ico',
        sameAs: ['https://www.instagram.com/caseproz/'],
        contactPoint: [
            {
                '@type': 'ContactPoint',
                telephone: '+254700000000',
                contactType: 'customer service',
                areaServed: 'KE',
                availableLanguage: ['en'],
            },
        ],
    };

    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'CaseProz Kenya',
        url: 'https://caseproz.vercel.app',
        potentialAction: {
            '@type': 'SearchAction',
            target: 'https://caseproz.vercel.app/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <div className="home-page">
            <SeoMeta
                title="CaseProz | Premium Tech, Cases & Accessories in Kenya"
                description="Shop premium phone cases, chargers, audio, power and accessories at CaseProz. Fast delivery across Kenya and curated picks from brands like Anker, Soundcore, Samsung and more."
                keywords="CaseProz, phone cases Kenya, Anker Kenya, chargers, power banks, headphones, electronics accessories Nairobi"
                canonicalPath="/"
                noIndex={productCount <= 0}
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(organizationSchema)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify(websiteSchema)}
                </script>
            </Helmet>
            {error && (
                <div className="container" style={{ marginTop: '16px' }}>
                    <ErrorBanner message={error} onClose={() => setError('')} />
                </div>
            )}

            <HomeSlider />

            <section className="home-quick-shop container">
                <div className="section-header">
                    <div className="title-area">
                        <span className="subtitle">QUICK SHOP</span>
                        <h2 className="main-title">Shop in One Tap</h2>
                    </div>
                </div>
                <div className="home-quick-shop-grid">
                    <div className="home-quick-card">
                        <p className="home-quick-label">Shop by brand</p>
                        <h3>Trusted Originals</h3>
                        <div className="home-quick-actions">
                            <Link
                                to="/search?brand=Anker"
                                className="home-quick-pill"
                                onClick={() => trackHomeClick('home_quick_pill_click', 'quick_shop_brand', 'anker')}
                            >
                                Anker
                            </Link>
                            <Link
                                to="/search?brand=Soundcore"
                                className="home-quick-pill"
                                onClick={() => trackHomeClick('home_quick_pill_click', 'quick_shop_brand', 'soundcore')}
                            >
                                Soundcore
                            </Link>
                            <Link
                                to="/search?brand=Samsung"
                                className="home-quick-pill"
                                onClick={() => trackHomeClick('home_quick_pill_click', 'quick_shop_brand', 'samsung')}
                            >
                                Samsung
                            </Link>
                        </div>
                    </div>
                    <div className="home-quick-card">
                        <p className="home-quick-label">Shop by budget</p>
                        <h3>Smart Price Bands</h3>
                        <div className="home-quick-actions">
                            <Link
                                to="/search?maxPrice=2000"
                                className="home-quick-pill"
                                onClick={() => trackHomeClick('home_quick_pill_click', 'quick_shop_budget', 'under_2000')}
                            >
                                Under KSh 2,000
                            </Link>
                            <Link
                                to="/search?minPrice=2000&maxPrice=5000"
                                className="home-quick-pill"
                                onClick={() => trackHomeClick('home_quick_pill_click', 'quick_shop_budget', '2000_5000')}
                            >
                                KSh 2,000 - 5,000
                            </Link>
                            <Link
                                to="/search?minPrice=5000"
                                className="home-quick-pill"
                                onClick={() => trackHomeClick('home_quick_pill_click', 'quick_shop_budget', '5000_plus')}
                            >
                                KSh 5,000+
                            </Link>
                        </div>
                    </div>
                    <div className="home-quick-card home-quick-card-highlight">
                        <p className="home-quick-label">Trending</p>
                        <h3>Top Picks</h3>
                        <Link
                            to="/search?sort=newest"
                            className="home-quick-cta"
                            onClick={() => trackHomeClick('home_quick_cta_click', 'quick_shop_trending', 'explore_trending')}
                        >
                            Explore trending now <ChevronRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>

            <CategoryShowcase />
            {/* Featured products – bigger grid */}
            <section className="featured-section container">
                <div className="section-header">
                    <div className="title-area">
                        <span className="subtitle">TRENDING</span>
                        <h2 className="main-title">Featured Products</h2>
                    </div>
                    <Link
                        to="/search"
                        className="view-all"
                        onClick={() => trackHomeClick('home_section_cta_click', 'featured_products', 'shop_all')}
                    >
                        Shop All <ChevronRight size={16} />
                    </Link>
                </div>

                {loading ? (
                    <div className="loading-state">Loading products...</div>
                ) : (
                    <div className="product-grid">
                        {featured.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </section>

            {/* New arrivals */}
            {!loading && latest.length > 0 && (
                <section className="featured-section container">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">JUST IN</span>
                            <h2 className="main-title">New Arrivals</h2>
                        </div>
                    </div>
                    <div className="product-grid">
                        {latest.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* On sale now */}
            {!loading && onSale.length > 0 && (
                <section className="featured-section container">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">HOT DEALS</span>
                            <h2 className="main-title">On Sale Right Now</h2>
                        </div>
                        <Link
                            to="/search?sort=newest"
                            className="view-all"
                            onClick={() => trackHomeClick('home_section_cta_click', 'on_sale', 'view_more_deals')}
                        >
                            View More Deals <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="product-grid">
                        {onSale.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Layer: Featured by admin flag */}
            {!loading && featuredByFlag.length > 0 && (
                <section className="home-layer-section container">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">EDITOR&apos;S CHOICE</span>
                            <h2 className="main-title">Editor&apos;s Picks</h2>
                        </div>
                    </div>
                    <div className="product-grid">
                        {featuredByFlag.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Layer: Brands we stock */}
            <section className="home-brands">
                <div className="container home-brands-inner">
                    <div className="home-brands-header">
                        <div>
                            <p className="home-brands-eyebrow">BRANDS</p>
                            <h2>Shop by Brand</h2>
                        </div>
                        <Link to="/search" className="home-brands-link">
                            View all brands <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="home-brands-row">
                        {homeBrands.map((brand) => (
                            <Link
                                key={brand}
                                to={`/search?brand=${encodeURIComponent(brand)}`}
                                className="home-brand-pill"
                            >
                                <span className="home-brand-name">{brand}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;
