import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { apiFetch } from '../utils/apiClient';
import ProductCard from '../components/ProductCard';
import { useSiteConfig } from '../context/SiteConfigContext';
import { SHIPPING_ZONES } from '../constants/shippingZones';
import ErrorBanner from '../components/ErrorBanner';

const Cart = () => {
    const { cart, cartTotal, removeFromCart, updateQuantity } = useCart();
    const { config, loading: configLoading } = useSiteConfig();
    
    console.log('Site Config in Cart:', config);
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');
    const [discount, setDiscount] = useState(0);
    const [recommendations, setRecommendations] = useState([]);
    const [priceNotice, setPriceNotice] = useState('');
    const [recommendationsError, setRecommendationsError] = useState('');
    const [selectedZoneId, setSelectedZoneId] = useState(() => localStorage.getItem('shippingZoneId') || SHIPPING_ZONES[0].id);
    const [selectedSubLocationId, setSelectedSubLocationId] = useState(() => {
        const zone = SHIPPING_ZONES.find(z => z.id === (localStorage.getItem('shippingZoneId') || SHIPPING_ZONES[0].id));
        return localStorage.getItem('shippingSubLocationId') || (zone && zone.subLocations[0]?.id) || '';
    });

    const selectedZone = SHIPPING_ZONES.find(z => z.id === selectedZoneId) || SHIPPING_ZONES[0];
    const selectedSubLocation = selectedZone.subLocations.find(sub => sub.id === selectedSubLocationId) || selectedZone.subLocations[0];
    const shippingPrice = selectedZone.price;
    const grandTotal = Math.max(cartTotal - discount, 0) + shippingPrice;

    useEffect(() => {
        localStorage.setItem('shippingZoneId', selectedZoneId);
        localStorage.setItem('shippingSubLocationId', selectedSubLocationId);
    }, [selectedZoneId, selectedSubLocationId]);

    const handleSelectZone = (zoneId) => {
        setSelectedZoneId(zoneId);
        const zone = SHIPPING_ZONES.find(z => z.id === zoneId);
        setSelectedSubLocationId(zone?.subLocations[0]?.id || '');
    };

    const handleSelectSubLocation = (subId) => {
        setSelectedSubLocationId(subId);
    };
    const handleApplyCoupon = async () => {
        const code = couponCode.trim();
        setCouponError('');
        setCouponSuccess('');

        if (!code) {
            const message = 'Please enter a coupon code.';
            setCouponError(message);
            return;
        }

        try {
            const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/discounts/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    itemsTotal: cartTotal,
                }),
            });

            const discountAmount = data?.discountAmount ?? 0;
            setDiscount(discountAmount);

            const message =
                data?.message ||
                `Coupon applied! You received a discount of KSh ${discountAmount.toLocaleString()}.`;
            setCouponSuccess(message);
        } catch (err) {
            console.error('Error applying coupon', err);
            setDiscount(0);
            setCouponError('We could not apply this coupon right now. Please try again in a moment.');
        }
    };







    // Refresh recommendations (and ensure we have up-to-date product prices/stock)
    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const data = await apiFetch(
                    `${import.meta.env.VITE_API_URL}/api/products?page=1&pageSize=60&sort=newest&isActive=true`
                );
                const allProducts = Array.isArray(data?.products) ? data.products : [];
                const cartIds = new Set(cart.map((item) => item._id));
                const filtered = allProducts.filter((p) => !cartIds.has(p._id));
                setRecommendations(filtered.slice(0, 4));

                // Light price consistency check: if any prices changed, let the user know
                const priceChanged = cart.some((item) => {
                    const latest = allProducts.find((p) => p._id === item._id);
                    return latest && latest.price !== item.price;
                });

                if (priceChanged) {
                    setPriceNotice(
                        'Some product prices have been updated since you added them to the cart. Totals reflect the latest prices.'
                    );
                } else {
                    setPriceNotice('');
                }
            } catch (err) {
                console.error('Error fetching recommendations', err);
                setRecommendationsError('We could not load product recommendations right now. Your cart is still ready to check out.');
            }
        };

        fetchRecommendations();
    }, [cart]);

    if (cart.length === 0) {
        return (
            <div className="cart-page container" style={{ padding: '60px 0' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>Cart</h1>
                <div
                    style={{
                        backgroundColor: 'white',
                        padding: '40px',
                        borderRadius: '12px',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                        textAlign: 'center',
                    }}
                >
                    <i
                        className="fas fa-shopping-bag"
                        style={{ fontSize: '48px', color: '#eee', marginBottom: '20px' }}
                    ></i>
                    <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
                        Your cart is currently empty.
                    </p>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <button
                            style={{
                                padding: '14px 26px',
                                borderRadius: '999px',
                                border: 'none',
                                backgroundColor: '#E41E26',
                                color: 'white',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                            }}
                        >
                            CONTINUE SHOPPING
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page container" style={{ padding: '30px 0 60px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px' }}>Cart</h1>

            <div className="cart-layout">
                {/* Left: Cart items + coupon + recommendations */}
                <div className="cart-main-column">
                    <ErrorBanner message={recommendationsError} onClose={() => setRecommendationsError('')} compact />
                    {/* Cart items table */}
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                            marginBottom: '30px',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr auto',
                                gap: '16px',
                                padding: '16px 24px',
                                borderBottom: '1px solid #f2f2f2',
                                backgroundColor: '#fafafa',
                                fontWeight: 600,
                                fontSize: '13px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                            }}
                        >
                            <span>Product</span>
                            <span>Price</span>
                            <span>Quantity</span>
                            <span style={{ textAlign: 'right' }}>Subtotal</span>
                        </div>

                        <div>
            {cart.map((item) => (
                                <div
                                    key={`${item._id}-${item.variantSku || 'default'}`}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1fr 1fr auto',
                                        gap: '16px',
                                        padding: '16px 24px',
                                        borderBottom: '1px solid #f7f7f7',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <button
                                            onClick={() => removeFromCart(item._id, item.variantSku)}
                                            style={{
                                                border: 'none',
                                                background: 'none',
                                                color: '#999',
                                                cursor: 'pointer',
                                                marginRight: '4px',
                                            }}
                                            aria-label="Remove item"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                        <img
                                            src={item.images[0]}
                                            alt={item.name}
                                            style={{
                                                width: '70px',
                                                height: '70px',
                                                objectFit: 'contain',
                                                backgroundColor: '#fafafa',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <div>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {item.name}
                                            </p>
                                            {(item.variantLabel || item.variantColor || item.variantStyle || item.variantSku) && (
                                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#444' }}>
                                                    {item.variantLabel || item.variantColor || item.variantStyle || item.variantSku}
                                                </p>
                                            )}
                                            {item.slug && (
                                                <p
                                                    style={{
                                                        margin: '4px 0 0',
                                                        fontSize: '12px',
                                                        color: '#777',
                                                    }}
                                                >
                                                    {item.slug}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: '#E41E26',
                                        }}
                                    >
                                        KSh {item.price.toLocaleString()}
                                    </div>

                                    <div>
                                        <div
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                borderRadius: '999px',
                                                border: '1px solid #ddd',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <button
                                                onClick={() => updateQuantity(item._id, item.quantity - 1, item.variantSku)}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    border: 'none',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                -
                                            </button>
                                            <span
                                                style={{
                                                    minWidth: '40px',
                                                    textAlign: 'center',
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item._id, item.quantity + 1, item.variantSku)}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    border: 'none',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            textAlign: 'right',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        KSh {(item.price * item.quantity).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Coupon section */}
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                            padding: '24px',
                            marginBottom: '30px',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '18px',
                                margin: '0 0 16px',
                                fontWeight: 600,
                            }}
                        >
                            Coupon
                        </h2>
                        <p style={{ fontSize: '13px', color: '#777', marginBottom: '12px' }}>
                            Enter your coupon code if you have one.
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                gap: '10px',
                                flexWrap: 'wrap',
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Coupon code"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                style={{
                                    flex: 1,
                                    minWidth: '180px',
                                    padding: '10px 14px',
                                    borderRadius: '999px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px',
                                }}
                            />
                            <button
                                onClick={handleApplyCoupon}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '999px',
                                    border: 'none',
                                    backgroundColor: '#222',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                Apply coupon
                            </button>
                        </div>

                        {couponSuccess && (
                            <div
                                style={{
                                    marginTop: '10px',
                                    fontSize: '13px',
                                    color: '#166534',
                                    backgroundColor: '#ecfdf3',
                                    borderRadius: '8px',
                                    padding: '8px 10px',
                                }}
                            >
                                {couponSuccess}
                            </div>
                        )}
                        {couponError && (
                            <div
                                style={{
                                    marginTop: '10px',
                                    fontSize: '13px',
                                    color: '#b91c1c',
                                    backgroundColor: '#fef2f2',
                                    borderRadius: '8px',
                                    padding: '8px 10px',
                                }}
                            >
                                {couponError}
                            </div>
                        )}
                    </div>

                    {/* You may be interested in... */}
                    {recommendations.length > 0 && (
                        <section
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                                padding: '24px',
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: '18px',
                                    margin: '0 0 16px',
                                    fontWeight: 600,
                                }}
                            >
                                You may be interested in…
                            </h2>
                            <div
                                className="product-grid"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: '16px',
                                }}
                            >
                                {recommendations.map((product) => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right: Cart summary + shipping options (Sweech-style) */}
                <aside className="cart-summary-column">
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                            padding: '24px',
                            marginBottom: '24px',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '18px',
                                margin: '0 0 16px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                            }}
                        >
                            Cart summary
                        </h2>

                        <div
                            style={{
                                display: 'grid',
                                gap: '10px',
                                fontSize: '14px',
                                marginBottom: '16px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span style={{ color: '#666' }}>Subtotal</span>
                                <span>KSh {cartTotal.toLocaleString()}</span>
                            </div>
                            {priceNotice && (
                                <div
                                    style={{
                                        fontSize: '12px',
                                        color: '#92400e',
                                        backgroundColor: '#fffbeb',
                                        borderRadius: '6px',
                                        padding: '6px 8px',
                                    }}
                                >
                                    {priceNotice}
                                </div>
                            )}
                            {discount > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        color: '#16a34a',
                                    }}
                                >
                                    <span>Coupon Discount</span>
                                    <span>- KSh {Math.round(discount).toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                borderTop: '1px solid #f3f4f6',
                                paddingTop: '14px',
                                marginTop: '4px',
                                marginBottom: '12px',
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: '14px',
                                    margin: '0 0 12px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: '#4b5563',
                                }}
                            >
                                Choose your delivery area
                            </h3>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Region / Zone</label>
                                <select
                                    value={selectedZoneId}
                                    onChange={e => handleSelectZone(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '14px',
                                    }}
                                >
                                    {SHIPPING_ZONES.map(zone => (
                                        <option key={zone.id} value={zone.id}>{zone.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Sub-location</label>
                                <select
                                    value={selectedSubLocationId}
                                    onChange={e => handleSelectSubLocation(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '14px',
                                    }}
                                >
                                    {selectedZone.subLocations.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.label}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedSubLocationId && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '10px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                                    <span style={{ color: '#666' }}>Delivery Fee:</span>
                                    <span style={{ fontWeight: 600 }}>KSh {shippingPrice.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                borderTop: '1px solid #e5e7eb',
                                paddingTop: '12px',
                                marginTop: '4px',
                                fontWeight: 700,
                                fontSize: '16px',
                                color: '#111827',
                            }}
                        >
                            <span>Total</span>
                            <span>KSh {Math.round(grandTotal).toLocaleString()}</span>
                        </div>

                        <p
                            style={{
                                fontSize: '12px',
                                color: '#777',
                                marginBottom: '16px',
                            }}
                        >
                            Shipping options and final totals will be confirmed during checkout based on
                            your exact delivery location.
                        </p>

                        <Link to="/checkout" style={{ textDecoration: 'none' }}>
                            <button
                                style={{
                                    width: '100%',
                                    padding: '14px 18px',
                                    borderRadius: '999px',
                                    border: 'none',
                                    backgroundColor: '#E41E26',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '10px',
                                }}
                            >
                                Proceed to checkout
                            </button>
                        </Link>

                        <Link
                            to="/"
                            style={{
                                display: 'inline-block',
                                marginTop: '8px',
                                fontSize: '13px',
                                color: '#4b5563',
                                textDecoration: 'underline',
                                textUnderlineOffset: '3px',
                            }}
                        >
                            Continue shopping
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Cart;

