import React, { createContext, useContext, useState, useEffect } from 'react';

const ShoppingContext = createContext();

export const ShoppingProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [cartItemCount, setCartItemCount] = useState(0);

    useEffect(() => {
        setCartItemCount(cart.length);
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart(currentCart => {
            const itemIndex = currentCart.findIndex(item => item.num_parte === product.num_parte);
            if (itemIndex !== -1) {
                const newCart = [...currentCart];
                newCart[itemIndex] = { ...newCart[itemIndex], quantity: newCart[itemIndex].quantity + 1 };
                return newCart;
            } else {
                return [...currentCart, { ...product, quantity: 1 }];
            }
        });
    };
    
    const removeFromCart = (product) => {
        setCart(currentCart => {
            return currentCart.filter(item => item.num_parte !== product.num_parte);
        });
    };
    
    const clearCart = () => {
        setCart([]);
    };

    const updateCartItemQuantity = (product, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(currentCart => {
            return currentCart.map(item =>
                item.num_parte === product.num_parte ? { ...item, quantity: newQuantity } : item
            );
        });
    };
    

    return (
        <ShoppingContext.Provider value={{ cart, setCart, addToCart, removeFromCart, clearCart, cartItemCount, setCartItemCount, updateCartItemQuantity }}>
            {children}
        </ShoppingContext.Provider>
    );
};

export const useCart = () => useContext(ShoppingContext);
