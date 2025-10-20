import React, { useState } from 'react';

export default function RowTypeModal({ isOpen, toggleModal, onConfirm }) {
    const handleSelect = (type) => {
        onConfirm({ type });
        toggleModal();
    };

    return (
        <div className={`fixed z-10 inset-0 overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}>
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Seleccionar Tipo de Producto</h3>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:p-6 space-y-4">
                        <button
                            onClick={() => handleSelect('nuevo')}
                            className="w-full p-2 border flex justify-center rounded-md bg-gray-200 hover:bg-blue-500 hover:text-white"
                        >
                            Nuevo
                        </button>
                        <button
                            onClick={() => handleSelect('seminuevo')}
                            className="w-full p-2 border flex justify-center rounded-md bg-gray-200 hover:bg-blue-500 hover:text-white"
                        >
                            Seminuevo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
