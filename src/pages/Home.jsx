import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import HomeSlider from '../components/HomeSlider';
import FeatureStats from '../components/FeatureStats';
import CategoryShowcase from '../components/CategoryShowcase';
import PromoBanners from '../components/PromoBanners';
import ProductCard from '../components/ProductCard';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useSiteConfig } from '../context/SiteConfigContext';
import ErrorBanner from '../components/ErrorBanner';
import { apiFetch, ApiError } from '../utils/apiClient';
import SeoMeta from '../components/SeoMeta';

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

const homeTestimonials = [
    {
        name: 'Sarah, Nairobi',
        title: 'Upgraded my whole desk',
        quote:
            'Loved how easy it was to find matching chargers, hubs, and a laptop stand that actually looks premium.',
    },
    {
        name: 'Brian, Mombasa',
        title: 'Same‑day delivery came through',
        quote:
            'Ordered a power bank and headphones in the morning and had them in hand before heading out in the evening.',
    },
    {
        name: 'Lynn, Kisumu',
        title: 'Clear communication & support',
        quote:
            'Customer support helped me pick the right capacity for a power station instead of just upselling.',
    },
];

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { config } = useSiteConfig();

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

    const featured = products.slice(0, 16);
    const onSale = products.filter((p) => p.onSale).slice(0, 8);
    const latest = [...products]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8);

    // Derived views for deeper home sections
    const bestValue = [...products]
        .filter((p) => p.onSale || (p.originalPrice && p.originalPrice > p.price))
        .sort((a, b) => {
            const discountA = a.originalPrice ? a.originalPrice - a.price : 0;
            const discountB = b.originalPrice ? b.originalPrice - b.price : 0;
            return discountB - discountA;
        })
        .slice(0, 8);

    const budgetPicks = [...products]
        .sort((a, b) => a.price - b.price)
        .slice(0, 8);

    const premiumPicks = [...products]
        .sort((a, b) => b.price - a.price)
        .slice(0, 8);

    const featuredByFlag = products.filter((p) => p.isFeatured).slice(0, 8);

    const budgetBrackets = [
        { id: 'under-50k', label: 'Under KES 50,000', min: 0, max: 50000 },
        {
            id: '50k-100k',
            label: 'KES 50,000 – 100,000',
            min: 50000,
            max: 100000,
        },
        {
            id: '100k-200k',
            label: 'KES 100,000 – 200,000',
            min: 100000,
            max: 200000,
        },
        {
            id: '200k-plus',
            label: 'KES 200,000+',
            min: 200000,
            max: null,
        },
    ];

    const budgetStats = budgetBrackets
        .map((bracket) => {
            const count = products.filter((p) => {
                if (typeof p.price !== 'number') return false;
                if (bracket.max != null) {
                    return p.price >= bracket.min && p.price <= bracket.max;
                }
                return p.price >= bracket.min;
            }).length;

            return { ...bracket, count };
        })
        .filter((bracket) => bracket.count > 0);

    const categoriesMap = products.reduce((acc, product) => {
        if (!product.category) return acc;
        if (!acc[product.category]) acc[product.category] = [];
        acc[product.category].push(product);
        return acc;
    }, {});

    const subCategoryMap = products.reduce((acc, product) => {
        if (!product.subCategory) return acc;
        if (!acc[product.subCategory]) acc[product.subCategory] = [];
        acc[product.subCategory].push(product);
        return acc;
    }, {});

    const topCategories = Object.entries(categoriesMap)
        .sort(([, productsA], [, productsB]) => productsB.length - productsA.length)
        .slice(0, 3);

    const topSubCategories = Object.entries(subCategoryMap)
        .sort(([, productsA], [, productsB]) => productsB.length - productsA.length)
        .slice(0, 6);

    const hasAnyStats =
        products.length > 0 || onSale.length > 0 || latest.length > 0;

    const curatedCollectionsFromConfig =
        Array.isArray(config?.curatedCollections) && config.curatedCollections.length
            ? config.curatedCollections
            : [
                  {
                      id: 'work-essentials',
                      title: 'Work & Study Essentials',
                      tagline: 'Laptops, tablets, and accessories for productive days.',
                      query: 'office',
                  },
                  {
                      id: 'creator-setup',
                      title: 'Creator Setup',
                      tagline: 'Gear for designers, photographers, and content creators.',
                      query: 'creator',
                  },
                  {
                      id: 'gaming-battle-station',
                      title: 'Gaming Battle Station',
                      tagline: 'Consoles, monitors, and accessories for serious gamers.',
                      query: 'gaming',
                  },
              ];

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
    // --- Fetch homepage sections from backend ---
    const [homeSections, setHomeSections] = useState([]);
    const [sectionsLoading, setSectionsLoading] = useState(true);
    const [sectionsError, setSectionsError] = useState(null);

    useEffect(() => {
        const fetchSections = async () => {
            setSectionsLoading(true);
            setSectionsError(null);
            try {
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/sections`);
                setHomeSections(Array.isArray(data) ? data : []);
            } catch (err) {
                setSectionsError(err.message || 'Failed to load homepage sections');
            } finally {
                setSectionsLoading(false);
            }
        };
        fetchSections();
    }, []);

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
            <FeatureStats />
            <CategoryShowcase />
            <PromoBanners />

            {/* Quick catalogue summary strip */}
            {!loading && (
                <section className="home-meta-band">
                    <div className="container home-meta-grid">
                        {hasAnyStats ? (
                            <>
                                <div>
                                    <p className="meta-label">Products in catalog</p>
                                    <p className="meta-value">
                                        {products.length.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="meta-label">Hand‑picked deals</p>
                                    <p className="meta-value">
                                        {onSale.length}
                                    </p>
                                </div>
                                <div>
                                    <p className="meta-label">New this week</p>
                                    <p className="meta-value">
                                        {latest.length}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="home-meta-empty">
                                <p className="home-meta-eyebrow">
                                    Store setup in progress
                                </p>
                                <h3>Fresh products are coming soon</h3>
                                <p>
                                    We&apos;re stocking the shelves with premium cases and gadgets.
                                    Check back in a bit for new arrivals, curated deals, and more.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Featured products – bigger grid */}
            <section className="featured-section container">
                <div className="section-header">
                    <div className="title-area">
                        <span className="subtitle">TRENDING</span>
                        <h2 className="main-title">Featured Products</h2>
                    </div>
                    <Link to="/search" className="view-all">
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
                        <Link to="/search?sort=newest" className="view-all">
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

            {/* Layer: Best value deals */}
            {!loading && bestValue.length > 0 && (
                <section className="home-layer-section container">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">BEST VALUE</span>
                            <h2 className="main-title">Biggest Savings Right Now</h2>
                            <p className="section-kicker">
                                Deep discounts on premium tech – limited stock on these deals.
                            </p>
                        </div>
                        <Link to="/search?sort=discount" className="view-all">
                            View all savings <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="product-grid">
                        {bestValue.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Layer: Budget picks */}
            {!loading && budgetPicks.length > 0 && (
                <section className="home-layer-section container">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">BUDGET PICKS</span>
                            <h2 className="main-title">Most Affordable Favourites</h2>
                            <p className="section-kicker">
                                Great tech that won&apos;t break the bank – perfect everyday upgrades.
                            </p>
                        </div>
                        <Link to="/search?sort=price_asc" className="view-all">
                            Shop by lowest price <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="product-grid">
                        {budgetPicks.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Layer: Premium / hero products */}
            {!loading && premiumPicks.length > 0 && (
                <section className="home-layer-section container">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">PREMIUM PICKS</span>
                            <h2 className="main-title">Flagship & High‑End Gear</h2>
                            <p className="section-kicker">
                                Top‑tier devices for power users, creators, and gamers.
                            </p>
                        </div>
                        <Link to="/search?sort=price_desc" className="view-all">
                            Explore premium range <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="product-grid">
                        {premiumPicks.map((product) => (
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
                            <h2 className="main-title">Handpicked CaseProz Favourites</h2>
                            <p className="section-kicker">
                                A curated mix of best‑looking and most loved products.
                            </p>
                        </div>
                    </div>
                    <div className="product-grid">
                        {featuredByFlag.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Layer: Category spotlight */}
            {!loading && topCategories.length > 0 && (
                <section className="home-layer-section container">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">SHOP BY CATEGORY</span>
                            <h2 className="main-title">Dive Into Key Categories</h2>
                            <p className="section-kicker">
                                Quick access into the busiest sections of our catalog.
                            </p>
                        </div>
                    </div>
                    <div className="category-strip">
                        {topCategories.map(([categoryName, categoryProducts]) => (
                            <div key={categoryName} className="category-strip-card">
                                <div className="category-strip-header">
                                    <h3>{categoryName}</h3>
                                    <span className="category-strip-count">
                                        {categoryProducts.length} items
                                    </span>
                                </div>
                                <div className="category-strip-grid">
                                    {categoryProducts.slice(0, 4).map((product) => (
                                        <ProductCard
                                            key={product._id}
                                            product={product}
                                        />
                                    ))}
                                </div>
                                <Link
                                    to={`/search?category=${encodeURIComponent(
                                        categoryName
                                    )}`}
                                    className="category-strip-link"
                                >
                                    View all {categoryName} <ChevronRight size={14} />
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Layer: Sub‑category discovery */}
            {!loading && topSubCategories.length > 0 && (
                <section className="home-layer-section container">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">DISCOVER MORE</span>
                            <h2 className="main-title">Popular Sub‑Categories</h2>
                            <p className="section-kicker">
                                Find exactly what you&apos;re looking for – fast.
                            </p>
                        </div>
                    </div>
                    <div className="subcategory-pill-strip">
                        {topSubCategories.map(([subCategoryName, subCategoryProducts]) => (
                            <Link
                                key={subCategoryName}
                                to={`/search?subCategory=${encodeURIComponent(
                                    subCategoryName
                                )}`}
                                className="subcategory-pill"
                            >
                                <span className="subcategory-name">
                                    {subCategoryName}
                                </span>
                                <span className="subcategory-count">
                                    {subCategoryProducts.length} items
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Layer: Shop by budget */}
            {!loading && budgetStats.length > 0 && (
                <section className="home-layer-section container">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">SHOP BY BUDGET</span>
                            <h2 className="main-title">Find Tech for Every Wallet</h2>
                            <p className="section-kicker">
                                Jump straight into price ranges that match your budget.
                            </p>
                        </div>
                    </div>
                    <div className="budget-band">
                        {budgetStats.map((bracket) => {
                            const params = new URLSearchParams();
                            params.set('minPrice', String(bracket.min));
                            if (bracket.max != null) {
                                params.set('maxPrice', String(bracket.max));
                            }

                            return (
                                <Link
                                    key={bracket.id}
                                    to={`/search?${params.toString()}`}
                                    className="budget-pill"
                                >
                                    <div className="budget-label">{bracket.label}</div>
                                    <div className="budget-count">
                                        {bracket.count} item{bracket.count === 1 ? '' : 's'}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Layer: Curated collections */}
            <section className="home-layer-section container">
                <div className="section-header">
                    <div className="title-area">
                        <span className="subtitle">CURATED SETUPS</span>
                        <h2 className="main-title">Explore Ready‑Made Collections</h2>
                        <p className="section-kicker">
                            Shortcuts to popular ways people shop CaseProz today.
                        </p>
                    </div>
                </div>
                <div className="collections-grid">
                    {curatedCollectionsFromConfig.map((collection) => (
                        <Link
                            key={collection.id}
                            to={`/search?q=${encodeURIComponent(collection.query)}`}
                            className="collection-card"
                        >
                            <div className="collection-tag">Collection</div>
                            <h3 className="collection-title">{collection.title}</h3>
                            <p className="collection-copy">{collection.tagline}</p>
                            <span className="collection-cta">
                                View collection <ChevronRight size={14} />
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Layer: Brands we stock */}
            <section className="home-brands">
                <div className="container home-brands-inner">
                    <div className="home-brands-header">
                        <div>
                            <p className="home-brands-eyebrow">BRANDS WE STOCK</p>
                            <h2>Shop trusted global names</h2>
                            <p>
                                Jump straight into products from the brands you already know and love.
                            </p>
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

            {/* Layer: Customer stories */}
            <section className="home-layer-section container home-testimonials">
                <div className="section-header">
                    <div className="title-area">
                        <span className="subtitle">CUSTOMER STORIES</span>
                        <h2 className="main-title">Why shoppers stay with CaseProz</h2>
                        <p className="section-kicker">
                            Real experiences from people who built their everyday setups with us.
                        </p>
                    </div>
                </div>
                <div className="testimonial-grid">
                    {homeTestimonials.map((item) => (
                        <article key={item.name} className="testimonial-card">
                            <div className="testimonial-rating">
                                <i className="fas fa-star" />
                                <i className="fas fa-star" />
                                <i className="fas fa-star" />
                                <i className="fas fa-star" />
                                <i className="fas fa-star" />
                            </div>
                            <h3>{item.title}</h3>
                            <p className="testimonial-quote">“{item.quote}”</p>
                            <p className="testimonial-name">— {item.name}</p>
                        </article>
                    ))}
                </div>
            </section>
            {/* --- Dynamic Homepage Sections --- */}
            {!sectionsLoading && !sectionsError && homeSections.length > 0 && homeSections.map((section) => (
                <section key={section._id} className="home-layer-section container dynamic-section">
                    <div className="section-header">
                        <div className="title-area">
                            <span className="subtitle">{section.type.toUpperCase()}S</span>
                            <h2 className="main-title">{section.name}</h2>
                            {section.description && <p className="section-kicker">{section.description}</p>}
                        </div>
                    </div>

                    {section.type === 'Product' ? (
                        <div className="product-grid">
                            {section.items && section.items.length > 0 ? (
                                section.items.map((product) => (
                                    <ProductCard key={product._id} product={product} />
                                ))
                            ) : (
                                <p style={{ color: '#999', fontSize: 13 }}>No products added to this section yet.</p>
                            )}
                        </div>
                    ) : (
                        <div className="subcategory-pill-strip" style={{ gap: 12 }}>
                            {section.items && section.items.length > 0 ? (
                                section.items.map((cat) => (
                                    <Link
                                        key={cat._id}
                                        to={`/search?category=${encodeURIComponent(cat.name || cat)}`}
                                        className="subcategory-pill"
                                        style={{ minWidth: 200, padding: 16 }}
                                    >
                                        <span className="subcategory-name" style={{ fontSize: 16 }}>{cat.name || cat}</span>
                                        <span className="subcategory-count">Explore Category <ChevronRight size={12} /></span>
                                    </Link>
                                ))
                            ) : (
                                <p style={{ color: '#999', fontSize: 13 }}>No categories added to this section yet.</p>
                            )}
                        </div>
                    )}
                </section>
            ))}
        </div>
    );
};

export default Home;
