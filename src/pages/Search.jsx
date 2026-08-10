import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ProductCard from '../components/ProductCard';
import SkeletonProduct from '../components/SkeletonProduct';
import SearchFilters from '../components/SearchFilters';
import { SlidersHorizontal, X } from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';
import { apiFetch, ApiError } from '../utils/apiClient';
import SeoMeta from '../components/SeoMeta';

const POPULAR_BRANDS = ['Apple', 'Samsung', 'Sony', 'Dell', 'ASUS', 'HP', 'Lenovo'];
const POPULAR_CATEGORY_QUERIES = [
    { label: 'Phones & Tablets', query: 'phone' },
    { label: 'Laptops & Computers', query: 'laptop' },
    { label: 'Accessories', query: 'accessories' },
];

const Search = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [selectedBrand, setSelectedBrand] = useState('');
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    // Parse query parameters ?q=..., ?category=..., ?subCategory=..., ?minPrice=..., ?maxPrice=..., ?sort=...
    const queryParams = new URLSearchParams(location.search);
    const q = queryParams.get('q') || '';
    const categoryParam = queryParams.get('category') || '';
    const subCategoryParam = queryParams.get('subCategory') || '';
    const brandParam = queryParams.get('brand') || '';
    const minPriceParam = queryParams.get('minPrice') || '';
    const maxPriceParam = queryParams.get('maxPrice') || '';
    const sortParamFromUrl = queryParams.get('sort') || '';
    const hasQuery = q.trim().length > 0;

    // When URL carries no explicit filter params, clear any stale in-memory filters.
    // This prevents hidden state from previous searches from forcing zero results.
    useEffect(() => {
        const hasExplicitFiltersInUrl =
            !!categoryParam ||
            !!subCategoryParam ||
            !!brandParam ||
            !!minPriceParam ||
            !!maxPriceParam;

        if (!hasExplicitFiltersInUrl) {
            setSelectedCategory('');
            setSelectedBrand('');
            setPriceRange((prev) =>
                prev.min === '' && prev.max === '' ? prev : { min: '', max: '' }
            );
        }
    }, [categoryParam, subCategoryParam, brandParam, minPriceParam, maxPriceParam]);

    // Keep selectedCategory in sync when landing on URLs like /search?category=...
    useEffect(() => {
        if (categoryParam && !selectedCategory) {
            setSelectedCategory(categoryParam);
        }
    }, [categoryParam, selectedCategory]);

    // Keep selectedBrand in sync when landing on URLs like /search?brand=...
    useEffect(() => {
        if (brandParam && !selectedBrand) {
            setSelectedBrand(brandParam);
        }
    }, [brandParam, selectedBrand]);

    // Initialise price range from URL on first load (e.g. /search?minPrice=...&maxPrice=...)
    useEffect(() => {
        if ((minPriceParam || maxPriceParam) && priceRange.min === '' && priceRange.max === '') {
            setPriceRange({
                min: minPriceParam || '',
                max: maxPriceParam || '',
            });
        }
    }, [minPriceParam, maxPriceParam, priceRange.min, priceRange.max]);

    // When page changes, jump back to top of the page (no animated scroll)
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [page]);

    useEffect(() => {
        const activeCategory = selectedCategory || categoryParam;
        const activeSubCategory = subCategoryParam;
        const activeBrand = selectedBrand || brandParam;

        const hasAnyFilter =
            hasQuery ||
            !!activeCategory ||
            !!activeSubCategory ||
            !!activeBrand ||
            priceRange.min !== '' ||
            priceRange.max !== '' ||
            !!sortParamFromUrl;

        if (!hasAnyFilter) {
            setProducts([]);
            setTotal(0);
            setPages(1);
            setError('');
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        const fetchSearchResults = async () => {
            setLoading(true);
            setError('');

            try {
                const params = new URLSearchParams();

                if (hasQuery) {
                    params.append('keyword', q);
                }
                params.append('page', String(page));
                params.append('pageSize', '12');

                if (activeCategory) {
                    params.append('category', activeCategory);
                }

                if (activeSubCategory) {
                    params.append('subCategory', activeSubCategory);
                }

                if (activeBrand) {
                    params.append('brand', activeBrand);
                }

                if (priceRange.min) {
                    params.append('minPrice', String(priceRange.min));
                }

                if (priceRange.max) {
                    params.append('maxPrice', String(priceRange.max));
                }

                const sortMap = {
                    'newest': 'newest',
                    'price-low': 'priceAsc',
                    'price-high': 'priceDesc',
                    'name-asc': 'nameAsc',
                };

                const sortParam = sortMap[sort] || 'newest';
                params.append('sort', sortParam);

                const data = await apiFetch(
                    `${import.meta.env.VITE_API_URL}/api/products?${params.toString()}`,
                    { signal: controller.signal }
                );

                if (Array.isArray(data)) {
                    setProducts(data);
                    setTotal(data.length);
                    setPages(1);
                } else {
                    setProducts(data.products || []);
                    setTotal(data.total || 0);
                    setPages(data.pages || 1);
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    return;
                }
                if (err instanceof ApiError) {
                    setError(err.message || 'Failed to fetch search results.');
                } else {
                    setError('Failed to fetch search results. Please try again in a moment.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();

        return () => {
            controller.abort();
        };
    }, [
        q,
        hasQuery,
        page,
        selectedCategory,
        priceRange.min,
        priceRange.max,
        sort,
        categoryParam,
        subCategoryParam,
        selectedBrand,
        brandParam,
        sortParamFromUrl,
    ]);

    // Derived data for filters (based on currently loaded page)
    const categories = useMemo(() => {
        const cats = products.map((p) => p.category).filter(Boolean);
        return [...new Set(cats)];
    }, [products]);

    const brands = useMemo(() => {
        const bs = products.map((p) => p.brand).filter(Boolean);
        return [...new Set(bs)];
    }, [products]);

    const handlePriceChange = (type, value) => {
        setPriceRange(prev => ({ ...prev, [type]: value }));
        setPage(1);
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        setPage(1);
    };

    const handleBrandChange = (value) => {
        setSelectedBrand(value);
        setPage(1);
    };

    const handleSortChange = (value) => {
        setSort(value);
        setPage(1);
    };

    const hasCriteriaFromUrl =
        hasQuery ||
        !!categoryParam ||
        !!subCategoryParam ||
        !!brandParam ||
        !!minPriceParam ||
        !!maxPriceParam ||
        !!sortParamFromUrl;
    const hasAnyFilters =
        hasCriteriaFromUrl ||
        !!selectedCategory ||
        !!selectedBrand ||
        priceRange.min !== '' ||
        priceRange.max !== '';

    const isInitialLoading = loading && products.length === 0;
    const isRefetching = loading && products.length > 0;

    let pageTitle = 'Search products | CaseProz Kenya';
    let metaDescription = 'Search CaseProz for premium tech, cases, chargers, audio and accessories in Kenya.';

    if (hasQuery) {
        pageTitle = `Search "${q}" | CaseProz Kenya`;
        metaDescription = `Search results for "${q}" at CaseProz. Discover curated tech, cases, audio and accessories.`;
    } else if (categoryParam) {
        pageTitle = `Browse ${categoryParam} | CaseProz Kenya`;
        metaDescription = `Browse products in ${categoryParam} at CaseProz.`;
    } else if (brandParam) {
        pageTitle = `Shop ${brandParam} products | CaseProz Kenya`;
        metaDescription = `Discover ${brandParam} products at CaseProz – premium tech, power and accessories.`;
    }

    const searchListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: hasQuery ? `Search results for ${q}` : 'Filtered products',
        itemListElement: products.slice(0, 24).map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `https://caseproz.vercel.app/product/${product.slug}`,
            name: product.name,
        })),
    };

    return (
        <div className="search-page">
            <SeoMeta
                title={pageTitle}
                description={metaDescription}
                canonicalPath={`/search${location.search}`}
                noIndex={!hasAnyFilters}
            />
            {hasAnyFilters && products.length > 0 && (
                <Helmet>
                    <script type="application/ld+json">
                        {JSON.stringify(searchListSchema)}
                    </script>
                </Helmet>
            )}
            <section className="search-hero">
                <div className="container">
                    <div className="search-hero-content">
                        <p className="search-badge">DISCOVER PRODUCTS</p>
                        <h1>
                            {hasQuery ? (
                                <>
                                    Search results for <span className="highlight">"{q}"</span>
                                </>
                            ) : categoryParam ? (
                                <>
                                    Browsing category{' '}
                                    <span className="highlight">"{categoryParam}"</span>
                                </>
                            ) : subCategoryParam ? (
                                <>
                                    Browsing <span className="highlight">"{subCategoryParam}"</span>
                                </>
                            ) : brandParam ? (
                                <>
                                    Browsing brand{' '}
                                    <span className="highlight">"{brandParam}"</span>
                                </>
                            ) : (
                                'Discover our collection'
                            )}
                        </h1>
                        <p className="subtitle">
                            {hasCriteriaFromUrl
                                ? `Showing ${total} ${total === 1 ? 'match' : 'matches'} for your search criteria.`
                                : 'Explore our wide range of premium electronics and accessories.'}
                        </p>
                    </div>
                </div>
            </section>

            <section className="search-results-section">
                <div className="container">
                    {error && hasAnyFilters && (
                        <ErrorBanner message={error} onClose={() => setError('')} />
                    )}
                    {hasAnyFilters && (
                        <button
                            className="mobile-filter-toggle"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <SlidersHorizontal size={16} />
                            {isFilterOpen ? 'Hide Filters' : 'Filters'}
                            {isFilterOpen && <X size={14} style={{ marginLeft: 'auto' }} />}
                        </button>
                    )}
                    <div className="search-container">
                        {hasAnyFilters && (
                            <div className={`filter-sidebar-wrap ${isFilterOpen ? 'filter-open' : ''}`}>
                                <SearchFilters
                                    categories={categories}
                                    brands={brands}
                                    selectedCategory={selectedCategory}
                                    selectedBrand={selectedBrand}
                                    onCategoryChange={handleCategoryChange}
                                    onBrandChange={handleBrandChange}
                                    priceRange={priceRange}
                                    onPriceChange={handlePriceChange}
                                    sort={sort}
                                    onSortChange={handleSortChange}
                                />
                            </div>
                        )}

                        <main className="search-main">
                            {hasAnyFilters && !isInitialLoading && (
                                <div className="search-controls">
                                    <div className="results-count">
                                        Showing <span>{products.length}</span> of <span>{total}</span> products
                                        {isRefetching && (
                                            <span style={{ marginLeft: 8, fontSize: 12, color: '#9ca3af' }}>
                                                Updating results…
                                            </span>
                                        )}
                                    </div>
                                    <div className="sort-wrapper">
                                        <label>Sort by:</label>
                                        <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                            <option value="newest">Newest Arrivals</option>
                                            <option value="price-low">Price: Low to High</option>
                                            <option value="price-high">Price: High to Low</option>
                                            <option value="name-asc">Name: A-Z</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {isInitialLoading && hasAnyFilters ? (
                                <div className="product-grid">
                                    {[...Array(12)].map((_, i) => (
                                        <SkeletonProduct key={i} />
                                    ))}
                                </div>
                            ) : hasAnyFilters && products.length === 0 ? (
                                <div className="search-state center empty animate-in">
                                    <div className="icon-wrapper">
                                        <i className="fas fa-search"></i>
                                    </div>
                                    <h3>No matches found</h3>
                                    <p>We couldn't find any products matching your filters. Try adjusting your search or filters.</p>
                                    <div className="search-suggestions">
                                        <p className="suggestion-title">Try one of these popular brands</p>
                                        <div className="suggestion-chips">
                                            {POPULAR_BRANDS.map((brand) => (
                                                <button
                                                    key={brand}
                                                    type="button"
                                                    className="suggestion-chip"
                                                    onClick={() =>
                                                        navigate(`/search?brand=${encodeURIComponent(brand)}`)
                                                    }
                                                >
                                                    {brand}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="suggestion-title">Or explore a popular category</p>
                                        <div className="suggestion-chips">
                                            {POPULAR_CATEGORY_QUERIES.map((item) => (
                                                <button
                                                    key={item.label}
                                                    type="button"
                                                    className="suggestion-chip"
                                                    onClick={() =>
                                                        navigate(`/search?q=${encodeURIComponent(item.query)}`)
                                                    }
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedCategory('');
                                            setSelectedBrand('');
                                            setPriceRange({ min: '', max: '' });
                                        }}
                                        className="btn-primary"
                                        style={{ marginTop: '16px' }}
                                    >
                                        CLEAR FILTERS
                                    </button>
                                </div>
                            ) : hasAnyFilters ? (
                                <div className="product-grid">
                                    {products.map((product, index) => (
                                        <div key={product._id} className={`animate-in stagger-${(index % 6) + 1}`}>
                                            <ProductCard
                                                product={product}
                                                highlightQuery={hasQuery ? q : ''}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="search-state center animate-in">
                                    <div className="icon-wrapper">
                                        <i className="fas fa-shopping-bag"></i>
                                    </div>
                                    <h3>Explore CaseProz</h3>
                                    <p>Use the search bar above to find your favorite products instantly.</p>
                                    <Link to="/" className="btn-primary">START BROWSING</Link>
                                </div>
                            )}

                            {hasAnyFilters && !loading && total > 0 && pages > 1 && (
                                <nav
                                    className="pagination"
                                    aria-label="Search results pages"
                                    style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={page === 1}
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: '999px',
                                            border: '1px solid #e5e7eb',
                                            backgroundColor: page === 1 ? '#f9fafb' : '#ffffff',
                                            color: '#374151',
                                            fontSize: '13px',
                                            cursor: page === 1 ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                        Page <strong>{page}</strong> of <strong>{pages}</strong>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
                                        disabled={page === pages}
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: '999px',
                                            border: '1px solid #e5e7eb',
                                            backgroundColor: page === pages ? '#f9fafb' : '#ffffff',
                                            color: '#374151',
                                            fontSize: '13px',
                                            cursor: page === pages ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        Next
                                    </button>
                                </nav>
                            )}
                        </main>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Search;
