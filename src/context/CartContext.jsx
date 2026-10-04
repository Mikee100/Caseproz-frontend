import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../utils/apiClient';
import { trackGtagEvent } from '../utils/analytics';

const CartContext = createContext();
const MAX_PER_ITEM = 10;

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cart, setCart] = useState([]);

    const getCartItemKey = (item) => `${item._id}::${item.variantSku || ''}`;

    // Load account-linked cart when user logs in
    useEffect(() => {
        const loadAccountCart = async () => {
            if (!user) return;

            try {
                const data = await apiFetch(`${import.meta.env.VITE_API_URL}/api/users/cart`);
                if (Array.isArray(data.items)) {
                    setCart(data.items);
                }
            } catch {
                // fail silently; fallback to local cart
            }
        };

        loadAccountCart();
    }, [user]);

    // Persist cart to backend when authenticated
    useEffect(() => {
        const syncAccountCart = async () => {
            if (!user) return;

            try {
                const payload = {
                    items: cart.map((item) => ({
                        productId: item._id,
                        quantity: item.quantity,
                        variantSku: item.variantSku || undefined,
                    })),
                };

                await apiFetch(`${import.meta.env.VITE_API_URL}/api/users/cart`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });
            } catch {
                // ignore sync failures on the client
            }
        };

        syncAccountCart();
    }, [cart, user]);

    const addToCart = (product, quantity = 1, selectedVariant = null) => {
        if (!product) return;
        const safeIncomingQty = Math.max(1, quantity);
        const variantStock =
            selectedVariant && typeof selectedVariant.stock === 'number'
                ? selectedVariant.stock
                : null;
        const effectiveStock = variantStock ?? product.stock;
        const maxAllowedFromStock =
            typeof effectiveStock === 'number' && effectiveStock > 0
                ? effectiveStock
                : MAX_PER_ITEM;

        const variantPayload = selectedVariant
            ? {
                  variantSku: selectedVariant.sku || '',
                  variantLabel: selectedVariant.label || '',
                  variantColor: selectedVariant.color || '',
                  variantStyle: selectedVariant.style || '',
                  price: selectedVariant.price ?? product.price,
                  stock: selectedVariant.stock ?? product.stock,
                  images: selectedVariant.image
                      ? [selectedVariant.image, ...(product.images || [])]
                      : product.images || [],
              }
            : {};

        setCart((prevCart) => {
            const lookupKey = `${product._id}::${variantPayload.variantSku || ''}`;
            const existing = prevCart.find((item) => getCartItemKey(item) === lookupKey);

            if (existing) {
                const targetQty = Math.min(
                    existing.quantity + safeIncomingQty,
                    Math.min(maxAllowedFromStock, MAX_PER_ITEM)
                );

                return prevCart.map((item) =>
                    getCartItemKey(item) === lookupKey
                        ? { ...item, quantity: targetQty }
                        : item
                );
            }

            const initialQty = Math.min(safeIncomingQty, Math.min(maxAllowedFromStock, MAX_PER_ITEM));
            return [...prevCart, { ...product, ...variantPayload, quantity: initialQty }];
        });

        const unitPrice = Number(variantPayload.price ?? product.price) || 0;
        trackGtagEvent('add_to_cart', {
            currency: 'KES',
            value: unitPrice * safeIncomingQty,
            items: [{
                item_id: variantPayload.variantSku || product._id,
                item_name: product.name,
                item_variant: variantPayload.variantLabel || undefined,
                price: unitPrice,
                quantity: safeIncomingQty,
            }],
        });
    };

    const removeFromCart = (productId, variantSku = '') => {
        const targetKey = `${productId}::${variantSku || ''}`;
        setCart((prevCart) => prevCart.filter((item) => getCartItemKey(item) !== targetKey));
    };

    const updateQuantity = (productId, quantity, variantSku = '') => {
        if (quantity < 1) return;
        const targetKey = `${productId}::${variantSku || ''}`;
        setCart((prevCart) =>
            prevCart.map((item) => {
                if (getCartItemKey(item) !== targetKey) return item;

                const maxFromStock =
                    typeof item.stock === 'number' && item.stock > 0
                        ? item.stock
                        : MAX_PER_ITEM;
                const clampedQty = Math.min(quantity, Math.min(maxFromStock, MAX_PER_ITEM));

                return { ...item, quantity: clampedQty };
            })
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount,
            cartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};
