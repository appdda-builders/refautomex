import React, { useState, useEffect } from 'react';
import { BsCashCoin, BsCreditCard2Front, BsCreditCard } from "react-icons/bs";
import { FaMoneyBillTransfer } from "react-icons/fa6";

export default function PaymentTypeModal({ isOpen, toggleModal, onConfirm }) {
    const [selectedPaymentType, setSelectedPaymentType] = useState(null);

    const paymentTypesMap = {
        '1': 1, // efectivo
        '2': 2, // tarjeta de débito
        '3': 3, // tarjeta de crédito
        '4': 4  // transferencia
    };

    const handleSelect = (type) => {
        setSelectedPaymentType(type);
    };

    const handleConfirm = () => {
        if (!selectedPaymentType) {
            alert("Por favor, selecciona un método de pago antes de confirmar.");
            return;
        }
        const paymentId = paymentTypesMap[selectedPaymentType];
        onConfirm(paymentId);
        toggleModal();
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${window.scrollY}px`;
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            const scrollY = document.body.style.top;
            document.body.style.top = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            window.scrollTo(0, parseInt(document.body.style.top || '0') * -1);
        };
    }, [isOpen]);

    return (
        <div className={`fixed z-10 inset-0 overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}>
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Seleccionar Tipo de Pago</h3>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:p-6">
                        <div className="space-y-4">
                            {Object.keys(paymentTypesMap).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => handleSelect(key)}
                                    className={`w-full p-2 border flex flex-row text-center rounded-md
                                    ${selectedPaymentType === key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    {key === '1' && <BsCashCoin className='w-6 h-6 mx-3' />} 
                                    {key === '2' && <BsCreditCard className='w-6 h-6 mx-3' />}
                                    {key === '3' && <BsCreditCard2Front className='w-6 h-6 mx-3' />}
                                    {key === '4' && <FaMoneyBillTransfer className='w-6 h-6 mx-3' />}
                                    {key === '1' && 'Efectivo'}
                                    {key === '2' && 'Tarjeta de Débito'}
                                    {key === '3' && 'Tarjeta de Crédito'}
                                    {key === '4' && 'Transferencia'}
                                </button>
                            ))}
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                                onClick={handleConfirm}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={toggleModal}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
