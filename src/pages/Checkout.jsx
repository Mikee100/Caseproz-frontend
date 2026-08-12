import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
// import { SHIPPING_ZONES } from '../constants/shippingZones';
import { useSiteConfig } from '../context/SiteConfigContext';
import { apiFetch, ApiError } from '../utils/apiClient';
import ErrorBanner from '../components/ErrorBanner';

const Checkout = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const { config } = useSiteConfig();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [city, setCity] = useState(user?.city || '');
    const [postalCode, setPostalCode] = useState(user?.postalCode || '');
    const [country, setCountry] = useState(user?.country || 'Kenya');
    const [paymentMethod, setPaymentMethod] = useState('M-Pesa');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);


    const [selectedRegion, setSelectedRegion] = useState(() => localStorage.getItem('deliveryRegion') || '');
    const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem('deliveryLocation') || '');

    const [discountCode, setDiscountCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountMessage, setDiscountMessage] = useState('');
    const [applyingDiscount, setApplyingDiscount] = useState(false);

    const deliveryGroups = config?.deliveryRouteGroups || [];
    const currentGroup = deliveryGroups.find(g => g.road === selectedRegion);
    const currentLocation = currentGroup?.items.find(i => i.location === selectedLocation);

    const shippingPrice = currentLocation?.price || 0;
    const subtotalBeforeDiscount = cartTotal;
    const totalPrice = Math.max(0, subtotalBeforeDiscount + shippingPrice - discountAmount);


    useEffect(() => {
        localStorage.setItem('deliveryRegion', selectedRegion);
        localStorage.setItem('deliveryLocation', selectedLocation);
    }, [selectedRegion, selectedLocation]);

    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=/checkout');
        }
        if (cart.length === 0) {
            navigate('/');
        }
    }, [user, navigate, cart]);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');


        // Frontend validation to ensure required fields are filled
        if (!fullName.trim()) {
            const message = 'Please enter the recipient name.';
            setError(message);
            setLoading(false);
            return;
        }

        const phoneNormalized = phone.replace(/\s+/g, '');
        if (!phoneNormalized || phoneNormalized.length < 9) {
            const message = 'Please enter a valid phone number for delivery updates.';
            setError(message);
            setLoading(false);
            return;
        }

        if (!address.trim() || !city.trim() || !postalCode.trim() || !country.trim()) {
            const message = 'Please fill in your full shipping address before placing the order.';
            setError(message);
            setLoading(false);
            return;
        }

        if (!selectedRegion || !selectedLocation) {
            setError('Please select your delivery region and location.');
            setLoading(false);
            return;
        }

        if (!termsAccepted) {
            const message = 'Please confirm that you agree to the terms before placing the order.';
            setError(message);
            setLoading(false);
            return;
        }

        const orderData = {
            orderItems: cart.map(item => ({
                name: item.name,
                qty: item.quantity,
                image: item.images[0],
                price: item.price,
                product: item._id,
                variantSku: item.variantSku || undefined,
            })),
            shippingAddress: { 
                name: fullName, 
                phone: phoneNormalized, 
                address, 
                city, 
                postalCode, 
                country,
                region: selectedRegion,
                location: selectedLocation
            },
            paymentMethod,
            itemsPrice: cartTotal,
            shippingPrice,
            taxPrice: 0,
            totalPrice,
            discountCode: discountAmount > 0 ? discountCode.trim() || null : null,
            discountAmount,
        };

        try {
            const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            clearCart();
            const message = 'Order placed successfully! Redirecting to your order...';
            setSuccess(message);
            setTimeout(() => {
                navigate(`/order/${data._id}`);
            }, 1200);
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 401) {
                    setError('Your session has expired. Please log in again to place your order.');
                } else if (err.status === 400) {
                    setError(err.message || 'Please review your details and try again.');
                } else {
                    setError(err.message);
                }
            } else {
                setError('Something went wrong while placing your order. Please check your connection and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleApplyDiscount = async () => {
        const code = discountCode.trim();
        if (!code) {
            setDiscountMessage('Enter a code to apply.');
            return;
        }
        setApplyingDiscount(true);
        setDiscountMessage('');
        setError('');
        try {
            const cartProductIds = cart.map(item => item._id);
            const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/discounts/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    itemsTotal: cartTotal,
                    cartProductIds,
                }),
            });
            setDiscountAmount(data.discountAmount || 0);
            setDiscountMessage(data.message || 'Discount code applied.');
        } catch (err) {
            setDiscountAmount(0);
            setDiscountMessage('');
            if (err instanceof ApiError) {
                setError(err.message || 'Failed to apply discount code.');
            } else {
                setError('Failed to apply discount code. Please try again.');
            }
        } finally {
            setApplyingDiscount(false);
        }
    };

    if (!user || cart.length === 0) return null;

    // Lipa na M-Pesa payment instructions
    const showMpesaInstructions = paymentMethod === 'M-Pesa';

    return (
        <div className="checkout-page container" style={{ padding: '60px 0' }}>
            {showMpesaInstructions && (
                <div className="checkout-mpesa-banner" style={{
                    background: '#e6f7ee',
                    border: '1px solid #38a169',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 24,
                    color: '#22543d',
                    fontWeight: 500
                }}>
                    <span role="img" aria-label="mpesa" style={{marginRight: 8}}>💳</span>
                    <strong>Lipa na M-Pesa Instructions:</strong><br />
                    To pay for your order, use <strong>Lipa na Mpesa</strong> and enter:<br />
                    <strong>Account Number:</strong> 40043<br />
                    <strong>Business Number:</strong> (your name as entered in the order)
                </div>
            )}
            <h1 className="checkout-title" style={{ marginBottom: '16px', fontSize: '32px', fontWeight: 'bold' }}>Checkout</h1>
            <ErrorBanner message={error} onClose={() => setError('')} />

            <div className="checkout-layout">
                <form className="checkout-form" onSubmit={handlePlaceOrder}>
                    <div className="checkout-card" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>Shipping Information</h2>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Full name</label>
                            <input type="text" placeholder="Enter recipient name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Phone number</label>
                            <input type="tel" placeholder="e.g. 07xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Address</label>
                            <input type="text" placeholder="Enter address" value={address} onChange={(e) => setAddress(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                        </div>

                        <div className="checkout-2col" style={{ marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>City</label>
                                <input type="text" placeholder="Enter city" value={city} onChange={(e) => setCity(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Postal Code</label>
                                <input type="text" placeholder="Enter postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Delivery Region / Road</label>
                            <select
                                value={selectedRegion}
                                onChange={e => {
                                    setSelectedRegion(e.target.value);
                                    setSelectedLocation('');
                                }}
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px' }}
                            >
                                <option value="">Select Region</option>
                                {deliveryGroups.map(group => (
                                    <option key={group.road} value={group.road}>{group.road}</option>
                                ))}
                            </select>
                        </div>
                        {selectedRegion && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Specific Location</label>
                                <select
                                    value={selectedLocation}
                                    onChange={e => setSelectedLocation(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                                >
                                    <option value="">Select Location</option>
                                    {currentGroup?.items.map(item => (
                                        <option key={item.location} value={item.location}>{item.location} (KSh {item.price.toLocaleString()})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Country</label>
                            <input type="text" value={country} readOnly style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }} />
                        </div>
                    </div>

                    <div className="checkout-card checkout-payment-card" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>Payment Method</h2>
                        <div className="checkout-payment-options" style={{ display: 'flex', gap: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="radio" name="payment" value="M-Pesa" checked={paymentMethod === 'M-Pesa'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                M-Pesa
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="radio" name="payment" value="CreditCard" checked={paymentMethod === 'CreditCard'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                Credit Card
                            </label>
                        </div>
                    </div>
                </form>

                <div className="order-summary">
                    <div className="checkout-summary-card" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', position: 'sticky', top: '120px' }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>Order Summary</h2>

                        <div className="checkout-items-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                            {cart.map(item => (
                                <div className="checkout-summary-item" key={`${item._id}-${item.variantSku || 'default'}`} style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #f9f9f9' }}>
                                    <img src={item.images[0]} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '14px', margin: 0, fontWeight: 'bold' }}>{item.name}</p>
                                        {(item.variantLabel || item.variantColor || item.variantStyle || item.variantSku) && (
                                            <p style={{ fontSize: '12px', margin: '2px 0 0', color: '#444' }}>
                                                {item.variantLabel || item.variantColor || item.variantStyle || item.variantSku}
                                            </p>
                                        )}
                                        <p style={{ fontSize: '12px', color: '#666' }}>{item.quantity} x KSh {item.price.toLocaleString()}</p>
                                    </div>
                                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>KSh {(item.quantity * item.price).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gap: '10px', marginBottom: '16px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#666' }}>Items Subtotal:</span>
                                <span>KSh {cartTotal.toLocaleString()}</span>
                            </div>
                             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#666' }}>Shipping:</span>
                                <span>{shippingPrice === 0 ? 'Pick up (Free)' : `KSh ${shippingPrice.toLocaleString()}`}</span>
                            </div>

                            {discountAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                                    <span>Discount</span>
                                    <span>- KSh {discountAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '10px', color: '#E41E26' }}>
                                <span>Total:</span>
                                <span>KSh {totalPrice.toLocaleString()}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                Discount code
                            </label>
                            <div className="checkout-discount-row" style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                    placeholder="Enter promo code"
                                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyDiscount}
                                    disabled={applyingDiscount || !discountCode.trim()}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: applyingDiscount || !discountCode.trim() ? '#e5e7eb' : '#111827',
                                        color: applyingDiscount || !discountCode.trim() ? '#9ca3af' : '#ffffff',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: applyingDiscount || !discountCode.trim() ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {applyingDiscount ? 'Applying...' : 'Apply'}
                                </button>
                            </div>
                            {discountMessage && (
                                <p style={{ marginTop: '6px', fontSize: '12px', color: '#16a34a' }}>
                                    {discountMessage}
                                </p>
                            )}
                        </div>

                        {success && (
                            <div
                                style={{
                                    backgroundColor: '#ecfdf3',
                                    color: '#166534',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    fontSize: '14px',
                                    marginBottom: '12px'
                                }}
                            >
                                {success}
                            </div>
                        )}

                        {error && (
                            <div
                                style={{
                                    backgroundColor: '#fef2f2',
                                    color: '#b91c1c',
                                    border: '1px solid #fecaca',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    fontSize: '14px',
                                    marginBottom: '12px'
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div className="checkout-terms" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '14px', fontSize: '12px', color: '#374151' }}>
                            <input
                                type="checkbox"
                                id="checkout-terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                style={{ marginTop: '3px' }}
                            />
                            <label htmlFor="checkout-terms">
                                I confirm that I have reviewed my order details, shipping information, and understand the store&apos;s delivery and returns policy.
                            </label>
                        </div>

                        <button
                            className="checkout-place-order-btn"
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '15px',
                                backgroundColor: '#E41E26',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'PLACING ORDER...' : 'PLACE ORDER'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
