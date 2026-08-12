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
    minOrderTotal: 0,
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
        setEditing(emptyDiscount());
    };

    const startEdit = (disc) => {
        setEditing({
            _id: disc._id,
            code: disc.code || '',
            description: disc.description || '',
            type: disc.type || 'percent',
            value: disc.value || 0,
            minOrderTotal: disc.minOrderTotal || 0,
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
        setEditing((prev) => ({
            ...prev,
            products: selectedOptions ? selectedOptions.map((opt) => opt.value) : [],
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
            minOrderTotal: Number(editing.minOrderTotal || 0),
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
        card: {
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            border: '1px solid #eee',
            marginBottom: '24px',
        },
        label: {
            display: 'block',
            marginBottom: '6px',
            fontWeight: 600,
            color: '#374151',
            fontSize: '13px',
        },
        input: {
            width: '100%',
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
        },
    };

    return (
        <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: '#111827' }}>
                Discount Codes
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
                Create promotion codes that apply to the cart total at checkout. Control validity windows, limits, and
                caps — and quickly test how much a code will discount a sample order.
            </p>

            {error && (
                <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            {/* Summary & actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div style={{ ...styles.card, padding: '14px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Active codes</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>{stats.active}</div>
                </div>
                <div style={{ ...styles.card, padding: '14px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Scheduled</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>{stats.scheduled}</div>
                </div>
                <div style={{ ...styles.card, padding: '14px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Expired / maxed</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#b91c1c' }}>{stats.inactive}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={startNew}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: '#E41E26',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(228, 30, 38, 0.25)',
                        }}
                    >
                        + New discount code
                    </button>
                </div>
            </div>

            {/* Filters row */}
            <div
                style={{
                    marginBottom: '16px',
                    padding: '10px 14px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '13px',
                    color: '#4b5563',
                }}
            >
                <div>
                    Showing {filteredDiscounts.length} of {discounts.length} codes
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', marginRight: '6px' }}>Filter by status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                fontSize: '12px',
                                backgroundColor: '#f9fafb',
                            }}
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

            {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>
                    Loading discount codes...
                </div>
            ) : (
                <div style={styles.card}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ textAlign: 'left', padding: '8px 6px', color: '#6b7280' }}>Code</th>
                                <th style={{ textAlign: 'left', padding: '8px 6px', color: '#6b7280' }}>Type</th>
                                <th style={{ textAlign: 'left', padding: '8px 6px', color: '#6b7280' }}>Value</th>
                                <th style={{ textAlign: 'left', padding: '8px 6px', color: '#6b7280' }}>Min Total</th>
                                <th style={{ textAlign: 'left', padding: '8px 6px', color: '#6b7280' }}>Window</th>
                                <th style={{ textAlign: 'left', padding: '8px 6px', color: '#6b7280' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '8px 6px', color: '#6b7280' }}>Usage</th>
                                <th style={{ textAlign: 'right', padding: '8px 6px', color: '#6b7280' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDiscounts.map((disc) => {
                                const meta = getStatusMeta(disc);
                                return (
                                    <tr key={disc._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>{disc.code}</td>
                                        <td style={{ padding: '8px 6px' }}>
                                            {disc.type === 'percent' ? 'Percent' : 'Amount'}
                                        </td>
                                        <td style={{ padding: '8px 6px' }}>
                                            {disc.type === 'percent'
                                                ? `${disc.value}%`
                                                : `KSh ${disc.value?.toLocaleString?.() ?? disc.value}`}
                                        </td>
                                        <td style={{ padding: '8px 6px' }}>
                                            {disc.minOrderTotal
                                                ? `KSh ${disc.minOrderTotal.toLocaleString()}`
                                                : 'None'}
                                        </td>
                                        <td style={{ padding: '8px 6px', fontSize: '11px', color: '#6b7280' }}>
                                            {disc.startsAt
                                                ? new Date(disc.startsAt).toLocaleDateString()
                                                : '—'}{' '}
                                            –{' '}
                                            {disc.expiresAt
                                                ? new Date(disc.expiresAt).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td style={{ padding: '8px 6px' }}>
                                            <span
                                                style={{
                                                    padding: '3px 8px',
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
                                        <td style={{ padding: '8px 6px' }}>
                                            {disc.timesUsed ?? 0}
                                            {typeof disc.maxUses === 'number' && (
                                                <> / {disc.maxUses}</>
                                            )}
                                        </td>
                                        <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                onClick={() => startEdit(disc)}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e5e7eb',
                                                    backgroundColor: '#f9fafb',
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
                                    <td colSpan={8} style={{ padding: '16px 6px', color: '#6b7280' }}>
                                        No discount codes match this filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {editing && (
                <div style={styles.card}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#111827' }}>
                        {editing._id ? `Edit ${editing.code}` : 'New Discount Code'}
                    </h2>
                    <form onSubmit={saveDiscount}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                                        <div>
                                                            <label style={styles.label}>Applies to products</label>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectAll}
                                                                    onChange={handleSelectAll}
                                                                    id="selectAllProducts"
                                                                    style={{ marginRight: 4 }}
                                                                    disabled={productsLoading}
                                                                />
                                                                <label htmlFor="selectAllProducts" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                                                                    Select all products
                                                                </label>
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
                                                                    option: (base, state) => ({
                                                                        ...base,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                    }),
                                                                    singleValue: (base, state) => ({
                                                                        ...base,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                    }),
                                                                }}
                                                                formatOptionLabel={(option) => (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                        {option.image && (
                                                                            <img src={option.image} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 6 }} />
                                                                        )}
                                                                        <span>{option.label}</span>
                                                                    </div>
                                                                )}
                                                            />
                                                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>
                                                                Search and select products. Selected products appear as tags. Leave empty or check "Select all" for all products.
                                                            </div>
                                                        </div>
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
                                <label style={styles.label}>Type</label>
                                <select
                                    value={editing.type}
                                    onChange={(e) => handleChange('type', e.target.value)}
                                    style={styles.input}
                                >
                                    <option value="percent">Percent (%)</option>
                                    <option value="amount">Fixed amount (KSh)</option>
                                </select>
                                <label style={{ ...styles.label, marginTop: '8px' }}>
                                    Value {editing.type === 'percent' ? '(%)' : '(KSh)'}
                                </label>
                                <input
                                    type="number"
                                    value={editing.value}
                                    onChange={(e) => handleChange('value', e.target.value)}
                                    style={styles.input}
                                    required
                                />
                                <label style={{ ...styles.label, marginTop: '8px' }}>Min order total (KSh)</label>
                                <input
                                    type="number"
                                    value={editing.minOrderTotal}
                                    onChange={(e) => handleChange('minOrderTotal', e.target.value)}
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Max discount (KSh, optional)</label>
                                <input
                                    type="number"
                                    value={editing.maxDiscount}
                                    onChange={(e) => handleChange('maxDiscount', e.target.value)}
                                    style={styles.input}
                                />
                                <label style={{ ...styles.label, marginTop: '8px' }}>Max uses (optional)</label>
                                <input
                                    type="number"
                                    value={editing.maxUses}
                                    onChange={(e) => handleChange('maxUses', e.target.value)}
                                    style={styles.input}
                                />
                                <label style={{ ...styles.label, marginTop: '8px' }}>Active</label>
                                <div>
                                    <input
                                        type="checkbox"
                                        checked={editing.active}
                                        onChange={(e) => handleChange('active', e.target.checked)}
                                    />{' '}
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                        Allow customers to apply this code
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '10px',
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
                                    borderRadius: '10px',
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

            {/* Testing panel */}
            <div style={styles.card}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', color: '#111827' }}>
                    Quick test a code
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                    Simulate checkout by entering a cart total and any code (active, scheduled, or expired) to see
                    whether it applies and how much it would discount.
                </p>
                <form
                    onSubmit={handleTestDiscount}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: '10px', alignItems: 'center' }}
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
                            marginTop: '20px',
                            padding: '10px 18px',
                            borderRadius: '10px',
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
                            marginTop: '12px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#ecfdf3',
                            color: '#166534',
                            fontSize: '13px',
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

