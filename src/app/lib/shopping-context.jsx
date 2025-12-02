'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    useCallback,
} from 'react';

const ShoppingContext = createContext();
const MIN_QTY = 1;

const readStoredCart = () => {
    if (typeof window === 'undefined') return [];
    try {
        const saved = window.localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.warn('Unable to read cart from storage:', error);
        return [];
    }
};

const getInitialCart = () => {
    if (typeof window === 'undefined') return [];
    return readStoredCart();
};

export const ShoppingProvider = ({ children }) => {
    const [cart, setCart] = useState(getInitialCart);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        setCart(readStoredCart());
    }, []);

    const totalUnits = useMemo(
        () => cart.reduce((sum, item) => sum + (item.quantity || MIN_QTY), 0),
        [cart]
    );

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('cart', JSON.stringify(cart));
        }
    }, [cart]);

    const addToCart = useCallback((product, quantity = MIN_QTY) => {
        const safeQuantity = Math.max(MIN_QTY, Number(quantity) || MIN_QTY);
        setCart((currentCart) => {
            const index = currentCart.findIndex((item) => item.num_parte === product.num_parte);
            if (index !== -1) {
                const next = [...currentCart];
                const currentQty = next[index].quantity || MIN_QTY;
                next[index] = { ...next[index], quantity: currentQty + safeQuantity };
                return next;
            }
            return [...currentCart, { ...product, quantity: safeQuantity }];
        });
    }, []);

    const removeFromCart = useCallback((product) => {
        setCart((currentCart) =>
            currentCart.filter((item) => item.num_parte !== product.num_parte)
        );
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const updateCartItemQuantity = useCallback((product, newQuantity) => {
        const safeQuantity = Math.max(MIN_QTY, Number(newQuantity) || MIN_QTY);
        setCart((currentCart) =>
            currentCart.map((item) =>
                item.num_parte === product.num_parte ? { ...item, quantity: safeQuantity } : item
            )
        );
    }, []);

    const cartItemCount = cart.length;

    const contextValue = useMemo(
        () => ({
            cart,
            items: cart,
            setCart,
            addToCart,
            removeFromCart,
            removeItem: removeFromCart,
            clearCart,
            cartItemCount,
            updateCartItemQuantity,
            totalUnits,
        }),
        [cart, addToCart, removeFromCart, clearCart, cartItemCount, updateCartItemQuantity, totalUnits]
    );

    return (
        <ShoppingContext.Provider value={contextValue}>{children}</ShoppingContext.Provider>
    );
};

export const useCart = () => useContext(ShoppingContext);
