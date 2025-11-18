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
import { FaBullseye } from "react-icons/fa6";
import { buildApiUrl } from '@/app/lib/refautomex-api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function OrderGrid() {
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const cognitoUserSession = getStorageValue('CognitoUserSession');
    const username = cognitoUserSession?.idToken.payload["cognito:username"];
    const userData = getStorageValue(`user_${username}`);
    const { t } = useTranslation();
    const { isAuthenticated } = useContext(AuthContext);
    const { cart, removeFromCart, clearCart } = useCart();
    const [checkoutCompleted, setCheckoutCompleted] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('es');
    const [modalOpen, setModalOpen] = useState(false);
    const [folioWeb, setFolioWeb] = useState('');
    const saleAlreadyProcessed = useRef(false);

    const totalAmount = cart.reduce((total, item) => {
        const qty = item.quantity || 1;
        return total + (Number(item.precio) || 0) * qty;
    }, 0);

    const handleRemoveProduct = (product) => {
        removeFromCart(product);
    };

    const handleCheckoutAllProducts = async () => {
        const stripe = await stripePromise;

            const lineItems = cart.map((product) => ({
            num_parte: product.num_parte,
            descripcion: product.descripcion,
            precio: !isNaN(Number(product.precio)) ? Math.round(Number(product.precio) * 100) : 100,
            quantity: product.quantity || 1,
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
                    cantidad: item.quantity || 1,
                    precio: item.precio
                }))
            };

            const saveSale = async () => {
                try {
                    const response = await fetch(buildApiUrl('/newSale'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(saleData),
                    });

                    if (response.ok) {
                        const result = await response.json();
                        setFolioWeb(result.folio);
                clearCart();
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
        <div className='bg-[rgb(var(--color-gray))] min-h-screen'>
            {modalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-[rgb(var(--color-card))]/50 z-50">
                    <div className="bg-white rounded-lg p-8 shadow-lg max-w-md text-center">
                        <h2 className="text-3xl font-bold text-[rgb(var(--color-amber))] mb-4">{t('index.improve.orderSuccess')}</h2>
                        <p className="text-gray-700 mb-6">{t('index.improve.addOrder')}</p>
                        <button
                            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
                            onClick={closeModal}
                        >
                            {t('index.improve.btnComplete')}
                        </button>
                    </div>
                </div>
            )}
            <div className="container min-h-screen mx-auto bg-gradient-to-tl from-[rgb(var(--color-gray))] via-[rgb(var(--color-bg))] to-[rgb(var(--color-card))] px-6 md:px-28 py-24 sm:py-40">
                <div className="py-8">
                    {cart.map((item, index) => {
                        if (!item) return null;
                        const quantity = item.quantity || 1;
                        const lineTotal = (Number(item.precio) || 0) * quantity;
                        return (
                            <div key={index} className="border-t pt-4 mt-4">
                                <div className="flex relative justify-between bg-white p-1 rounded-md shadow-md">
                                    {!checkoutCompleted && (
                                        <button
                                            onClick={() => handleRemoveProduct(item)}
                                            className="absolute -top-3 -right-4 bg-gray-100 rounded-full text-red-500 text-xl z-10 shadow"
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
                                        <div className="text-lg font-semibold text-[rgb(var(--color-text))]">
                                            {quantity}
                                        </div>
                                        <div className="flex flex-col justify-start items-start sm:flex-row sm:justify-between sm:items-center sm:mt-6">
                                            <p className="text-lg font-semibold text-cyan-600">{lineTotal.toFixed(2)} MXN</p>
                                            <p className="text-sm text-gray-500">{t('products.shipments')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-col justify-between bg-white px-6 py-4 rounded-xl shadow">
                    <div className={`grid grid-cols-1 ${folioWeb ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                                <FaShoppingBag className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600">{t('account.order')}</p>
                                <p className="text-2xl font-semibold text-gray-900">${totalAmount.toFixed(2)} MXN</p>
                            </div>
                        </div>
                        {folioWeb && (
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-violet-100 text-violet-600 rounded-full">
                                    <FaBullseye className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-600">Folio WEB</p>
                                    <p className="text-2xl font-semibold text-gray-900">{folioWeb}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <p className="text-sm text-gray-600 text-center">{t('account.payment')}</p>
                            <button
                                onClick={handleCheckoutAllProducts}
                                disabled={cart.length === 0 || checkoutCompleted}
                                className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold shadow hover:bg-emerald-600 disabled:bg-gray-300 disabled:text-gray-500 transition"
                            >
                                {checkoutCompleted ? t('index.improve.btnComplete') : t('index.improve.btnContinue')}
                            </button>
                        </div>
                    </div>
                    {!isAuthenticated && (
                        <p className="text-center text-sm text-gray-500 mt-4">
                            {t('account.needAccount')}{' '}
                            <Link href="/section/account?load=sign-up" className="text-emerald-600 font-semibold">
                                {t('account.signUp')}
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
