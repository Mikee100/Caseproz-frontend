import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiClient';
import { BUSINESS_LOCATION, SITE_NAME } from '../../utils/seo';

const PICKUP_LOCATION_FALLBACK = `${SITE_NAME} Shop, ${BUSINESS_LOCATION.streetAddress}`;

const OrderDetailsAdmin = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [status, setStatus] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [carrier, setCarrier] = useState('');
    const [statusNote, setStatusNote] = useState('');

    const statusOptions = [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'processing', label: 'Processing' },
        { value: 'dispatched', label: 'Dispatched' },
        { value: 'in_transit', label: 'In transit' },
        { value: 'out_for_delivery', label: 'Out for delivery' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}`);
                setOrder(data);
                setStatus(data.status || 'pending');
                setTrackingNumber(data.trackingNumber || '');
                setCarrier(data.carrier || '');
            } catch (err) {
                setError(err.message || 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        if (user && user.isAdmin) {
            fetchOrder();
        }
    }, [id, user]);

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setUpdatingStatus(true);
        try {
            const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status,
                    trackingNumber,
                    carrier,
                    note: statusNote
                }),
            });
            setOrder(data);
            setStatusNote('');
            alert('Order updated successfully');
        } catch (err) {
            alert(err.message || 'Failed to update order');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text).then(() => {
            alert(`${label} copied to clipboard`);
        });
    };

    if (loading)
        return (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                <div className="loading-spinner large"></div>
                <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>Loading order...</p>
            </div>
        );
    if (error) return <div style={{ padding: '80px 0', textAlign: 'center', color: '#dc2626' }}>{error}</div>;
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
    const isPickupOrder =
        order.fulfillmentMethod === 'pickup' ||
        order?.shippingAddress?.isPickup ||
        order?.shippingAddress?.region === 'PICKUP';

    const formatStatusLabel = (status) => {
        const found = statusSteps.find((s) => s.id === status);
        if (found) return found.label;
        if (status === 'cancelled') return 'Cancelled';
        return 'Pending confirmation';
    };

    return (
        <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link to="/admin/orderlist" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '13px' }}>
                        &larr; Back to orders
                    </Link>
                    <span style={{ fontWeight: 'bold' }}>Order #{order._id}</span>
                    <button
                        type="button"
                        onClick={() => copyToClipboard(order._id, 'Order ID')}
                        title="Copy ID"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}
                    >
                        <i className="far fa-copy"></i>
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
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
                    Print / Save as PDF
                </button>
            </div>

            <div style={{ marginBottom: '24px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>Order status</h2>
                <p style={{ color: '#666', margin: '0 0 12px 0', fontSize: '14px' }}>
                    Current status:{' '}
                    <span style={{ fontWeight: 600 }}>{formatStatusLabel(rawStatus)}</span>
                </p>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', color: '#6b7280' }}>
                        <span>Order timeline</span>
                        {order.trackingNumber && (
                            <span>
                                Tracking:&nbsp;
                                <strong>{order.trackingNumber}</strong>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(order.trackingNumber, 'Tracking Number')}
                                    title="Copy Tracking Number"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '10px', marginLeft: '4px' }}
                                >
                                    <i className="far fa-copy"></i>
                                </button>
                                {order.carrier && (
                                    <>
                                        {' '}via <strong>{order.carrier}</strong>
                                    </>
                                )}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', paddingTop: '4px' }}>
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
                                                border: isCompleted ? 'none' : '2px solid #e5e7eb',
                                                backgroundColor: isCompleted ? '#E41E26' : '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '10px',
                                                boxShadow: isActive ? '0 0 0 4px rgba(220, 38, 38, 0.08)' : 'none',
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
                                                        : '#e5e7eb'
                                                } , #e5e7eb)`,
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

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '16px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                            Customer & {isPickupOrder ? 'Pickup' : 'Delivery'}
                        </h3>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Name:</strong> {order.user.name}</p>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Email:</strong> {order.user.email}</p>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Phone:</strong> {order.user.phone || 'N/A'}</p>
                        {!isPickupOrder && (
                            <>
                                <p style={{ margin: '12px 0 5px 0', fontSize: '14px' }}><strong>Shipping Address:</strong></p>
                                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                                    {order.shippingAddress.address}, {order.shippingAddress.city}
                                    {order.shippingAddress.region && `, ${order.shippingAddress.region}`}
                                    {order.shippingAddress.location && ` (${order.shippingAddress.location})`}
                                    <br />
                                    {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                                </p>
                            </>
                        )}
                        {isPickupOrder && (
                            <p style={{ margin: '12px 0 0 0', color: '#166534', fontSize: '14px' }}>
                                <strong>Pickup location:</strong>{' '}
                                {order.shippingAddress?.pickupLocation || order.shippingAddress?.location || PICKUP_LOCATION_FALLBACK}
                            </p>
                        )}
                        <p style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
                            <strong>Placed:</strong>{' '}
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                        </p>
                    </div>

                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '16px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>Order Items</h3>
                        {order.orderItems.map((item, index) => (
                            <Link
                                key={index}
                                to={`/admin/product/${item.product}/edit`}
                                style={{
                                    display: 'flex',
                                    gap: '16px',
                                    marginBottom: '16px',
                                    paddingBottom: '16px',
                                    borderBottom: index === order.orderItems.length - 1 ? 'none' : '1px solid #f3f4f6',
                                    textDecoration: 'none',
                                    color: 'inherit'
                                }}
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    style={{ width: '70px', height: '70px', objectFit: 'contain', backgroundColor: '#f9fafb', borderRadius: '8px' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '14px' }}>{item.name}</h4>
                                    <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                                        {item.qty} x KSh {item.price.toLocaleString()} ={' '}
                                        <strong>KSh {(item.qty * item.price).toLocaleString()}</strong>
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {order.statusHistory && order.statusHistory.length > 0 && (
                        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', marginTop: '20px' }}>
                            <h3 style={{ fontSize: '16px', marginBottom: '16px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>Status History</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {order.statusHistory.slice().reverse().map((history, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                                        <div style={{ minWidth: '120px', color: '#6b7280' }}>
                                            {new Date(history.updatedAt).toLocaleString()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontWeight: 600, textTransform: 'capitalize', color: '#111827' }}>
                                                {history.status.replace(/_/g, ' ')}
                                            </span>
                                            {history.note && (
                                                <p style={{ margin: '4px 0 0 0', color: '#4b5563', fontStyle: 'italic' }}>
                                                    "{history.note}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '16px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>Update Status & Tracking</h3>
                        <form onSubmit={handleUpdateStatus} style={{ display: 'grid', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Order Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                                >
                                    {statusOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Tracking Number</label>
                                <input
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="Enter tracking number"
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Carrier</label>
                                <input
                                    type="text"
                                    value={carrier}
                                    onChange={(e) => setCarrier(e.target.value)}
                                    placeholder="e.g. Fedex, DHL, Speedaf"
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Note (optional)</label>
                                <textarea
                                    value={statusNote}
                                    onChange={(e) => setStatusNote(e.target.value)}
                                    placeholder="Reason for change or update note"
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', minHeight: '60px', resize: 'vertical' }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={updatingStatus}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#111827',
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: updatingStatus ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 0.2s',
                                    marginTop: '8px'
                                }}
                            >
                                {updatingStatus ? 'Updating...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>

                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', position: 'sticky', top: '80px' }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '16px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>Order Summary</h3>
                        <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Items Total:</span>
                                <span>KSh {order.itemsPrice.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Shipping:</span>
                                <span>{isPickupOrder ? 'Pick up (Free)' : `KSh ${order.shippingPrice.toLocaleString()}`}</span>
                            </div>

                            {order.discountAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                                    <span style={{ color: '#16a34a' }}>Discount{order.discountCode ? ` (${order.discountCode})` : ''}:</span>
                                    <span>-KSh {order.discountAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#E41E26', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                                <span>Total:</span>
                                <span>KSh {order.totalPrice.toLocaleString()}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '18px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '13px' }}>
                            <p style={{ margin: '0 0 8px 0' }}>
                                <strong>Payment Method:</strong> {order.paymentMethod}
                            </p>
                            <p style={{ margin: '0 0 8px 0' }}>
                                <strong>Fulfillment:</strong> {isPickupOrder ? 'Pickup from shop' : 'Delivery'}
                            </p>
                            <p style={{ margin: 0 }}>
                                <strong>Order status:</strong>{' '}
                                <span style={{ color: rawStatus === 'cancelled' ? '#b91c1c' : '#16a34a' }}>
                                    {formatStatusLabel(rawStatus)}
                                </span>
                            </p>
                            <p style={{ marginTop: '8px', color: '#6b7280' }}>
                                <strong>Paid:</strong>{' '}
                                {order.isPaid
                                    ? `Yes (${order.paidAt ? new Date(order.paidAt).toLocaleString() : ''})`
                                    : 'No'}
                            </p>
                            <p style={{ marginTop: '4px', color: '#6b7280' }}>
                                <strong>Delivered:</strong>{' '}
                                {order.isDelivered
                                    ? `Yes (${order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : ''})`
                                    : 'No'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsAdmin;

