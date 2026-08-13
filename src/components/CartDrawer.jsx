import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartDrawer = ({ isOpen, onClose }) => {
    const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();

    if (!isOpen) return null;

    return (
        <div
            className="cart-overlay"
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 2000,
                display: 'flex',
                justifyContent: 'flex-end'
            }}
            aria-label="Shopping cart overlay"
        >
            <div
                className="cart-drawer"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '100%',
                    backgroundColor: 'white',
                    padding: '30px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '-5px 0 15px rgba(0,0,0,0.1)'
                }}
                role="dialog"
                aria-modal="true"
                aria-label="Shopping cart"
            >
                <div className="cart-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '30px',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '15px'
                }}>
                    <h2 style={{ fontSize: '24px', margin: 0 }}>Your Cart</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                        aria-label="Close cart"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="cart-items" style={{ flex: 1, overflowY: 'auto' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '50px' }}>
                            <i className="fas fa-shopping-bag" style={{ fontSize: '48px', color: '#eee', marginBottom: '20px' }}></i>
                            <p style={{ color: '#999' }}>Your cart is empty</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item._id} className="cart-item" style={{
                                display: 'grid',
                                gridTemplateColumns: '80px 1fr auto',
                                gap: '15px',
                                marginBottom: '20px',
                                paddingBottom: '15px',
                                borderBottom: '1px solid #f9f9f9'
                            }}>
                                <img
                                    src={item.images[0]}
                                    alt={item.name}
                                    loading="lazy"
                                    decoding="async"
                                    style={{ width: '80px', height: '80px', objectFit: 'contain', backgroundColor: '#f9f9f9', borderRadius: '8px' }}
                                />
                                <div>
                                    <h4 style={{ fontSize: '14px', margin: '0 0 5px 0', fontWeight: 'bold' }}>{item.name}</h4>
                                    <p style={{ fontSize: '14px', color: '#E41E26', fontWeight: 'bold', margin: '0 0 10px 0' }}>KSh {item.price.toLocaleString()}</p>
                                    <div className="quantity-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button
                                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                            style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
                                        >
                                            -
                                        </button>
                                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                            style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        removeFromCart(item._id);
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', alignSelf: 'start' }}
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-footer" style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContext: 'space-between', marginBottom: '20px', fontWeight: 'bold', fontSize: '18px' }}>
                            <span style={{ flex: 1 }}>Total:</span>
                            <span style={{ color: '#E41E26' }}>KSh {cartTotal.toLocaleString()}</span>
                        </div>
                        <Link to="/checkout" onClick={onClose} style={{ textDecoration: 'none' }}>
                            <button style={{
                                width: '100%',
                                padding: '15px',
                                backgroundColor: '#E41E26',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                cursor: 'pointer',
                                marginBottom: '10px'
                            }}>
                                CHECKOUT NOW
                            </button>
                        </Link>
                        <button
                            onClick={clearCart}
                            style={{
                                width: '100%',
                                padding: '10px',
                                backgroundColor: 'white',
                                color: '#999',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Clear Cart
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
