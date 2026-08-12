import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, ApiError } from '../utils/apiClient';
import ErrorBanner from '../components/ErrorBanner.jsx';

const OrderDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deliverLoading, setDeliverLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });
                setOrder(data);
            } catch (err) {
                if (err instanceof ApiError) {
                    if (err.status === 404) {
                        setError('We could not find this order. Please check the link from your email or view it from My Orders.');
                    } else if (err.status === 401 || err.status === 403) {
                        setError('You do not have access to this order. Please log in with the account that placed it.');
                    } else {
                        setError(err.message);
                    }
                } else {
                    setError('Something went wrong while loading your order. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrder();
        }
    }, [id, user]);

    const deliverHandler = async () => {
        setDeliverLoading(true);
        setError('');
        try {
            await apiFetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/deliver`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            setSuccess('Order marked as delivered successfully!');
            // Re-fetch order to update UI
            const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            setOrder(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to update order status');
        } finally {
            setDeliverLoading(false);
        }
    };

    if (loading)
        return (
            <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
                <div className="loading-spinner large"></div>
                <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>Loading order...</p>
            </div>
        );
    if (error)
        return (
            <div className="container" style={{ padding: '80px 0' }}>
                <ErrorBanner message={error} />
                <Link to="/orders" style={{ fontSize: '14px', color: '#2563eb', textDecoration: 'underline' }}>
                    Go back to My Orders
                </Link>
            </div>
        );
    if (!order) return null;

    const rawStatus = order.status || (order.isDelivered ? 'delivered' : order.isPaid ? 'processing' : 'pending');

    const statusSteps = [
        { id: 'pending', label: 'Order placed' },
        { id: 'confirmed', label: 'Confirmed' },
        { id: 'processing', label: 'Processing' },
        { id: 'dispatched', label: 'Dispatched' },
        { id: 'in_transit', label: 'In transit' },
        { id: 'out_for_delivery', label: 'Out for delivery' },
        { id: 'delivered', label: 'Delivered' },
    ];

    const statusOrder = statusSteps.map((step) => step.id);
    const currentIndex = statusOrder.indexOf(rawStatus);

    const formatStatusLabel = (status) => {
        const found = statusSteps.find((s) => s.id === status);
        if (found) return found.label;
        if (status === 'cancelled') return 'Cancelled';
        return 'Pending confirmation';
    };

    const placedDate = order.createdAt ? new Date(order.createdAt) : null;
    const etaDate =
        placedDate && !order.isDelivered
            ? new Date(placedDate.getTime() + 2 * 24 * 60 * 60 * 1000)
            : null;

    return (
        <div className="order-details-page container" style={{ padding: '60px 0' }}>
            <div
                className="order-details-topbar"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '30px',
                }}
            >
                <div className="order-details-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link to="/" style={{ color: '#4b5563', fontSize: '13px', textDecoration: 'none' }}>
                        Home
                    </Link>
                    <i className="fas fa-chevron-right" style={{ fontSize: '10px', color: '#d1d5db' }}></i>
                    <Link to="/orders" style={{ color: '#4b5563', fontSize: '13px', textDecoration: 'none' }}>
                        My orders
                    </Link>
                    <i className="fas fa-chevron-right" style={{ fontSize: '10px', color: '#d1d5db' }}></i>
                    <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827' }}>
                        Order #{order._id.slice(-6)}
                    </span>
                </div>
                <button
                    className="order-details-print-btn"
                    type="button"
                    onClick={() => window.print()}
                    style={{
                        padding: '8px 14px',
                        borderRadius: '999px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: 'white',
                        color: '#111827',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    <i className="fas fa-print"></i>
                    Print / save receipt
                </button>
            </div>

            <div
                className="order-hero"
                style={{
                    background: 'linear-gradient(135deg,#111827,#1f2937)',
                    padding: '28px 30px',
                    borderRadius: '18px',
                    marginBottom: '40px',
                    color: '#f9fafb',
                    boxShadow: '0 25px 60px rgba(15,23,42,0.55)',
                }}
            >
                <div className="order-hero-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                        <h1
                            style={{
                                fontSize: '24px',
                                margin: '0 0 6px 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                            }}
                        >
                            Thank you, {order.user.name.split(' ')[0]}!
                            <span
                                style={{
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.18em',
                                    backgroundColor: 'rgba(239, 68, 68, 0.18)',
                                    borderRadius: '999px',
                                    padding: '4px 10px',
                                    color: '#fee2e2',
                                }}
                            >
                                Order #{order._id}
                            </span>
                        </h1>
                        <p style={{ opacity: 0.85, margin: 0, fontSize: '13px' }}>
                            Your order is currently{' '}
                            <span style={{ fontWeight: 600 }}>{formatStatusLabel(rawStatus)}</span>.
                        </p>
                        {placedDate && (
                            <p style={{ opacity: 0.7, margin: '6px 0 0', fontSize: '12px' }}>
                                Placed on {placedDate.toLocaleDateString()} at{' '}
                                {placedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {etaDate && (
                                    <>
                                        {' '}
                                        · Estimated delivery by {etaDate.toLocaleDateString()}
                                    </>
                                )}
                            </p>
                        )}
                    </div>
                    <div
                        className="order-hero-total"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '6px',
                            minWidth: '170px',
                        }}
                    >
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.7 }}>
                            Order total
                        </span>
                        <span style={{ fontSize: '22px', fontWeight: 700 }}>
                            KSh {order.totalPrice.toLocaleString()}
                        </span>
                        <span
                            style={{
                                fontSize: '11px',
                                padding: '3px 9px',
                                borderRadius: '999px',
                                backgroundColor: 'rgba(34,197,94,0.16)',
                                color: '#bbf7d0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                            }}
                        >
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '999px',
                                    backgroundColor: rawStatus === 'delivered' ? '#22c55e' : '#facc15',
                                }}
                            ></span>
                            {order.isPaid ? 'Payment confirmed' : 'Payment on delivery'}
                        </span>
                    </div>
                </div>

                <div style={{ marginTop: '18px' }}>
                    <div className="order-timeline-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', color: '#6b7280' }}>
                        <span>Order timeline</span>
                        {order.trackingNumber && (
                            <span>
                                Tracking:&nbsp;
                                <strong>{order.trackingNumber}</strong>
                                {order.carrier && (
                                    <>
                                        {' '}via <strong>{order.carrier}</strong>
                                    </>
                                )}
                            </span>
                        )}
                    </div>
                    <div className="order-timeline-track" style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', paddingTop: '4px' }}>
                        {statusSteps.map((step, index) => {
                            const isCompleted = currentIndex === -1 ? index === 0 : index <= currentIndex;
                            const isActive = currentIndex === index || (currentIndex === -1 && index === 0);

                            return (
                                <div key={step.id} style={{ display: 'flex', alignItems: 'center', minWidth: index === statusSteps.length - 1 ? 'auto' : '0' }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                            minWidth: '80px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: '999px',
                                                border: isCompleted ? 'none' : '2px solid #fecaca',
                                                backgroundColor: isCompleted ? '#E41E26' : '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '10px',
                                                boxShadow: isActive ? '0 0 0 4px rgba(220, 38, 38, 0.15)' : 'none',
                                            }}
                                        >
                                            {isCompleted ? <i className="fas fa-check" style={{ fontSize: '9px' }}></i> : ''}
                                        </div>
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                color: isCompleted ? '#b91c1c' : '#9ca3af',
                                                textAlign: 'center',
                                                maxWidth: 80,
                                            }}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                    {index < statusSteps.length - 1 && (
                                        <div
                                            style={{
                                                flex: 1,
                                                height: 2,
                                                background: `linear-gradient(to right, ${
                                                    index < currentIndex || currentIndex === -1
                                                        ? '#E41E26'
                                                        : '#fee2e2'
                                                } , #fee2e2)`,
                                                margin: '0 4px',
                                                minWidth: 24,
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="order-details-main" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: '32px' }}>
                <div className="order-info">
                    <div
                        className="order-card"
                        style={{
                            backgroundColor: 'white',
                            padding: '24px 26px',
                            borderRadius: '14px',
                            boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
                            marginBottom: '26px',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '17px',
                                marginBottom: '16px',
                                borderBottom: '1px solid #f3f4f6',
                                paddingBottom: '12px',
                            }}
                        >
                            Delivery details
                        </h2>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                            <strong>Name:</strong> {order.user.name}
                        </p>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
                            <strong>Email:</strong> {order.user.email}
                        </p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                            <strong>Shipping address:</strong>
                        </p>
                        <p style={{ margin: 0, color: '#4b5563', fontSize: '14px', lineHeight: 1.5 }}>
                            {order.shippingAddress.address}, {order.shippingAddress.city}
                            {order.shippingAddress.region && `, ${order.shippingAddress.region}`}
                            {order.shippingAddress.location && ` (${order.shippingAddress.location})`}
                            <br />
                            {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                        </p>
                    </div>

                    <div
                        className="order-card"
                        style={{
                            backgroundColor: 'white',
                            padding: '24px 26px',
                            borderRadius: '14px',
                            boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '17px',
                                marginBottom: '16px',
                                borderBottom: '1px solid #f3f4f6',
                                paddingBottom: '12px',
                            }}
                        >
                            Items in your order
                        </h2>
                        {order.orderItems.map((item, index) => (
                            <div
                                key={index}
                                className="order-item-row"
                                style={{
                                    display: 'flex',
                                    gap: '16px',
                                    marginBottom: '16px',
                                    paddingBottom: '16px',
                                    borderBottom:
                                        index === order.orderItems.length - 1 ? 'none' : '1px solid #f3f4f6',
                                }}
                            >
                                <img className="order-item-image" src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'contain', backgroundColor: '#f9f9f9', borderRadius: '8px' }} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600 }}>
                                        {item.name}
                                    </h4>
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
                                        {item.qty} x KSh {item.price.toLocaleString()}{' '}
                                        <span style={{ color: '#111827', fontWeight: 600 }}>
                                            = KSh {(item.qty * item.price).toLocaleString()}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="order-summary">
                    <div
                        className="order-summary-card"
                        style={{
                            backgroundColor: 'white',
                            padding: '24px 26px',
                            borderRadius: '14px',
                            boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
                            position: 'sticky',
                            top: '96px',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '17px',
                                marginBottom: '16px',
                                borderBottom: '1px solid #f3f4f6',
                                paddingBottom: '12px',
                            }}
                        >
                            Order summary
                        </h2>
                        <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Items total</span>
                                <span>KSh {order.itemsPrice.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Shipping</span>
                                <span>KSh {order.shippingPrice.toLocaleString()}</span>
                            </div>

                            {order.discountAmount > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        color: '#16a34a',
                                    }}
                                >
                                    <span>
                                        Discount
                                        {order.discountCode ? ` (${order.discountCode})` : ''}
                                    </span>
                                    <span>- KSh {order.discountAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    borderTop: '1px solid #e5e7eb',
                                    paddingTop: '14px',
                                    marginTop: '4px',
                                }}
                            >
                                <span>Total</span>
                                <span>KSh {order.totalPrice.toLocaleString()}</span>
                            </div>
                        </div>

                        <div
                            style={{
                                marginTop: '20px',
                                padding: '12px 14px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '10px',
                                fontSize: '13px',
                            }}
                        >
                            <p style={{ margin: '0 0 6px 0' }}>
                                <strong>Payment method:</strong> {order.paymentMethod}
                            </p>
                            <p style={{ margin: 0 }}>
                                <strong>Order status:</strong>{' '}
                                <span
                                    style={{
                                        color: rawStatus === 'cancelled' ? '#b91c1c' : '#16a34a',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {formatStatusLabel(rawStatus)}
                                </span>
                            </p>
                        </div>

                        {user && user.isAdmin && !order.isDelivered && (
                            <button
                                onClick={deliverHandler}
                                disabled={deliverLoading}
                                style={{
                                    width: '100%',
                                    marginTop: '20px',
                                    padding: '14px',
                                    backgroundColor: '#111827',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    cursor: deliverLoading ? 'not-allowed' : 'pointer',
                                    opacity: deliverLoading ? 0.7 : 1,
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                {deliverLoading ? 'Updating Status...' : 'Mark as Delivered'}
                            </button>
                        )}
                        {success && (
                            <p style={{ color: '#16a34a', fontSize: '13px', marginTop: '12px', textAlign: 'center', fontWeight: 500 }}>
                                <i className="fas fa-check-circle"></i> {success}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
