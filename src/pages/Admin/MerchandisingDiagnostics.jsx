import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, ApiError } from '../../utils/apiClient';

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

const hasRealDiscount = (product) => Number(product?.originalPrice || 0) > Number(product?.price || 0);

const getDiscountPercent = (product) => {
    const original = Number(product?.originalPrice || 0);
    const current = Number(product?.price || 0);
    if (original <= 0 || current <= 0 || current >= original) return 0;
    return Math.round(((original - current) / original) * 100);
};

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

const formatKes = (value) => `KES ${Number(value || 0).toLocaleString()}`;

const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
};

const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '30px',
    height: '26px',
    borderRadius: '999px',
    background: '#f3f4f6',
    color: '#111827',
    fontWeight: 700,
    fontSize: '12px',
    padding: '0 10px',
};

const MerchandisingDiagnostics = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeProducts, setActiveProducts] = useState([]);
    const [onSaleProducts, setOnSaleProducts] = useState([]);

    const loadDiagnostics = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const baseUrl = `${import.meta.env.VITE_API_URL}/api/products`;

            const [activeResult, onSaleResult] = await Promise.all([
                apiFetch(`${baseUrl}?page=1&pageSize=220&sort=newest&isActive=true`),
                apiFetch(`${baseUrl}?page=1&pageSize=220&sort=newest&isActive=true&onSale=true`),
            ]);

            setActiveProducts(Array.isArray(activeResult?.products) ? activeResult.products : []);
            setOnSaleProducts(Array.isArray(onSaleResult?.products) ? onSaleResult.products : []);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message || 'Failed to load diagnostics data.');
            } else {
                setError('Failed to load diagnostics data.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDiagnostics();
    }, [loadDiagnostics]);

    const diagnostics = useMemo(() => {
        const activeNonCase = activeProducts.filter((p) => !isCaseProduct(p));
        const newArrivalsEligible = activeNonCase.filter((p) => isAnkerProduct(p) || isSoundcoreProduct(p));
        const newArrivalsFinal = [...newArrivalsEligible]
            .sort((a, b) => getProductTimestamp(b) - getProductTimestamp(a))
            .slice(0, 6);

        const merged = [...onSaleProducts, ...activeProducts];
        const deduped = [];
        const seen = new Set();
        for (const item of merged) {
            if (!item?._id || seen.has(item._id)) continue;
            seen.add(item._id);
            deduped.push(item);
        }

        const discounted = deduped.filter((p) => hasRealDiscount(p));
        const discountedNonCase = discounted.filter((p) => !isCaseProduct(p));
        const featuredFocused = discountedNonCase.filter((p) => isAnkerProduct(p) || isSoundcoreProduct(p));
        const featuredFallback = discountedNonCase.filter((p) => !isAnkerProduct(p) && !isSoundcoreProduct(p));

        const featuredFinal = [...featuredFocused, ...featuredFallback]
            .sort((a, b) => {
                const diff = getDiscountPercent(b) - getDiscountPercent(a);
                if (diff !== 0) return diff;
                return getProductTimestamp(b) - getProductTimestamp(a);
            })
            .slice(0, 6);

        const excludedNoOriginal = deduped.filter((p) => !Number(p?.originalPrice || 0));
        const excludedNoValidGap = deduped.filter((p) => Number(p?.originalPrice || 0) <= Number(p?.price || 0));
        const excludedCasesAfterDiscount = discounted.filter((p) => isCaseProduct(p));
        const discountedNotPriority = discountedNonCase.filter((p) => !isAnkerProduct(p) && !isSoundcoreProduct(p));

        return {
            counts: {
                activeTotal: activeProducts.length,
                activeNonCase: activeNonCase.length,
                newArrivalsEligible: newArrivalsEligible.length,
                newArrivalsFinal: newArrivalsFinal.length,
                onSaleApiTotal: onSaleProducts.length,
                mergedUnique: deduped.length,
                discountedTotal: discounted.length,
                discountedNonCase: discountedNonCase.length,
                featuredFocused: featuredFocused.length,
                featuredFallback: featuredFallback.length,
                featuredFinal: featuredFinal.length,
            },
            exclusions: {
                noOriginalPrice: excludedNoOriginal.length,
                noRealDiscountGap: excludedNoValidGap.length,
                caseProductsRemovedAfterDiscount: excludedCasesAfterDiscount.length,
                discountedNotPriorityBrand: discountedNotPriority.length,
            },
            newArrivalsPreview: newArrivalsFinal,
            featuredSavingsPreview: featuredFinal,
            discountedNotPriorityPreview: discountedNotPriority.slice(0, 10),
        };
    }, [activeProducts, onSaleProducts]);

    return (
        <section style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gap: 16 }}>
            <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                    <h1 style={{ margin: '0 0 4px', fontSize: 24, color: '#111827' }}>Merchandising Diagnostics</h1>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
                        Verify New Arrivals and Featured Savings filters using live product data.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadDiagnostics}
                    disabled={loading}
                    style={{
                        minHeight: 38,
                        padding: '0 14px',
                        borderRadius: 8,
                        border: '1px solid #d1d5db',
                        background: '#111827',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 12,
                    }}
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {error && (
                <div style={{ ...cardStyle, borderColor: '#fecaca', background: '#fff7f7', color: '#b91c1c' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div style={cardStyle}><p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>Active Products</p><strong style={{ fontSize: 24 }}>{diagnostics.counts.activeTotal}</strong></div>
                <div style={cardStyle}><p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>Active Non-Case</p><strong style={{ fontSize: 24 }}>{diagnostics.counts.activeNonCase}</strong></div>
                <div style={cardStyle}><p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>On Sale API</p><strong style={{ fontSize: 24 }}>{diagnostics.counts.onSaleApiTotal}</strong></div>
                <div style={cardStyle}><p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>Real Discounts</p><strong style={{ fontSize: 24 }}>{diagnostics.counts.discountedTotal}</strong></div>
                <div style={cardStyle}><p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>Featured Savings Final</p><strong style={{ fontSize: 24 }}>{diagnostics.counts.featuredFinal}</strong></div>
                <div style={cardStyle}><p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>New Arrivals Final</p><strong style={{ fontSize: 24 }}>{diagnostics.counts.newArrivalsFinal}</strong></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={cardStyle}>
                    <h2 style={{ margin: '0 0 10px', fontSize: 17 }}>Featured Savings Filter Stages</h2>
                    <div style={{ display: 'grid', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Merged unique candidates</span><span style={badgeStyle}>{diagnostics.counts.mergedUnique}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Valid real discounts</span><span style={badgeStyle}>{diagnostics.counts.discountedTotal}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Non-case discounted</span><span style={badgeStyle}>{diagnostics.counts.discountedNonCase}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Anker/Soundcore discounted</span><span style={badgeStyle}>{diagnostics.counts.featuredFocused}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discounted fallback brands</span><span style={badgeStyle}>{diagnostics.counts.featuredFallback}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Homepage final shown</strong><span style={{ ...badgeStyle, background: '#111827', color: '#fff' }}>{diagnostics.counts.featuredFinal}</span></div>
                    </div>
                </div>

                <div style={cardStyle}>
                    <h2 style={{ margin: '0 0 10px', fontSize: 17 }}>Exclusion Reasons</h2>
                    <div style={{ display: 'grid', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>No originalPrice value</span><span style={badgeStyle}>{diagnostics.exclusions.noOriginalPrice}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>No real discount (originalPrice {'<='} price)</span><span style={badgeStyle}>{diagnostics.exclusions.noRealDiscountGap}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Case products removed</span><span style={badgeStyle}>{diagnostics.exclusions.caseProductsRemovedAfterDiscount}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discounted but not Anker/Soundcore</span><span style={badgeStyle}>{diagnostics.exclusions.discountedNotPriorityBrand}</span></div>
                    </div>
                </div>
            </div>

            <div style={{ ...cardStyle, overflowX: 'auto' }}>
                <h2 style={{ margin: '0 0 10px', fontSize: 17 }}>Featured Savings Preview (Homepage Final)</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '8px 6px' }}>Product</th>
                            <th style={{ padding: '8px 6px' }}>Brand</th>
                            <th style={{ padding: '8px 6px' }}>Price</th>
                            <th style={{ padding: '8px 6px' }}>Original</th>
                            <th style={{ padding: '8px 6px' }}>Discount</th>
                            <th style={{ padding: '8px 6px' }}>Stock</th>
                            <th style={{ padding: '8px 6px' }}>Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {diagnostics.featuredSavingsPreview.map((product) => (
                            <tr key={`preview-${product._id}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '8px 6px', maxWidth: 340 }}>{product.name}</td>
                                <td style={{ padding: '8px 6px' }}>{product.brand || '-'}</td>
                                <td style={{ padding: '8px 6px' }}>{formatKes(product.price)}</td>
                                <td style={{ padding: '8px 6px', color: '#6b7280', textDecoration: 'line-through' }}>{formatKes(product.originalPrice)}</td>
                                <td style={{ padding: '8px 6px', fontWeight: 700 }}>{getDiscountPercent(product)}%</td>
                                <td style={{ padding: '8px 6px' }}>{Number(product?.stock || 0)}</td>
                                <td style={{ padding: '8px 6px' }}>
                                    <Link to={`/product/${product.slug}`} target="_blank" rel="noreferrer">Open</Link>
                                </td>
                            </tr>
                        ))}
                        {!loading && diagnostics.featuredSavingsPreview.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ padding: '12px 6px', color: '#6b7280' }}>
                                    No qualifying Featured Savings products found with real discount data.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ ...cardStyle, overflowX: 'auto' }}>
                <h2 style={{ margin: '0 0 10px', fontSize: 17 }}>Discounted Non-Priority Sample (for fallback)</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '8px 6px' }}>Product</th>
                            <th style={{ padding: '8px 6px' }}>Brand</th>
                            <th style={{ padding: '8px 6px' }}>Price</th>
                            <th style={{ padding: '8px 6px' }}>Original</th>
                            <th style={{ padding: '8px 6px' }}>Discount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {diagnostics.discountedNotPriorityPreview.map((product) => (
                            <tr key={`fallback-${product._id}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '8px 6px', maxWidth: 340 }}>{product.name}</td>
                                <td style={{ padding: '8px 6px' }}>{product.brand || '-'}</td>
                                <td style={{ padding: '8px 6px' }}>{formatKes(product.price)}</td>
                                <td style={{ padding: '8px 6px', color: '#6b7280', textDecoration: 'line-through' }}>{formatKes(product.originalPrice)}</td>
                                <td style={{ padding: '8px 6px', fontWeight: 700 }}>{getDiscountPercent(product)}%</td>
                            </tr>
                        ))}
                        {!loading && diagnostics.discountedNotPriorityPreview.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '12px 6px', color: '#6b7280' }}>
                                    No discounted fallback-brand samples found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default MerchandisingDiagnostics;
