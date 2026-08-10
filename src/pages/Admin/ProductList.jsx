import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiClient';

const ProductList = () => {
    const [products, setProducts] = useState([]);
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

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredProducts = normalizedQuery
        ? products.filter((product) => {
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
        : products;

    const fetchProducts = async () => {
        try {
            const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/products`);
            setProducts(Array.isArray(data.products) ? data.products : []);
            setSelectedProductIds([]);
            setLoading(false);
        } catch (err) {
            setError(err.message || 'Failed to fetch products');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const deleteHandler = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await apiFetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
                    method: 'DELETE',
                });
                fetchProducts();
            } catch (err) {
                alert(err.message || 'Something went wrong');
            }
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
            padding: '20px 0'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
        },
        title: {
            fontSize: '28px',
            fontWeight: '800',
            color: '#1a1a1a',
            margin: 0
        },
        createBtn: {
            backgroundColor: '#E41E26',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 15px rgba(228, 30, 38, 0.2)',
            transition: 'all 0.3s'
        },
        tableContainer: {
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #eee',
            overflow: 'hidden'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left'
        },
        th: {
            padding: '18px 24px',
            backgroundColor: '#f9f9f9',
            borderBottom: '1px solid #eee',
            color: '#666',
            fontSize: '13px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        },
        td: {
            padding: '18px 24px',
            borderBottom: '1px solid #eee',
            fontSize: '14px',
            color: '#333'
        },
        productCell: {
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
        },
        productImg: {
            width: '45px',
            height: '45px',
            borderRadius: '8px',
            objectFit: 'cover',
            backgroundColor: '#f5f5f5'
        },
        badge: {
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase'
        },
        actionBtn: {
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #eee',
            backgroundColor: 'white',
            cursor: 'pointer',
            marginRight: '8px',
            color: '#666',
            transition: 'all 0.2s',
            fontSize: '14px'
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
                    <p style={{ color: '#666', marginTop: '5px' }}>Manage all your physical and digital inventory in one place.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#fff',
                            color: '#111827',
                            fontSize: '13px',
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

            {/* Bulk controls */}
            <div
                style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '16px',
                    alignItems: 'center',
                    fontSize: '13px',
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
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor:
                                    selectedProductIds.length === 0 || availabilityUpdating ? '#e5e7eb' : '#16a34a',
                                color:
                                    selectedProductIds.length === 0 || availabilityUpdating ? '#9ca3af' : '#ffffff',
                                fontSize: '12px',
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
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor:
                                    selectedProductIds.length === 0 || availabilityUpdating ? '#e5e7eb' : '#dc2626',
                                color:
                                    selectedProductIds.length === 0 || availabilityUpdating ? '#9ca3af' : '#ffffff',
                                fontSize: '12px',
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
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                fontSize: '12px',
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
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                fontSize: '12px',
                            }}
                        />
                        <button
                            type="button"
                            disabled={selectedProductIds.length === 0 || bulkUpdating}
                            onClick={handleBulkPriceUpdate}
                            style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor:
                                    selectedProductIds.length === 0 || bulkUpdating ? '#e5e7eb' : '#111827',
                                color:
                                    selectedProductIds.length === 0 || bulkUpdating ? '#9ca3af' : '#ffffff',
                                fontSize: '12px',
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

            <div
                style={{
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                }}
            >
                <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
                    <i
                        className="fas fa-search"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '12px',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                            fontSize: '13px',
                        }}
                    ></i>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, category, subcategory, or ID"
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            borderRadius: '10px',
                            border: '1px solid #e5e7eb',
                            fontSize: '13px',
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
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#fff',
                            color: '#4b5563',
                            fontSize: '12px',
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
                                                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>ID: {product._id.slice(-8)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ color: '#666' }}>{product.category}</span>
                                        <div style={{ fontSize: '11px', color: '#999' }}>{product.subCategory}</div>
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
                                        <Link to={`/admin/product/${product._id}/edit`} style={{ ...styles.actionBtn, textDecoration: 'none' }}>
                                            <i className="fas fa-edit" style={{ color: '#3b82f6' }}></i>
                                        </Link>
                                        <button
                                            onClick={() => deleteHandler(product._id)}
                                            style={{ ...styles.actionBtn, color: '#dc2626' }}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
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
