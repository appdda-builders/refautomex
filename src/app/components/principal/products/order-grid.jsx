'use client';
import React, { useState, useContext, useEffect, useRef } from "react";
import { getStorageValue } from "@/app/lib/storage-values";
import { AuthContext } from '@/app/lib/auth-tracker';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from 'react-i18next';
import { FaShoppingBag } from "react-icons/fa";
import { IoMdCloseCircle } from "react-icons/io";
import Link from 'next/link';
import { useCart } from '@/app/lib/shopping-context';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function OrderGrid() {
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const cognitoUserSession = getStorageValue('CognitoUserSession');
    const username = cognitoUserSession?.idToken.payload["cognito:username"];
    const userData = getStorageValue(`user_${username}`);
    const { t } = useTranslation();
    const { isAuthenticated } = useContext(AuthContext);
    const { cart, removeFromCart, updateCartItemQuantity, clearCart } = useCart();
    const [checkoutCompleted, setCheckoutCompleted] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('es');
    const [modalOpen, setModalOpen] = useState(false);
    const [folioWeb, setFolioWeb] = useState('');
    const saleAlreadyProcessed = useRef(false);

    const [quantities, setQuantities] = useState(() =>
        cart.reduce((acc, item) => ({ ...acc, [item.num_parte]: item.quantity || 1 }), {})
    );

    const totalAmount = cart.reduce((total, item) => {
        return total + (item.precio * quantities[item.num_parte]);
    }, 0);

    const handleQuantityChange = (product, newQuantity) => {
        setQuantities({ ...quantities, [product.num_parte]: newQuantity });
        updateCartItemQuantity(product, newQuantity);
    };

    const handleRemoveProduct = (product) => {
        setQuantities(prevQuantities => {
            const updatedQuantities = { ...prevQuantities };
            delete updatedQuantities[product.num_parte];
            return updatedQuantities;
        });
        removeFromCart(product);
    };

    const handleClearCart = () => {
        clearCart();
        setQuantities({});
    };

    const handleCheckoutAllProducts = async () => {
        const stripe = await stripePromise;

        const lineItems = cart.map((product) => ({
            num_parte: product.num_parte,
            descripcion: product.descripcion,
            precio: !isNaN(Number(product.precio)) ? Math.round(Number(product.precio) * 100) : 100,
            quantity: quantities[product.num_parte],
        })).filter(item => !isNaN(item.precio));

        console.log('Line items being sent to checkout:', lineItems);

        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lineItems, total: totalAmount }),
            });

            const session = await response.json();

            if (!session.sessionId) {
                console.error('Session ID is undefined. Backend response:', session);
                alert('Failed to initiate checkout. Please try again.');
                return;
            }

            const result = await stripe.redirectToCheckout({
                sessionId: session.sessionId,
            });

            if (result.error) {
                console.error('Stripe checkout error:', result.error.message);
                alert(result.error.message);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error processing checkout. Please try again.');
        }
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success');

        // Asegurarte de que no se ha procesado la venta antes
        if (success === 'true' && !folioWeb && !saleAlreadyProcessed.current) {
            setCheckoutCompleted(true);
            setModalOpen(true);
            saleAlreadyProcessed.current = true; 

            const paymentMethod = localStorage.getItem('paymentMethod') || 3;
            const saleData = {
                fecha_venta: new Date().toISOString().split('T')[0],
                total_venta: totalAmount,
                idusuario: userData?.idusuario || 1,
                status: 'A',
                idmetodo: paymentMethod,
                tipo: 'W',
                productos: cart.map(item => ({
                    num_parte: item.num_parte,
                    descripcion: item.descripcion,
                    cantidad: item.quantity,
                    precio: item.precio
                }))
            };

            const saveSale = async () => {
                try {
                    const response = await fetch('/api/dataManage?type=newSale', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(saleData),
                    });

                    if (response.ok) {
                        const result = await response.json();
                        setFolioWeb(result.folio);
                        handleClearCart();
                    } else {
                        console.error('Error al guardar la venta:', response.statusText);
                    }
                } catch (error) {
                    console.error('Error en la solicitud:', error);
                }
            };

            saveSale();
        }
    }, [folioWeb, cart, totalAmount, userData]);

    const closeModal = () => {
        setModalOpen(false);
    };

    return (
        <div className='dark:bg-black min-h-screen'>
            {modalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black opacity-50 z-50">
                    <div className="bg-white rounded-lg p-8 shadow-lg max-w-md text-center">
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">¡Gracias por tu compra!</h2>
                        <p className="text-gray-600 mb-6">Tu orden se agregó a tu historial en tu cuenta.</p>
                        <button
                            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
                            onClick={closeModal}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
            <div className="container min-h-screen mx-auto bg-gradient-to-tl from-stone-100 via-slate-200 to-slate-300 dark:from-slate-700 dark:via-slate-800 dark:to-slate-950 px-6 md:px-28 py-24 sm:py-40">
                <div className="py-8">
                    {cart.map((item, index) => item && (
                        <div key={index} className="border-t pt-4 mt-4">
                            <div className="flex relative justify-between bg-white p-1 rounded-md shadow-md">
                                {!checkoutCompleted && (
                                    <button 
                                        onClick={() => handleRemoveProduct(item)} 
                                        className="absolute -top-3 -right-4 bg-gray-100 rounded-full text-red-500 dark:text-red-400 text-xl z-10 shadow"
                                    >
                                        <IoMdCloseCircle className='h-7 w-7 animate-out' />
                                    </button>
                                )}
                                <img 
                                    className="h-full w-32 my-auto object-cover object-center group-hover:opacity-75" 
                                    src={item.ruta ? `${multimediaSrc}${item.ruta}` : `${multimediaSrc}productos/no-img.png`} 
                                    alt={item.descripcion}
                                />
                                <div className="flex-1 px-4 ">
                                    <h4 className="font-semibold my-2">{item.descripcion}</h4>
                                    <p className="text-sm text-gray-600">{t('products.quantity')}</p>
                                    <select
                                        value={quantities[item.num_parte]}
                                        onChange={(e) => handleQuantityChange(item, parseInt(e.target.value))}
                                        disabled={checkoutCompleted}
                                    >
                                        {[...Array(10).keys()].map(num => (
                                            <option key={num + 1} value={num + 1}>{num + 1}</option>
                                        ))}
                                    </select>
                                    <div className="flex flex-col justify-start items-start sm:flex-row sm:justify-between sm:items-center sm:mt-6">
                                        <span className="text-sm font-semibold italic text-gray-500 my-1">$ {item.precio.toFixed(2)} MXN</span>
                                        <span className="text-lg font-semibold mt-3">$ {(item.precio * quantities[item.num_parte]).toFixed(2)} MXN</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!isAuthenticated ? (
                        <div className="transparent mt-10 p-2 flex flex-1 justify-between">
                            <p className="font-bold dark:text-white ">
                                Total (${totalAmount.toFixed(2)} MXN)
                            </p>
                            <Link 
                                href={{ pathname: "/section/account", query: { lang: selectedLanguage } }}
                                className="mt-4 text-yellow-600 dark:text-amber-300">
                                    {t('products.account')}
                            </Link>
                        </div>
                    ) : (
                        checkoutCompleted ? (
                            <div className="mt-8">
                                <div className="flex items-center justify-center">
                                    <div className="bg-white rounded-lg p-4 shadow-lg max-w-xl text-center">
                                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Ve tu historial de productos en tu cuenta.</h2>
                                        <p className="text-gray-600 mb-6">Actualiza un domicilio de entrega o recoge en sucursal según sea tu preferencia, por favor conserva tu folio para cualquier aclaración o contáctanos via Whatsapp</p>
                                        <p>FOLIO: {folioWeb}</p>
                                        <Link 
                                            href={{ pathname: "/section/products", query: { lang: selectedLanguage } }}
                                            className="inline-block bg-gradient-to-bl hover:bg-gradient-to-tr from-amber-500 via-yellow-400 to-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer font-bold">
                                                <span className='flex px-1 justify-center items-center'>
                                                    <FaShoppingBag className="inline-block text-xl md:text-2xl mx-1.5 p-0.5 rounded-md bg-slate-50 opacity-50 shadow" />
                                                    {t('index.improve.btnCaption')}
                                                </span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : (cart.length == 0 ? (
                                <div className="transparent mt-10 p-2 flex flex-col">
                                    <p className="font-bold dark:text-white ">
                                        ¿Aún no seleccionas productos nuevos para tu cuenta? ¡Hazlo ahora!
                                    </p>
                                    <div>
                                        <Link 
                                            href={{ pathname: "/section/products", query: { lang: selectedLanguage } }}
                                            className="inline-block bg-gradient-to-bl hover:bg-gradient-to-tr from-amber-500 via-yellow-400 to-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer font-bold">
                                                <span className='flex px-1 justify-center items-center'>
                                                    <FaShoppingBag className="inline-block text-xl md:text-2xl mx-1.5 p-0.5 rounded-md bg-slate-50 opacity-50 shadow" />
                                                    {t('index.improve.btnCaption')}
                                                </span>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={handleCheckoutAllProducts} className="mt-6 w-full bg-amber-500 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded">
                                    {t('products.checkout')} (${totalAmount.toFixed(2)} MXN)
                                </button>
                            )
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
