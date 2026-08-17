import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ProductCard from '../components/ProductCard';
import SkeletonProduct from '../components/SkeletonProduct';
import SearchFilters from '../components/SearchFilters';
import { SlidersHorizontal, X } from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';
import { apiFetch, ApiError } from '../utils/apiClient';
import SeoMeta from '../components/SeoMeta';
import { absoluteUrl } from '../utils/seo';

const POPULAR_BRANDS = ['Anker', 'Soundcore', 'Ugreen', 'Baseus', 'JBL', 'Oraimo'];
const POPULAR_CATEGORY_QUERIES = [
    { label: 'Headphones', query: 'headphones' },
    { label: 'Earbuds', query: 'earbuds' },
    { label: 'Power Banks', query: 'power bank' },
    { label: 'Chargers', query: 'charger' },
];
const RECENT_SEARCHES_KEY = 'caseproz_recent_searches';
const SEARCH_POPULARITY_KEY = 'caseproz_search_popularity';
const MAX_RECENT_SEARCHES = 6;

const normalizeSearchText = (value = '') =>
    String(value)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const getSearchTokens = (value = '') => normalizeSearchText(value).split(' ').filter(Boolean);

const getPopularityBoost = (score = 0) => Math.min(18, Math.round(Math.log2(score + 1) * 6));

const buildQuerySuggestions = (items, rawQuery, popularityScores = {}) => {
    const query = normalizeSearchText(rawQuery);
    if (!query) return [];

    const ranked = [];
    const seen = new Set();

    const pushCandidate = (candidate, boost = 0) => {
        const normalized = normalizeSearchText(candidate);
        if (!normalized || normalized === query || seen.has(normalized)) return;

        let score = boost;
        const popularityScore = Number(popularityScores?.[normalized] || 0);
        if (normalized.startsWith(query)) score += 20;
        else if (normalized.includes(query)) score += 12;
        else {
            const distance = levenshteinDistance(query, normalized);
            const maxLen = Math.max(query.length, normalized.length);
            if (!maxLen) return;
            const similarity = 1 - distance / maxLen;
            if (similarity < 0.62) return;
            score += Math.round(similarity * 10);
        }

        if (popularityScore > 0) {
            score += getPopularityBoost(popularityScore);
        }

        seen.add(normalized);
        ranked.push({ value: candidate, score });
    };

    items.forEach((product) => {
        pushCandidate(product?.name, 8);
        pushCandidate(product?.brand, 4);
        pushCandidate(product?.category, 2);
    });

    return ranked
        .sort((a, b) => b.score - a.score || a.value.localeCompare(b.value))
        .slice(0, 8)
        .map((entry) => entry.value);
};

