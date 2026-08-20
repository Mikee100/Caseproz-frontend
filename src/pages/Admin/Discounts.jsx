import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiClient';

const emptyDiscount = () => ({
    _id: null,
    code: '',
    description: '',
    type: 'percent',
    value: 10,
    minOrderTotal: '',
    maxDiscount: '',
    active: true,
    startsAt: '',
    expiresAt: '',
    maxUses: '',
    products: [], // array of product IDs
});


const Discounts = () => {
    const { user } = useAuth();
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingId, setSavingId] = useState(null);
    const [editing, setEditing] = useState(null);

    // Product selection state
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);

    // Quick filters and testing tools
    const [statusFilter, setStatusFilter] = useState('all');
    const [sampleCode, setSampleCode] = useState('');
    const [sampleTotal, setSampleTotal] = useState('');
    const [sampleResult, setSampleResult] = useState(null);
    const [sampleError, setSampleError] = useState('');
    const [testing, setTesting] = useState(false);
    // Fetch all products for selection
    useEffect(() => {
        const fetchProducts = async () => {
            setProductsLoading(true);
            try {
                const baseUrl = `${import.meta.env.VITE_API_URL}/api/products`;
                const pageSize = 60;
                let page = 1;
                let totalPages = 1;
                const aggregated = [];

                while (page <= totalPages) {
                    const data = await apiFetch(`${baseUrl}?page=${page}&pageSize=${pageSize}&sort=nameAsc`);
                    const pageProducts = Array.isArray(data?.products) ? data.products : [];
                    aggregated.push(...pageProducts);
                    totalPages = Number.isFinite(data?.pages) && data.pages > 0 ? data.pages : 1;
                    page += 1;
                }

                setProducts(aggregated);
            } catch (err) {
                // ignore for now
            } finally {
                setProductsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const fetchDiscounts = async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/discounts`);
            setDiscounts(data);
        } catch (err) {
            setError(err.message || 'Failed to load discount codes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const startNew = () => {
        setSelectAll(false);
        setEditing(emptyDiscount());
    };

    const startEdit = (disc) => {
        setSelectAll(false);
        setEditing({
            _id: disc._id,
            code: disc.code || '',
            description: disc.description || '',
            type: disc.type || 'percent',
            value: disc.value || 0,
            minOrderTotal:
                typeof disc.minOrderTotal === 'number' && disc.minOrderTotal > 0
                    ? disc.minOrderTotal
                    : '',
            maxDiscount: disc.maxDiscount ?? '',
            active: disc.active !== false,
            startsAt: disc.startsAt ? disc.startsAt.substring(0, 10) : '',
            expiresAt: disc.expiresAt ? disc.expiresAt.substring(0, 10) : '',
            maxUses: disc.maxUses ?? '',
            products: Array.isArray(disc.products) ? disc.products : [],
        });
    };

    const cancelEdit = () => setEditing(null);

    const handleChange = (field, value) => {
        setEditing((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // For react-select multi-select
    const handleProductsChange = (selectedOptions) => {
        const selectedIds = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
        if (products.length > 0) {
            setSelectAll(selectedIds.length === products.length);
        }
        setEditing((prev) => ({
            ...prev,
            products: selectedIds,
        }));
    };

    // For select all toggle
    const [selectAll, setSelectAll] = useState(false);
    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        setSelectAll(checked);
        setEditing((prev) => ({
            ...prev,
            products: checked ? products.map((p) => p._id) : [],
        }));
    };

    const saveDiscount = async (e) => {
        e.preventDefault();
        if (!editing || !user) return;

        const payload = {
            code: editing.code,
            description: editing.description,
            type: editing.type,
            value: Number(editing.value),
            minOrderTotal:
                editing.minOrderTotal === '' || editing.minOrderTotal === null
                    ? null
                    : Number(editing.minOrderTotal),
            maxDiscount:
                editing.maxDiscount === '' ? undefined : Number(editing.maxDiscount),
            active: editing.active,
            startsAt: editing.startsAt ? new Date(editing.startsAt) : undefined,
            expiresAt: editing.expiresAt ? new Date(editing.expiresAt) : undefined,
            maxUses:
                editing.maxUses === '' ? undefined : Number(editing.maxUses),
            products: editing.products || [],
        };

        const isNew = !editing._id;
        const url = isNew
            ? `${import.meta.env.VITE_API_URL}/api/discounts`
            : `${import.meta.env.VITE_API_URL}/api/discounts/${editing._id}`;
        const method = isNew ? 'POST' : 'PUT';

        setSavingId(editing._id || 'new');
        setError('');
        try {
            await apiFetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            setEditing(null);
            fetchDiscounts();
        } catch (err) {
            setError(err.message || 'Failed to save discount code');
        } finally {
            setSavingId(null);
        }
    };

    const deleteDiscount = async (disc) => {
        if (!window.confirm(`Delete discount code ${disc.code}?`)) return;
        if (!user) return;
        try {
            await apiFetch(`${import.meta.env.VITE_API_URL}/api/discounts/${disc._id}`, {
                method: 'DELETE',
            });
            fetchDiscounts();
        } catch (err) {
            setError(err.message || 'Failed to delete discount code');
        }
    };

    const getStatusMeta = (disc) => {
        const now = new Date();
        const startsAt = disc.startsAt ? new Date(disc.startsAt) : null;
        const expiresAt = disc.expiresAt ? new Date(disc.expiresAt) : null;
        const maxUses = typeof disc.maxUses === 'number' ? disc.maxUses : null;
        const timesUsed = typeof disc.timesUsed === 'number' ? disc.timesUsed : 0;

        if (!disc.active) {
            return { id: 'inactive', label: 'Inactive', color: '#4b5563', bg: '#f3f4f6' };
        }

        if (maxUses !== null && timesUsed >= maxUses) {
            return { id: 'exhausted', label: 'Maxed out', color: '#b45309', bg: '#fffbeb' };
        }

        if (startsAt && now < startsAt) {
            return { id: 'scheduled', label: 'Scheduled', color: '#2563eb', bg: '#eff6ff' };
        }

        if (expiresAt && now > expiresAt) {
            return { id: 'expired', label: 'Expired', color: '#b91c1c', bg: '#fee2e2' };
        }

        return { id: 'active', label: 'Active', color: '#16a34a', bg: '#ecfdf5' };
    };

    const filteredDiscounts = discounts.filter((disc) => {
        if (statusFilter === 'all') return true;
        const meta = getStatusMeta(disc);
        return meta.id === statusFilter;
    });

    const stats = discounts.reduce(
        (acc, disc) => {
            const meta = getStatusMeta(disc);
            if (meta.id === 'active') acc.active += 1;
            if (meta.id === 'scheduled') acc.scheduled += 1;
            if (meta.id === 'expired' || meta.id === 'exhausted') acc.inactive += 1;
            return acc;
        },
        { active: 0, scheduled: 0, inactive: 0 }
    );

    const handleTestDiscount = async (e) => {
        e.preventDefault();
        setSampleResult(null);
        setSampleError('');

        const itemsTotal = Number(sampleTotal);
        if (!sampleCode.trim() || !Number.isFinite(itemsTotal) || itemsTotal <= 0) {
            setSampleError('Enter a code and a positive cart total.');
            return;
        }
        if (!user) {
            setSampleError('You need to be logged in to test a code.');
            return;
        }

        try {
            setTesting(true);
            const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/discounts/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: sampleCode, itemsTotal }),
            });
            setSampleResult(data);
        } catch (err) {
            setSampleError(err.message || 'Failed to test discount code.');
        } finally {
            setTesting(false);
        }
    };

    const styles = {
        page: {
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gap: '12px',
        },
        panel: {
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '12px',
        },
        label: {
            display: 'block',
            marginBottom: '4px',
            fontWeight: 600,
            color: '#374151',
            fontSize: '12px',
        },
        input: {
            width: '100%',
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '13px',
            backgroundColor: '#fff',
        },
        muted: {
            fontSize: '12px',
            color: '#6b7280',
        },
        danger: {
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            border: '1px solid #fecaca',
        },
    };

    return (
        <div style={styles.page}>
            <div style={{ ...styles.panel, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#111827' }}>Discount Codes</h1>
                    <p style={{ ...styles.muted, marginTop: '4px', marginBottom: 0 }}>
                        Manage promo codes, usage limits, and validity windows in one place.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={startNew}
                    style={{
                        padding: '9px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#E41E26',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    + New code
                </button>
            </div>

            {error && (
                <div style={styles.danger}>
                    {error}
                </div>
            )}

            <div style={{ ...styles.panel, display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ padding: '6px 10px', borderRadius: '999px', backgroundColor: '#ecfdf5', color: '#166534', fontSize: '12px', fontWeight: 700 }}>
                        Active: {stats.active}
                    </div>
                    <div style={{ padding: '6px 10px', borderRadius: '999px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 700 }}>
                        Scheduled: {stats.scheduled}
                    </div>
                    <div style={{ padding: '6px 10px', borderRadius: '999px', backgroundColor: '#fff7ed', color: '#9a3412', fontSize: '12px', fontWeight: 700 }}>
                        Expired/Maxed: {stats.inactive}
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={styles.muted}>Showing {filteredDiscounts.length} of {discounts.length} codes</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ ...styles.muted, fontSize: '12px' }}>Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ ...styles.input, width: '180px', padding: '7px 8px' }}
                        >
                            <option value="all">All</option>
                            <option value="active">Active now</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="expired">Expired</option>
                            <option value="exhausted">Maxed out</option>
                            <option value="inactive">Inactive flag</option>
                        </select>
                    </div>
                </div>
            </div>

            {editing && (
                <div style={styles.panel}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#111827' }}>
                        {editing._id ? `Edit ${editing.code}` : 'New Discount Code'}
                    </h2>
                    <form onSubmit={saveDiscount}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                            <div>
                                <label style={styles.label}>Code</label>
                                <input
                                    type="text"
                                    value={editing.code}
                                    onChange={(e) => handleChange('code', e.target.value)}
                                    placeholder="e.g. CASE10"
                                    style={styles.input}
                                    required
                                />
                                <label style={{ ...styles.label, marginTop: '8px' }}>Description</label>
                                <input
                                    type="text"
                                    value={editing.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Short internal description"
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Discount type</label>
                                <select
                                    value={editing.type}
                                    onChange={(e) => handleChange('type', e.target.value)}
                                    style={styles.input}
                                >
                                    <option value="percent">Percentage off</option>
                                    <option value="amount">Fixed amount off (KSh)</option>
                                </select>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>
                                    Choose how the discount is calculated.
                                </div>
                                <label style={{ ...styles.label, marginTop: '8px' }}>
                                    {editing.type === 'percent' ? 'Discount percentage (%)' : 'Discount amount (KSh)'}
                                </label>
                                <input
                                    type="number"
                                    value={editing.value}
                                    onChange={(e) => handleChange('value', e.target.value)}
                                    style={styles.input}
                                    required
                                />
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>
                                    {editing.type === 'percent'
                                        ? 'Example: 10 means 10% off the eligible subtotal.'
                                        : 'Example: 300 means KSh 300 off the eligible subtotal.'}
                                </div>
                                <label style={{ ...styles.label, marginTop: '8px' }}>Minimum cart subtotal required (KSh)</label>
                                <input
                                    type="number"
                                    value={editing.minOrderTotal}
                                    onChange={(e) => handleChange('minOrderTotal', e.target.value)}
                                    placeholder="No minimum"
                                    style={styles.input}
                                />
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>
                                    Leave blank to allow any cart subtotal.
                                </div>
                                <label style={{ ...styles.label, marginTop: '8px' }}>Active</label>
                                <div>
                                    <input
                                        type="checkbox"
                                        checked={editing.active}
                                        onChange={(e) => handleChange('active', e.target.checked)}
                                        />
                                        {' '}
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                        Allow customers to apply this code
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                    <div>
                                        <label style={styles.label}>Starts at (optional)</label>
                                        <input
                                            type="date"
                                            value={editing.startsAt}
                                            onChange={(e) => handleChange('startsAt', e.target.value)}
                                            style={styles.input}
                                        />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Expires at (optional)</label>
                                        <input
                                            type="date"
                                            value={editing.expiresAt}
                                            onChange={(e) => handleChange('expiresAt', e.target.value)}
                                            style={styles.input}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style={styles.label}>Applies to products</label>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label htmlFor="selectAllProducts" style={{ fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                                        Select all products
                                    </label>
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        id="selectAllProducts"
                                        disabled={productsLoading}
                                    />
                                </div>
                                <Select
                                    isMulti
                                    isClearable
                                    isSearchable
                                    options={products.map((p) => ({
                                        value: p._id,
                                        label: p.name + (p.category ? ` (${p.category})` : ''),
                                        image: p.images && p.images.length > 0 ? p.images[0] : null,
                                    }))}
                                    value={products
                                        .filter((p) => (editing.products || []).includes(p._id))
                                        .map((p) => ({
                                            value: p._id,
                                            label: p.name + (p.category ? ` (${p.category})` : ''),
                                            image: p.images && p.images.length > 0 ? p.images[0] : null,
                                        }))}
                                    onChange={handleProductsChange}
                                    isDisabled={productsLoading || selectAll}
                                    placeholder={productsLoading ? 'Loading products...' : 'Select products...'}
                                    styles={{
                                        control: (base) => ({ ...base, minHeight: 38, borderColor: '#d1d5db', boxShadow: 'none' }),
                                        option: (base) => ({ ...base, fontSize: 12, display: 'flex', alignItems: 'center' }),
                                        multiValueLabel: (base) => ({ ...base, fontSize: 11 }),
                                    }}
                                    formatOptionLabel={(option) => (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {option.image && (
                                                <img src={option.image} alt="" style={{ width: 22, height: 22, objectFit: 'cover', borderRadius: 4 }} />
                                            )}
                                            <span>{option.label}</span>
                                        </div>
                                    )}
                                />
                                <div style={{ ...styles.muted, marginTop: 6 }}>
                                    Selected: {selectAll ? 'All products' : `${(editing.products || []).length} products`}
                                </div>
                                <div style={{ ...styles.muted, marginTop: 2 }}>Target only selected products when not set to all.</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#fff',
                                    color: '#374151',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!!savingId}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#E41E26',
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: savingId ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {savingId ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div style={{ ...styles.panel, padding: '32px 0', textAlign: 'center', color: '#6b7280' }}>
                    Loading discount codes...
                </div>
            ) : (
                <div style={styles.panel}>
                    <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '920px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #d1d5db' }}>
                                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#6b7280', whiteSpace: 'nowrap' }}>Code</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#6b7280', whiteSpace: 'nowrap' }}>Type</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#6b7280', whiteSpace: 'nowrap' }}>Value</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#6b7280', whiteSpace: 'nowrap' }}>Min Total</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#6b7280', whiteSpace: 'nowrap' }}>Window</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#6b7280', whiteSpace: 'nowrap' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#6b7280', whiteSpace: 'nowrap' }}>Usage</th>
                                <th style={{ textAlign: 'right', padding: '10px 8px', color: '#6b7280', whiteSpace: 'nowrap' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDiscounts.map((disc) => {
                                const meta = getStatusMeta(disc);
                                return (
                                    <tr key={disc._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '10px 8px', fontWeight: 700, letterSpacing: '0.02em' }}>{disc.code}</td>
                                        <td style={{ padding: '10px 8px' }}>
                                            {disc.type === 'percent' ? 'Percent' : 'Amount'}
                                        </td>
                                        <td style={{ padding: '10px 8px' }}>
                                            {disc.type === 'percent'
                                                ? `${disc.value}%`
                                                : `KSh ${disc.value?.toLocaleString?.() ?? disc.value}`}
                                        </td>
                                        <td style={{ padding: '10px 8px' }}>
                                            {disc.minOrderTotal
                                                ? `KSh ${disc.minOrderTotal.toLocaleString()}`
                                                : 'None'}
                                        </td>
                                        <td style={{ padding: '10px 8px', fontSize: '11px', color: '#6b7280' }}>
                                            {disc.startsAt
                                                ? new Date(disc.startsAt).toLocaleDateString()
                                                : '—'}{' '}
                                            –{' '}
                                            {disc.expiresAt
                                                ? new Date(disc.expiresAt).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td style={{ padding: '10px 8px' }}>
                                            <span
                                                style={{
                                                    padding: '4px 9px',
                                                    borderRadius: '999px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    backgroundColor: meta.bg,
                                                    color: meta.color,
                                                }}
                                            >
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 8px' }}>
                                            {disc.timesUsed ?? 0}
                                            {typeof disc.maxUses === 'number' && (
                                                <> / {disc.maxUses}</>
                                            )}
                                        </td>
                                        <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <button
                                                type="button"
                                                onClick={() => startEdit(disc)}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e5e7eb',
                                                    backgroundColor: '#fff',
                                                    fontSize: '12px',
                                                    marginRight: '6px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteDiscount(disc)}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #fee2e2',
                                                    backgroundColor: '#fef2f2',
                                                    color: '#b91c1c',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredDiscounts.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ padding: '18px 8px', color: '#6b7280' }}>
                                        No discount codes match this filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* Testing panel */}
            <div style={styles.panel}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#111827' }}>
                    Quick test a code
                </h2>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
                    Simulate checkout by entering a cart total and any code (active, scheduled, or expired) to see
                    whether it applies and how much it would discount.
                </p>
                <form
                    onSubmit={handleTestDiscount}
                    style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(180px, 1fr) auto', gap: '8px', alignItems: 'center' }}
                >
                    <div>
                        <label style={styles.label}>Code</label>
                        <input
                            type="text"
                            value={sampleCode}
                            onChange={(e) => setSampleCode(e.target.value.toUpperCase())}
                            placeholder="e.g. CASE10"
                            style={styles.input}
                        />
                    </div>
                    <div>
                        <label style={styles.label}>Cart total (KSh)</label>
                        <input
                            type="number"
                            value={sampleTotal}
                            onChange={(e) => setSampleTotal(e.target.value)}
                            placeholder="e.g. 5000"
                            style={styles.input}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={testing}
                        style={{
                            marginTop: '18px',
                            padding: '9px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#111827',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: testing ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {testing ? 'Testing…' : 'Test code'}
                    </button>
                </form>
                {sampleError && (
                    <p style={{ marginTop: '10px', fontSize: '13px', color: '#b91c1c' }}>{sampleError}</p>
                )}
                {sampleResult && !sampleError && (
                    <div
                        style={{
                            marginTop: '10px',
                            padding: '9px 10px',
                            borderRadius: '8px',
                            backgroundColor: '#ecfdf3',
                            color: '#166534',
                            fontSize: '12px',
                        }}
                    >
                        <strong>KSh {sampleResult.discountAmount.toLocaleString()}</strong> discount will be
                        applied. {sampleResult.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Discounts;

