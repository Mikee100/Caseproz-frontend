
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiClient';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Step 1: Minimal low-stock notification logic
    const lowStockProducts = analytics && analytics.lowStockProducts ? analytics.lowStockProducts : [];

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/analytics/summary`);
                setAnalytics(data);
            } catch (err) {
                setError(err.message || 'Something went wrong. Could not load dashboard analytics.');
            } finally {
                setLoading(false);
            }
        };

        if (user && user.isAdmin) {
            fetchAnalytics();
        }
    }, [user]);

    if (loading)
        return (
            <div className="dashboard-container dashboard-state">
                <div className="loading-spinner large"></div>
                <p className="dashboard-state-text">Loading dashboard...</p>
            </div>
        );
    if (error) return <div className="dashboard-container dashboard-error">{error}</div>;
    if (!analytics) return null;

    const stats = [
        { label: 'Users', value: analytics.totalUsers, tone: 'users' },
        { label: 'Orders', value: analytics.totalOrders, tone: 'orders' },
        { label: 'Products', value: analytics.products, tone: 'products' },
        { label: 'Sales', value: `KSh ${analytics.totalSales.toLocaleString()}`, tone: 'sales' },
    ];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">Live admin snapshot for orders, revenue, and inventory risk.</p>
                </div>
                <div className="dashboard-shortcuts">
                    <Link to="/admin/orderlist" className="dashboard-shortcut-link">View orders</Link>
                    <Link to="/admin/productlist" className="dashboard-shortcut-link">Manage products</Link>
                </div>
            </div>

            <div className="dashboard-stats-grid">
                {stats.map((stat) => (
                    <div key={stat.label} className={`dashboard-stat dashboard-stat-${stat.tone}`}>
                        <p className="dashboard-stat-label">{stat.label}</p>
                        <p className="dashboard-stat-value">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="dashboard-sections-grid">
                <section className="dashboard-panel dashboard-low-stock">
                    <div className="dashboard-panel-head">
                        <h2 className="dashboard-panel-title">Low stock watch</h2>
                        <span className={`dashboard-chip ${lowStockProducts.length > 0 ? 'warning' : 'ok'}`}>
                            {lowStockProducts.length} item{lowStockProducts.length === 1 ? '' : 's'}
                        </span>
                    </div>
                    {lowStockProducts.length > 0 ? (
                        <div className="dashboard-low-stock-list-wrap">
                            <ul className="dashboard-low-stock-list">
                                {lowStockProducts.map((p) => (
                                    <li key={p._id + (p.variantSku || '')} className="dashboard-low-stock-item">
                                        <div className="dashboard-low-stock-main">
                                            <Link
                                                to={`/admin/product/${p._id}/edit${p.isVariant ? `?variant=${encodeURIComponent(p.variantSku || '')}` : ''}`}
                                                className="dashboard-product-link"
                                            >
                                                {p.name}
                                            </Link>
                                            {p.isVariant && (
                                                <span className="dashboard-variant-meta">
                                                    {p.variantColor && `Color: ${p.variantColor} `}
                                                    {p.variantStyle && `Style: ${p.variantStyle} `}
                                                    {p.variantLabel && `Label: ${p.variantLabel} `}
                                                    {p.variantSku && `SKU: ${p.variantSku}`}
                                                </span>
                                            )}
                                        </div>
                                        <span className="dashboard-stock-pill">Stock {p.stock}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="dashboard-muted">No products are currently low on stock.</p>
                    )}
                </section>

                <section className="dashboard-panel">
                    <div className="dashboard-panel-head">
                        <h2 className="dashboard-panel-title">Recent orders</h2>
                        <Link to="/admin/orderlist" className="dashboard-inline-link">Open all</Link>
                    </div>
                    <div className="dashboard-table-wrap">
                        <table className="dashboard-orders-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Total</th>
                                    <th>Paid</th>
                                    <th>Delivered</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.recentOrders.map((order) => (
                                    <tr key={order._id}>
                                        <td>
                                            <Link className="dashboard-id-link" to={`/admin/order/${order._id}`}>
                                                {order._id.substring(0, 10)}...
                                            </Link>
                                        </td>
                                        <td>{order.user && order.user.name}</td>
                                        <td>{order.createdAt.substring(0, 10)}</td>
                                        <td>KSh {order.totalPrice.toLocaleString()}</td>
                                        <td>
                                            <span className={`dashboard-badge ${order.isPaid ? 'paid' : 'unpaid'}`}>
                                                {order.isPaid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`dashboard-badge ${order.isDelivered ? 'delivered' : 'undelivered'}`}>
                                                {order.isDelivered ? 'Delivered' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