const levenshteinDistance = (a = '', b = '') => {
    const s = String(a);
    const t = String(b);
    const rows = s.length + 1;
    const cols = t.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
    for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

    for (let i = 1; i < rows; i += 1) {
        for (let j = 1; j < cols; j += 1) {
            const cost = s[i - 1] === t[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[s.length][t.length];
};

const getBestTokenSimilarity = (needle, haystack) => {
    if (!needle || !haystack) return 0;
    const haystackTokens = getSearchTokens(haystack);
    if (haystackTokens.length === 0) return 0;

    let best = 0;
    haystackTokens.forEach((token) => {
        if (!token) return;
        if (token === needle) {
            best = Math.max(best, 1);
            return;
        }
        const distance = levenshteinDistance(needle, token);
        const maxLen = Math.max(needle.length, token.length);
        if (!maxLen) return;
        const similarity = 1 - distance / maxLen;
        best = Math.max(best, similarity);
    });

    return best;
};

const scoreProductRelevance = (product, rawQuery) => {
    const query = normalizeSearchText(rawQuery);
    if (!query) return 0;

    const name = normalizeSearchText(product?.name || '');
    const brand = normalizeSearchText(product?.brand || '');
    const category = normalizeSearchText(product?.category || '');
    const subCategory = normalizeSearchText(product?.subCategory || '');
    const description = normalizeSearchText(product?.description || '');
    const queryTokens = getSearchTokens(query);

    let score = 0;

    if (name === query) score += 120;
    else if (name.startsWith(query)) score += 90;
    else if (name.includes(query)) score += 65;

    if (brand === query) score += 80;
    else if (brand.startsWith(query)) score += 50;
    else if (brand.includes(query)) score += 35;

    if (category.startsWith(query) || subCategory.startsWith(query)) score += 30;
    if (category.includes(query) || subCategory.includes(query)) score += 20;
    if (description.includes(query)) score += 8;

    // Reward per-token matches for short/partial queries like "ank".
    queryTokens.forEach((token) => {
        if (name.startsWith(token)) score += 12;
        else if (name.includes(token)) score += 8;

        if (brand.startsWith(token)) score += 8;
        else if (brand.includes(token)) score += 5;

        if (category.includes(token) || subCategory.includes(token)) score += 3;

        const nameSimilarity = getBestTokenSimilarity(token, name);
        const brandSimilarity = getBestTokenSimilarity(token, brand);

        if (nameSimilarity >= 0.72 && nameSimilarity < 1) {
            score += 6;
        }

        if (brandSimilarity >= 0.72 && brandSimilarity < 1) {
            score += 5;
        }
    });

    return score;
};

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
    const [searchDraft, setSearchDraft] = useState('');
    const [querySuggestions, setQuerySuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState([]);
    const [searchPopularity, setSearchPopularity] = useState({});
    const suggestionCacheRef = useRef(new Map());

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
    const pageParamFromUrl = Math.max(1, Number.parseInt(queryParams.get('page') || '1', 10) || 1);
    const hasQuery = q.trim().length > 0;

    const applySearchParams = (updater, { replace = false } = {}) => {
        const nextParams = new URLSearchParams(location.search);
        updater(nextParams);
        const nextSearch = nextParams.toString();
        navigate(`/search${nextSearch ? `?${nextSearch}` : ''}`, { replace });
    };

    useEffect(() => {
        setSearchDraft(q);
    }, [q]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (!raw) return;

            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                setRecentSearches(
                    parsed
                        .map((item) => String(item || '').trim())
                        .filter(Boolean)
                        .slice(0, MAX_RECENT_SEARCHES)
                );
            }
        } catch {
            setRecentSearches([]);
        }
    }, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(SEARCH_POPULARITY_KEY);
            if (!raw) return;

            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                setSearchPopularity(parsed);
            }
        } catch {
            setSearchPopularity({});
        }
    }, []);

    const saveRecentSearch = (term) => {
        const cleaned = String(term || '').trim();
        if (!cleaned) return;

        setRecentSearches((prev) => {
            const deduped = [cleaned, ...prev.filter((item) => normalizeSearchText(item) !== normalizeSearchText(cleaned))]
                .slice(0, MAX_RECENT_SEARCHES);

            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(deduped));
            } catch {
                // Ignore storage failures (e.g. private mode quota restrictions)
            }

            return deduped;
        });
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch {
            // Ignore storage failures
        }
    };

    const recordSearchSelection = (term) => {
        const normalized = normalizeSearchText(term);
        if (!normalized) return;

        setSearchPopularity((prev) => {
            const next = {
                ...prev,
                [normalized]: Number(prev?.[normalized] || 0) + 1,
            };

            try {
                localStorage.setItem(SEARCH_POPULARITY_KEY, JSON.stringify(next));
            } catch {
                // Ignore storage failures
            }

            return next;
        });
    };

    useEffect(() => {
        suggestionCacheRef.current.clear();
    }, [searchPopularity]);

    useEffect(() => {
        const trimmed = searchDraft.trim();
        if (trimmed.length < 2) {
            setQuerySuggestions([]);
            setSuggestionsLoading(false);
            setActiveSuggestionIndex(-1);
            return;
        }

        const cacheKey = normalizeSearchText(trimmed);
        const cached = suggestionCacheRef.current.get(cacheKey);
        if (cached) {
            setQuerySuggestions(cached);
            setSuggestionsLoading(false);
            setActiveSuggestionIndex(-1);
            return;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            try {
                setSuggestionsLoading(true);

                const params = new URLSearchParams();
                params.set('keyword', trimmed);
                params.set('page', '1');
                params.set('pageSize', '8');
                params.set('sort', 'nameAsc');

                const data = await apiFetch(
                    `${import.meta.env.VITE_API_URL}/api/products?${params.toString()}`,
                    { signal: controller.signal }
                );

                const list = Array.isArray(data) ? data : data?.products || [];
                const built = buildQuerySuggestions(list, trimmed, searchPopularity);
                suggestionCacheRef.current.set(cacheKey, built);
                setQuerySuggestions(built);
                setActiveSuggestionIndex(-1);
            } catch (err) {
                if (err?.name !== 'AbortError') {
                    setQuerySuggestions([]);
                }
            } finally {
                setSuggestionsLoading(false);
            }
        }, 220);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [searchDraft, searchPopularity]);

    const displayedSuggestions = useMemo(() => {
        const trimmed = searchDraft.trim();
        if (trimmed.length >= 2) {
            return querySuggestions;
        }
        return recentSearches;
    }, [searchDraft, querySuggestions, recentSearches]);

    // Keep in-memory state aligned to URL so back/forward and shared links behave predictably.
    useEffect(() => {
        setSelectedCategory(categoryParam || '');
        setSelectedBrand(brandParam || '');
        setPriceRange({
            min: minPriceParam || '',
            max: maxPriceParam || '',
        });
        setPage(pageParamFromUrl);

        const sortMapReverse = {
            newest: 'newest',
            relevance: 'relevance',
            priceAsc: 'price-low',
            priceDesc: 'price-high',
            nameAsc: 'name-asc',
        };
        setSort(sortMapReverse[sortParamFromUrl] || (hasQuery ? 'relevance' : 'newest'));
    }, [categoryParam, brandParam, minPriceParam, maxPriceParam, pageParamFromUrl, sortParamFromUrl, hasQuery]);

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
                    'relevance': 'newest',
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
        applySearchParams((params) => {
            if (type === 'min') {
                if (value) params.set('minPrice', value);
                else params.delete('minPrice');
            }
            if (type === 'max') {
                if (value) params.set('maxPrice', value);
                else params.delete('maxPrice');
            }
            params.delete('page');
        });
    };

    const handlePriceRangeApply = (min, max) => {
        const nextMin = String(min || '').trim();
        const nextMax = String(max || '').trim();

        setPriceRange({ min: nextMin, max: nextMax });
        setPage(1);
        applySearchParams((params) => {
            if (nextMin) params.set('minPrice', nextMin);
            else params.delete('minPrice');

            if (nextMax) params.set('maxPrice', nextMax);
            else params.delete('maxPrice');

            params.delete('page');
        });
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        setPage(1);
        applySearchParams((params) => {
            if (value) params.set('category', value);
            else params.delete('category');
            params.delete('page');
        });
    };

    const handleBrandChange = (value) => {
        setSelectedBrand(value);
        setPage(1);
        applySearchParams((params) => {
            if (value) params.set('brand', value);
            else params.delete('brand');
            params.delete('page');
        });
    };

    const handleSortChange = (value) => {
        setSort(value);
        setPage(1);
        const sortMap = {
            newest: 'newest',
            relevance: 'relevance',
            'price-low': 'priceAsc',
            'price-high': 'priceDesc',
            'name-asc': 'nameAsc',
        };
        applySearchParams((params) => {
            const mapped = sortMap[value] || 'newest';
            if (mapped === 'newest' || (mapped === 'relevance' && hasQuery)) params.delete('sort');
            else params.set('sort', mapped);
            params.delete('page');
        });
    };

    const submitSearchQuery = (value) => {
        const trimmed = value.trim();
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);

        if (trimmed) {
            saveRecentSearch(trimmed);
            recordSearchSelection(trimmed);
        }

        applySearchParams((params) => {
            if (trimmed) {
                params.set('q', trimmed);
            } else {
                params.delete('q');
                params.delete('sort');
            }
            params.delete('page');
        });
    };

    const handleRefineSubmit = (event) => {
        event.preventDefault();
        submitSearchQuery(searchDraft);
    };

    const handleRefineKeyDown = (event) => {
        if (!showSuggestions || displayedSuggestions.length === 0) {
            if (event.key === 'Enter') {
                event.preventDefault();
                submitSearchQuery(searchDraft);
            }
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveSuggestionIndex((prev) => {
                const next = prev + 1;
                return next >= displayedSuggestions.length ? 0 : next;
            });
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveSuggestionIndex((prev) => {
                const next = prev - 1;
                return next < 0 ? displayedSuggestions.length - 1 : next;
            });
            return;
        }

        if (event.key === 'Escape') {
            setShowSuggestions(false);
            setActiveSuggestionIndex(-1);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            if (activeSuggestionIndex >= 0 && displayedSuggestions[activeSuggestionIndex]) {
                const choice = displayedSuggestions[activeSuggestionIndex];
                setSearchDraft(choice);
                submitSearchQuery(choice);
            } else {
                submitSearchQuery(searchDraft);
            }
        }
    };

    const displayProducts = useMemo(() => {
        if (!hasQuery || sort !== 'relevance') {
            return products;
        }

        return [...products].sort((a, b) => {
            const bScore = scoreProductRelevance(b, q);
            const aScore = scoreProductRelevance(a, q);

            if (bScore !== aScore) {
                return bScore - aScore;
            }

            return String(a?.name || '').localeCompare(String(b?.name || ''));
        });
    }, [products, hasQuery, sort, q]);

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

    const activeChips = [
        hasQuery && { key: 'query', label: `Search: ${q}` },
        selectedCategory && { key: 'category', label: `Category: ${selectedCategory}` },
        selectedBrand && { key: 'brand', label: `Brand: ${selectedBrand}` },
        priceRange.min && { key: 'minPrice', label: `Min: KSh ${Number(priceRange.min || 0).toLocaleString()}` },
        priceRange.max && { key: 'maxPrice', label: `Max: KSh ${Number(priceRange.max || 0).toLocaleString()}` },
    ].filter(Boolean);

    const nonQueryFilterCount = activeChips.filter((chip) => chip.key !== 'query').length;
    const hasNonQueryFilters = nonQueryFilterCount > 0;

    const clearSingleFilter = (key) => {
        if (key === 'query') {
            setSearchDraft('');
            applySearchParams((params) => {
                params.delete('q');
                params.delete('sort');
                params.delete('page');
            });
            return;
        }
        if (key === 'category') handleCategoryChange('');
        if (key === 'brand') handleBrandChange('');
        if (key === 'minPrice') handlePriceChange('min', '');
        if (key === 'maxPrice') handlePriceChange('max', '');
    };

    const clearAllFilters = () => {
        setSelectedCategory('');
        setSelectedBrand('');
        setPriceRange({ min: '', max: '' });
        setSort('newest');
        setPage(1);

        applySearchParams((params) => {
            params.delete('q');
            params.delete('category');
            params.delete('subCategory');
            params.delete('brand');
            params.delete('minPrice');
            params.delete('maxPrice');
            params.delete('sort');
            params.delete('page');
        });
    };

    const clearNonQueryFilters = () => {
        setSelectedCategory('');
        setSelectedBrand('');
        setPriceRange({ min: '', max: '' });
        setSort(hasQuery ? 'relevance' : 'newest');
        setPage(1);

        applySearchParams((params) => {
            params.delete('category');
            params.delete('subCategory');
            params.delete('brand');
            params.delete('minPrice');
            params.delete('maxPrice');
            params.delete('sort');
            params.delete('page');
        });
    };

    const suggestedQuery = useMemo(() => {
        if (!hasQuery || products.length > 0) {
            return '';
        }

        const query = normalizeSearchText(q);
        if (!query || query.length < 3) {
            return '';
        }

        const candidates = [
            ...POPULAR_BRANDS,
            ...POPULAR_CATEGORY_QUERIES.map((item) => item.query),
        ];

        let bestCandidate = '';
        let bestDistance = Number.POSITIVE_INFINITY;

        candidates.forEach((candidate) => {
            const normalized = normalizeSearchText(candidate);
            if (!normalized) return;

            const distance = levenshteinDistance(query, normalized);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestCandidate = candidate;
            }
        });

        const threshold = query.length <= 5 ? 2 : 3;
        if (bestDistance <= threshold) {
            return bestCandidate;
        }

        return '';
    }, [hasQuery, q, products.length]);

    let pageTitle = 'Shop Phone Cases & Tech Accessories | CaseProz Kenya';
    let metaDescription = 'Shop phone cases, chargers, power banks, audio products and everyday tech accessories in Kenya from CaseProz.';

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
        itemListElement: displayProducts.slice(0, 24).map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: absoluteUrl(`/product/${product.slug}`),
            name: product.name,
        })),
    };

    return (
        <div className="search-page">
            <SeoMeta
                title={pageTitle}
                description={metaDescription}
                canonicalPath="/search"
                noIndex={hasAnyFilters}
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
                        <div className="search-refine" role="search">
                            <form className="search-refine-form" onSubmit={handleRefineSubmit}>
                                <input
                                    type="text"
                                    value={searchDraft}
                                    onChange={(e) => setSearchDraft(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => {
                                        window.setTimeout(() => setShowSuggestions(false), 120);
                                    }}
                                    onKeyDown={handleRefineKeyDown}
                                    placeholder="Refine search (e.g. anker charger, iphone case)"
                                    aria-label="Refine search"
                                />
                                <button
                                    type="submit"
                                    disabled={!searchDraft.trim()}
                                >
                                    Search
                                </button>
                            </form>
                            {showSuggestions && (searchDraft.trim().length >= 2 || recentSearches.length > 0) && (
                                <div className="search-refine-suggestions" role="listbox" aria-label="Search suggestions">
                                    {suggestionsLoading ? (
                                        <div className="search-refine-empty">Looking up suggestions...</div>
                                    ) : displayedSuggestions.length > 0 ? (
                                        <>
                                            <div className="search-refine-group">
                                                <p className="search-refine-group-title">
                                                    {searchDraft.trim().length >= 2 ? 'Suggestions' : 'Recent searches'}
                                                </p>
                                                {displayedSuggestions.map((suggestion, idx) => (
                                                    <button
                                                        key={`${suggestion}-${idx}`}
                                                        type="button"
                                                        role="option"
                                                        className={`search-refine-option ${idx === activeSuggestionIndex ? 'active' : ''}`}
                                                        aria-selected={idx === activeSuggestionIndex}
                                                        onMouseDown={(event) => event.preventDefault()}
                                                        onClick={() => {
                                                            setSearchDraft(suggestion);
                                                            submitSearchQuery(suggestion);
                                                        }}
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                            {searchDraft.trim().length < 2 && recentSearches.length > 0 && (
                                                <button
                                                    type="button"
                                                    className="search-refine-clear-recent"
                                                    onMouseDown={(event) => event.preventDefault()}
                                                    onClick={clearRecentSearches}
                                                >
                                                    Clear recent
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="search-refine-empty">No suggestions yet. Press Enter to search.</div>
                                    )}
                                </div>
                            )}
                        </div>
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
                    <div className={`search-container ${!hasAnyFilters ? 'no-filters' : ''}`}>
                        {hasAnyFilters && (
                            <div className={`filter-sidebar-wrap ${isFilterOpen ? 'filter-open' : ''}`}>
                                <SearchFilters
                                    categories={categories}
                                    brands={brands}
                                    hasQuery={hasQuery}
                                    selectedCategory={selectedCategory}
                                    selectedBrand={selectedBrand}
                                    onCategoryChange={handleCategoryChange}
                                    onBrandChange={handleBrandChange}
                                    priceRange={priceRange}
                                    onPriceChange={handlePriceChange}
                                    onPriceApply={handlePriceRangeApply}
                                    sort={sort}
                                    onSortChange={handleSortChange}
                                />
                            </div>
                        )}

                        <main className="search-main">
                            {hasAnyFilters && !isInitialLoading && (
                                <div className="search-controls">
                                    <div className="search-controls-main">
                                        <div className="results-count">
                                            Showing <span>{displayProducts.length}</span> of <span>{total}</span> products
                                        </div>
                                        <div className="search-toolbar-meta">
                                            {hasQuery && <span className="search-meta-pill">Query</span>}
                                            {hasNonQueryFilters && (
                                                <span className="search-meta-pill">{nonQueryFilterCount} filter{nonQueryFilterCount > 1 ? 's' : ''}</span>
                                            )}
                                        </div>
                                        {isRefetching && (
                                            <span className="results-updating" style={{ marginLeft: 8, fontSize: 12, color: '#9ca3af' }}>
                                                Updating results…
                                            </span>
                                        )}
                                    </div>
                                    <div className="search-controls-actions">
                                        {hasNonQueryFilters && (
                                            <button
                                                type="button"
                                                className="search-inline-action"
                                                onClick={clearNonQueryFilters}
                                            >
                                                Reset filters
                                            </button>
                                        )}
                                        <div className="sort-wrapper">
                                            <label>Sort by:</label>
                                            <select value={sort} onChange={(e) => handleSortChange(e.target.value)}>
                                                {hasQuery && <option value="relevance">Best Match</option>}
                                                <option value="newest">Newest Arrivals</option>
                                                <option value="price-low">Price: Low to High</option>
                                                <option value="price-high">Price: High to Low</option>
                                                <option value="name-asc">Name: A-Z</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {hasAnyFilters && activeChips.length > 0 && (
                                <div className="search-active-filters">
                                    {activeChips.map((chip) => (
                                        <button
                                            key={chip.key}
                                            type="button"
                                            className="search-filter-chip"
                                            onClick={() => clearSingleFilter(chip.key)}
                                            aria-label={`Remove ${chip.label} filter`}
                                        >
                                            {chip.label} <span>×</span>
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        className="search-clear-all"
                                        onClick={clearAllFilters}
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}

                            {isInitialLoading && hasAnyFilters ? (
                                <div className="product-grid search-product-grid">
                                    {[...Array(12)].map((_, i) => (
                                        <SkeletonProduct key={i} />
                                    ))}
                                </div>
                            ) : hasAnyFilters && displayProducts.length === 0 ? (
                                <div className="search-state center empty animate-in">
                                    <div className="icon-wrapper">
                                        <i className="fas fa-search"></i>
                                    </div>
                                    <h3>No matches found</h3>
                                    <p>We couldn't find any products matching your filters. Try adjusting your search or filters.</p>
                                    {hasNonQueryFilters && (
                                        <button
                                            type="button"
                                            className="search-inline-action prominent"
                                            onClick={clearNonQueryFilters}
                                        >
                                            Remove filters and keep search term
                                        </button>
                                    )}
                                    {suggestedQuery && (
                                        <div style={{ marginTop: '10px' }}>
                                            <p className="suggestion-title" style={{ marginBottom: '8px' }}>
                                                Did you mean
                                            </p>
                                            <button
                                                type="button"
                                                className="suggestion-chip"
                                                onClick={() =>
                                                    applySearchParams((params) => {
                                                        params.set('q', suggestedQuery);
                                                        params.delete('page');
                                                        params.delete('sort');
                                                    })
                                                }
                                            >
                                                {suggestedQuery}
                                            </button>
                                        </div>
                                    )}
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
                                        onClick={clearAllFilters}
                                        className="btn-primary"
                                        style={{ marginTop: '16px' }}
                                    >
                                        CLEAR FILTERS
                                    </button>
                                </div>
                            ) : hasAnyFilters ? (
                                <div className={`product-grid search-product-grid ${displayProducts.length === 1 ? 'single-result' : ''}`}>
                                    {displayProducts.map((product, index) => (
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
                                    <div className="suggestion-chips" style={{ marginTop: '10px', marginBottom: '10px' }}>
                                        {POPULAR_CATEGORY_QUERIES.map((item) => (
                                            <button
                                                key={item.label}
                                                type="button"
                                                className="suggestion-chip"
                                                onClick={() => submitSearchQuery(item.query)}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                    <Link to="/" className="btn-primary">START BROWSING</Link>
                                </div>
                            )}

                            {hasAnyFilters && !loading && total > 0 && pages > 1 && (
                                <nav
                                    className="pagination search-pagination"
                                    aria-label="Search results pages"
                                    style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nextPage = Math.max(page - 1, 1);
                                            setPage(nextPage);
                                            applySearchParams((params) => {
                                                if (nextPage <= 1) params.delete('page');
                                                else params.set('page', String(nextPage));
                                            });
                                        }}
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
                                        onClick={() => {
                                            const nextPage = Math.min(page + 1, pages);
                                            setPage(nextPage);
                                            applySearchParams((params) => {
                                                if (nextPage <= 1) params.delete('page');
                                                else params.set('page', String(nextPage));
                                            });
                                        }}
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
