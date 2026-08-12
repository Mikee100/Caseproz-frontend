import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, ApiError } from '../utils/apiClient';
import ErrorBanner from '../components/ErrorBanner';

const MyOrders = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=/orders');
            return;
        }

        const fetchOrders = async () => {
            try {
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/orders/myorders`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });
                setOrders(data);
            } catch (err) {
                if (err instanceof ApiError) {
                    if (err.status === 401) {
                        setError('Your session has expired. Please log in again to view your orders.');
                    } else {
                        setError(err.message || 'Something went wrong while fetching your orders.');
                    }
                } else {
                    setError('Something went wrong while fetching your orders.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, navigate]);

    if (!user) {
        return null;
    }

    const getStatusInfo = (order) => {
        // Fallback for older orders without an explicit status
        const rawStatus = order.status || (order.isDelivered ? 'delivered' : order.isPaid ? 'processing' : 'pending');

        switch (rawStatus) {
            case 'confirmed':
                return {
                    label: 'Confirmed',
                    bg: '#e0f2fe',
                    fg: '#075985',
                };
            case 'processing':
                return {
                    label: 'Processing',
                    bg: '#e0f2fe',
                    fg: '#075985',
                };
            case 'dispatched':
                return {
                    label: 'Dispatched',
                    bg: '#eef2ff',
                    fg: '#3730a3',
                };
            case 'in_transit':
                return {
                    label: 'In transit',
                    bg: '#eff6ff',
                    fg: '#1d4ed8',
                };
            case 'out_for_delivery':
                return {
                    label: 'Out for delivery',
                    bg: '#dcfce7',
                    fg: '#166534',
                };
            case 'delivered':
                return {
                    label: 'Delivered',
                    bg: '#dcfce7',
                    fg: '#166534',
                };
            case 'cancelled':
                return {
                    label: 'Cancelled',
                    bg: '#fee2e2',
                    fg: '#b91c1c',
                };
            case 'pending':
            default:
                return {
                    label: 'Pending confirmation',
                    bg: '#fef3c7',
                    fg: '#92400e',
                };
        }
    };

    return (
        <div className="container my-orders-page">
            <div className="my-orders-head">
                <div>
                    <p className="my-orders-eyebrow">
                        Orders
                    </p>
                    <h1 className="my-orders-title">My Orders</h1>
                    <p className="my-orders-subtitle">
                        View a history of your purchases and track current orders.
                    </p>
                </div>
                <div className="my-orders-signedin">
                    Signed in as <span>{user.email}</span>
                </div>
            </div>

            <ErrorBanner message={error} onClose={() => setError('')} />

            {loading ? (
                <div className="my-orders-loading">
                    <div className="loading-spinner large"></div>
                    <p>Loading your orders...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="my-orders-empty">
                    <div className="my-orders-empty-icon">
                        <i className="fas fa-box-open"></i>
                    </div>
                    <h3 className="my-orders-empty-title">You haven&apos;t placed any orders yet</h3>
                    <p className="my-orders-empty-note">
                        When you do, all your orders will appear here for easy tracking.
                    </p>
                    <Link to="/" className="btn-primary">START SHOPPING</Link>
                </div>
            ) : (
                <div className="my-orders-table">
                    <div className="my-orders-columns">
                        <span>Order</span>
                        <span>Date</span>
                        <span>Total</span>
                        <span>Status</span>
                        <span></span>
                    </div>
                    <div>
                        {orders
                            .slice()
                            .reverse()
                            .map((order) => (
                                <div
                                    key={order._id}
                                    className="my-orders-row"
                                >
                                    <div className="my-orders-cell order-ref" data-label="Order">
                                        <span className="order-id">#{order._id.slice(-8)}</span>
                                        <span className="order-items-count">
                                            {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <span className="my-orders-cell order-date" data-label="Date">
                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                                    </span>
                                    <span className="my-orders-cell order-total" data-label="Total">
                                        KSh {order.totalPrice.toLocaleString()}
                                    </span>
                                    <span className="my-orders-cell order-status" data-label="Status">
                                        {(() => {
                                            const statusInfo = getStatusInfo(order);
                                            return (
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '4px 10px',
                                                        borderRadius: '999px',
                                                        fontSize: '12px',
                                                        backgroundColor: statusInfo.bg,
                                                        color: statusInfo.fg,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: '6px',
                                                            height: '6px',
                                                            borderRadius: '999px',
                                                            backgroundColor: 'currentColor',
                                                        }}
                                                    ></span>
                                                    {statusInfo.label}
                                                </span>
                                            );
                                        })()}
                                    </span>
                                    <div className="my-orders-cell order-action" data-label="">
                                        <Link
                                            to={`/order/${order._id}`}
                                            className="btn-primary"
                                            style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '999px', textTransform: 'uppercase' }}
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrders;

