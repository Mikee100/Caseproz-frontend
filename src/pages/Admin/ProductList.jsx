import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiClient';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [archivedProducts, setArchivedProducts] = useState([]);
    const [showArchived, setShowArchived] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [bulkPricePercent, setBulkPricePercent] = useState('');
    const [bulkPriceMode, setBulkPriceMode] = useState('increasePercent');
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [availabilityUpdating, setAvailabilityUpdating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const visibleProducts = showArchived ? archivedProducts : products;
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredProducts = normalizedQuery
        ? visibleProducts.filter((product) => {
            const searchable = [
                product.name,
                product.category,
                product.subCategory,
                product._id,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return searchable.includes(normalizedQuery);
        })
        : visibleProducts;

    const fetchProducts = async (archivedMode = false) => {
        try {
            if (archivedMode) {
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/archived/list`);
                const archived = Array.isArray(data?.products) ? data.products : [];
                setArchivedProducts(archived);
            } else {
                const baseUrl = `${import.meta.env.VITE_API_URL}/api/products`;
                const pageSize = 60;
                let page = 1;
                let totalPages = 1;
                const aggregated = [];

                while (page <= totalPages) {
                    const data = await apiFetch(`${baseUrl}?page=${page}&pageSize=${pageSize}&sort=newest`);
                    const pageProducts = Array.isArray(data?.products) ? data.products : [];
                    aggregated.push(...pageProducts);
                    totalPages = Number.isFinite(data?.pages) && data.pages > 0 ? data.pages : 1;
                    page += 1;
                }

                setProducts(aggregated);
            }
            setSelectedProductIds([]);
            setLoading(false);
        } catch (err) {
            setError(err.message || 'Failed to fetch products');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(showArchived);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showArchived]);

    const deleteHandler = async (id) => {
        if (window.confirm('Archive this product? You can restore it later from Archived view.')) {
            try {
                await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
                    method: 'DELETE',
                });
                fetchProducts(showArchived);
            } catch (err) {
                alert(err.message || 'Something went wrong');
            }
        }
    };

    const restoreHandler = async (id) => {
        if (!window.confirm('Restore this archived product?')) return;
        try {
            await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/${id}/restore`, {
                method: 'PUT',
            });
            fetchProducts(true);
        } catch (err) {
            alert(err.message || 'Failed to restore product');
        }
    };

    const purgeHandler = async (id) => {
        if (!window.confirm('Permanently delete this product? This cannot be undone.')) return;
        try {
            await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/${id}/purge`, {
                method: 'DELETE',
            });
            fetchProducts(true);
        } catch (err) {
            alert(err.message || 'Failed to permanently delete product');
        }
    };

    const toggleSelectProduct = (productId) => {
        setSelectedProductIds((prev) =>
            prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
        );
    };

    const toggleSelectAll = () => {
        const visibleProductIds = filteredProducts.map((p) => p._id);
        const allVisibleSelected =
            visibleProductIds.length > 0 &&
            visibleProductIds.every((id) => selectedProductIds.includes(id));

        if (allVisibleSelected) {
            setSelectedProductIds((prev) => prev.filter((id) => !visibleProductIds.includes(id)));
        } else {
            setSelectedProductIds((prev) => Array.from(new Set([...prev, ...visibleProductIds])));
        }
    };

    const handleBulkAvailability = async (isActive) => {
        if (selectedProductIds.length === 0) return;
        const label = isActive ? 'activate' : 'deactivate';
        if (!window.confirm(`Are you sure you want to ${label} ${selectedProductIds.length} products?`)) {
            return;
        }
        setAvailabilityUpdating(true);
        try {
            await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/bulk/availability`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productIds: selectedProductIds, isActive }),
            });
            fetchProducts();
        } catch (err) {
            alert(err.message || 'Failed to update availability');
        } finally {
            setAvailabilityUpdating(false);
        }
    };

    const handleBulkPriceUpdate = async () => {
        if (selectedProductIds.length === 0) return;
        const value = Number(bulkPricePercent);
        if (!Number.isFinite(value) || value === 0) {
            alert('Please enter a non-zero percentage value.');
            return;
        }
        const label =
            bulkPriceMode === 'increasePercent'
                ? 'increase'
                : 'decrease';
        if (
            !window.confirm(
                `Are you sure you want to ${label} prices by ${Math.abs(
                    value
                )}% for ${selectedProductIds.length} products?`
            )
        ) {
            return;
        }

        setBulkUpdating(true);
        try {
            await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/bulk/price`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productIds: selectedProductIds,
                    mode: bulkPriceMode,
                    value,
                }),
            });
            setBulkPricePercent('');
            fetchProducts();
        } catch (err) {
            alert(err.message || 'Failed to update prices');
        } finally {
            setBulkUpdating(false);
        }
    };

    const handleExportCsv = () => {
        const url = `${import.meta.env.VITE_API_URL}/api/products/export`;
        window.open(url, '_blank');
    };

    const styles = {
        container: {
            padding: '8px 0'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px'
        },
        title: {
            fontSize: '22px',
            fontWeight: '700',
            color: '#1a1a1a',
            margin: 0
        },
        createBtn: {
            backgroundColor: '#111827',
            color: 'white',
            padding: '9px 14px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
        },
        tableContainer: {
            backgroundColor: 'white',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left'
        },
        th: {
            padding: '10px 12px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e5e7eb',
            color: '#6b7280',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'none',
            letterSpacing: 0
        },
        td: {
            padding: '10px 12px',
            borderBottom: '1px solid #f1f5f9',
            fontSize: '13px',
            color: '#333'
        },
        productCell: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        productImg: {
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            objectFit: 'cover',
            backgroundColor: '#f5f5f5'
        },
        badge: {
            padding: '3px 8px',
            borderRadius: '20px',
            fontSize: '10px',
            fontWeight: '600',
            textTransform: 'uppercase'
        },
        actionBtn: {
            padding: '6px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
            cursor: 'pointer',
            marginRight: '6px',
            color: '#666',
            transition: 'all 0.2s',
            fontSize: '13px'
        }
    };

    if (loading)
        return (
            <div style={{ padding: '100px 0', textAlign: 'center', color: '#6b7280' }}>
                <div className="loading-spinner large"></div>
                <p style={{ marginTop: '16px', fontSize: '14px' }}>Loading products...</p>
            </div>
        );

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Products List</h1>
                    <p style={{ color: '#6b7280', marginTop: '2px', fontSize: '13px' }}>Simple inventory control for products, prices, and visibility.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        style={{
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#fff',
                            color: '#111827',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        <i className="fas fa-file-export" style={{ marginRight: '6px' }}></i>
                        Export CSV
                    </button>
                    <Link to="/admin/product/create" style={styles.createBtn}>
                        <i className="fas fa-plus"></i> Add New Product
                    </Link>
                </div>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                <button
                    type="button"
                    onClick={() => setShowArchived(false)}
                    style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: showArchived ? '#fff' : '#111827',
                        color: showArchived ? '#374151' : '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    Active
                </button>
                <button
                    type="button"
                    onClick={() => setShowArchived(true)}
                    style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: showArchived ? '#111827' : '#fff',
                        color: showArchived ? '#fff' : '#374151',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    Archived
                </button>
            </div>

            {/* Bulk controls temporarily hidden
            <div
                style={{
                    marginBottom: '10px',
                    padding: '10px 12px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#4b5563',
                }}
            >
                <div>
                    {selectedProductIds.length > 0 ? (
                        <span>{selectedProductIds.length} selected</span>
                    ) : (
                        <span>{filteredProducts.length} products</span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Availability:</span>
                        <button
                            type="button"
                            disabled={selectedProductIds.length === 0 || availabilityUpdating}
                            onClick={() => handleBulkAvailability(true)}
                            style={{
                                padding: '5px 9px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor:
                                    selectedProductIds.length === 0 || availabilityUpdating ? '#e5e7eb' : '#16a34a',
                                color:
                                    selectedProductIds.length === 0 || availabilityUpdating ? '#9ca3af' : '#ffffff',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor:
                                    selectedProductIds.length === 0 || availabilityUpdating
                                        ? 'not-allowed'
                                        : 'pointer',
                            }}
                        >
                            Activate
                        </button>
                        <button
                            type="button"
                            disabled={selectedProductIds.length === 0 || availabilityUpdating}
                            onClick={() => handleBulkAvailability(false)}
                            style={{
                                padding: '5px 9px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor:
                                    selectedProductIds.length === 0 || availabilityUpdating ? '#e5e7eb' : '#dc2626',
                                color:
                                    selectedProductIds.length === 0 || availabilityUpdating ? '#9ca3af' : '#ffffff',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor:
                                    selectedProductIds.length === 0 || availabilityUpdating
                                        ? 'not-allowed'
                                        : 'pointer',
                            }}
                        >
                            Deactivate
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Bulk price:</span>
                        <select
                            value={bulkPriceMode}
                            onChange={(e) => setBulkPriceMode(e.target.value)}
                            style={{
                                padding: '5px 8px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                fontSize: '11px',
                            }}
                        >
                            <option value="increasePercent">Increase %</option>
                            <option value="decreasePercent">Decrease %</option>
                        </select>
                        <input
                            type="number"
                            value={bulkPricePercent}
                            onChange={(e) => setBulkPricePercent(e.target.value)}
                            placeholder="%"
                            style={{
                                width: '80px',
                                padding: '5px 8px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                fontSize: '11px',
                            }}
                        />
                        <button
                            type="button"
                            disabled={selectedProductIds.length === 0 || bulkUpdating}
                            onClick={handleBulkPriceUpdate}
                            style={{
                                padding: '5px 9px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor:
                                    selectedProductIds.length === 0 || bulkUpdating ? '#e5e7eb' : '#111827',
                                color:
                                    selectedProductIds.length === 0 || bulkUpdating ? '#9ca3af' : '#ffffff',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor:
                                    selectedProductIds.length === 0 || bulkUpdating ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {bulkUpdating ? 'Updating...' : 'Apply'}
                        </button>
                    </div>
                </div>
            </div>
            */}

            <div
                style={{
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                }}
            >
                <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
                    <i
                        className="fas fa-search"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '12px',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                            fontSize: '12px',
                        }}
                    ></i>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, category, subcategory, or ID"
                        style={{
                            width: '100%',
                            padding: '8px 10px 8px 32px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            fontSize: '12px',
                            color: '#111827',
                            outline: 'none',
                            backgroundColor: '#fff',
                        }}
                    />
                </div>
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#fff',
                            color: '#4b5563',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {error && <div style={{ color: '#dc2626', marginBottom: '20px' }}>{error}</div>}

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>
                                <input
                                    type="checkbox"
                                    checked={
                                        filteredProducts.length > 0 &&
                                        filteredProducts.every((product) => selectedProductIds.includes(product._id))
                                    }
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th style={styles.th}>Product</th>
                            <th style={styles.th}>Category</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Price</th>
                            <th style={styles.th}>Stock</th>
                            <th style={styles.th}>Active</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => {
                            const isSelected = selectedProductIds.includes(product._id);
                            return (
                                <tr key={product._id} style={{ transition: 'background 0.2s', backgroundColor: isSelected ? '#f9fafb' : 'transparent' }}>
                                    <td style={styles.td}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelectProduct(product._id)}
                                        />
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.productCell}>
                                            <img src={product.images[0]} alt="" style={styles.productImg} />
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#1a1a1a' }}>{product.name}</div>
                                                <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>ID: {product._id.slice(-8)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ color: '#666' }}>{product.category}</span>
                                        <div style={{ fontSize: '10px', color: '#999' }}>{product.subCategory}</div>
                                    </td>
                                    <td style={styles.td}>
                                        {product.onSale ? (
                                            <span style={{ ...styles.badge, backgroundColor: '#fff7ed', color: '#ea580c' }}>On Sale</span>
                                        ) : (
                                            <span style={{ ...styles.badge, backgroundColor: '#f0fdf4', color: '#16a34a' }}>Standard</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ fontWeight: '700' }}>KSh {product.price.toLocaleString()}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{
                                            color: product.stock > 10 ? '#333' : '#dc2626',
                                            fontWeight: product.stock <= 5 ? '700' : '400'
                                        }}>
                                            {product.stock} pcs
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        {product.isActive !== false ? (
                                            <span style={{ ...styles.badge, backgroundColor: '#ecfdf5', color: '#16a34a' }}>Active</span>
                                        ) : (
                                            <span style={{ ...styles.badge, backgroundColor: '#f3f4f6', color: '#4b5563' }}>Hidden</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        {!showArchived ? (
                                            <>
                                                <Link to={`/admin/product/${product._id}/edit`} style={{ ...styles.actionBtn, textDecoration: 'none' }}>
                                                    <i className="fas fa-edit" style={{ color: '#3b82f6' }}></i>
                                                </Link>
                                                <button
                                                    onClick={() => deleteHandler(product._id)}
                                                    style={{ ...styles.actionBtn, color: '#dc2626' }}
                                                    title="Archive"
                                                >
                                                    <i className="fas fa-archive"></i>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => restoreHandler(product._id)}
                                                    style={{ ...styles.actionBtn, color: '#16a34a' }}
                                                    title="Restore"
                                                >
                                                    <i className="fas fa-undo"></i>
                                                </button>
                                                <button
                                                    onClick={() => purgeHandler(product._id)}
                                                    style={{ ...styles.actionBtn, color: '#dc2626' }}
                                                    title="Purge"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td
                                    colSpan="8"
                                    style={{
                                        ...styles.td,
                                        textAlign: 'center',
                                        color: '#6b7280',
                                        padding: '28px 24px',
                                    }}
                                >
                                    No products matched your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductList;
