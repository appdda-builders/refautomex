import React, { useState, useEffect } from 'react';
import { MdStars, MdNoAccounts, MdMarkEmailRead, MdOutlineCalendarMonth, MdDriveFileRenameOutline } from "react-icons/md";
import { IoPhonePortraitOutline } from "react-icons/io5";
import { CgDanger } from "react-icons/cg";

export default function ClientOrderModal({ isOpen, toggleModal, onSubmit }) {
    const [hasAccount, setHasAccount] = useState(false);
    const [formData, setFormData] = useState({
        nombreCompleto: '',
        fechaEntrega: '',
        telefono: '',
        email: '',
    });

    const [missingFieldsWarning, setMissingFieldsWarning] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        setMissingFieldsWarning(false);
    };

    const handleFormSubmit = () => {
        if ((!hasAccount && (!formData.nombreCompleto || !formData.fechaEntrega || !formData.telefono)) ||
            (hasAccount && (!formData.email || !formData.fechaEntrega))) {
            setMissingFieldsWarning(true);
        } else {
            onSubmit(formData, hasAccount);
            toggleModal();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${window.scrollY}px`;
            document.documentElement.scrollTop = 0;
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
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Solicitud de pedido</h3>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:p-6">
                        <div className="flex items-center mb-8">
                            <button
                                onClick={() => setHasAccount(true)}
                                className={`flex flex-row mx-2 p-2 border rounded-md ${hasAccount ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                            >
                                <MdStars className='w-6 h-6 mx-1' /> Tengo cuenta
                            </button>
                            <button
                                onClick={() => setHasAccount(false)}
                                className={`flex flex-row mx-2 p-2 border rounded-md ${!hasAccount ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                            >
                                <MdNoAccounts className='w-6 h-6 mx-1' /> No tengo
                            </button>
                        </div>

                        {!hasAccount ? (
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <label className="w-1/4 flex flex-row">
                                        <MdDriveFileRenameOutline className='w-6 h-6 mx-1' />
                                        Nombre:
                                    </label>
                                    <input
                                        type="text"
                                        name="nombreCompleto"
                                        value={formData.nombreCompleto}
                                        onChange={handleInputChange}
                                        className="w-3/4 p-2 border rounded"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="w-1/4 flex flex-row">
                                        <MdOutlineCalendarMonth className='w-6 h-6 mx-1' />
                                        Entrega:
                                    </label>
                                    <input
                                        type="date"
                                        name="fechaEntrega"
                                        value={formData.fechaEntrega}
                                        onChange={handleInputChange}
                                        className="w-3/4 p-2 border rounded"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="w-1/4 flex flex-row">
                                        <IoPhonePortraitOutline className='w-6 h-6 mx-1' />
                                        Teléfono:
                                    </label>
                                    <input
                                        type="text"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleInputChange}
                                        className="w-3/4 p-2 border rounded"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <label className="w-1/4 flex flex-row">
                                        <MdMarkEmailRead className='w-6 h-6 mx-1' />
                                        Correo:
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-3/4 p-2 border rounded"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="w-1/4 flex flex-row">
                                        <MdOutlineCalendarMonth className='w-6 h-6 mx-1' />
                                        Entrega:
                                    </label>
                                    <input
                                        type="date"
                                        name="fechaEntrega"
                                        value={formData.fechaEntrega}
                                        onChange={handleInputChange}
                                        className="w-3/4 p-2 border rounded"
                                    />
                                </div>
                            </div>
                        )}
                        <div className='h-12 top-3 left-2 relative'>
                            {missingFieldsWarning && (
                                <div className="absolute flex bg-red-100 text-red-800 p-3 rounded mb-4 text-sm animate-out">
                                    <CgDanger className='text-red-800 w-5 h-5 mr-1'/>
                                    <span>
                                        Para hacer pedido, llena todos los campos.
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                                onClick={handleFormSubmit}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                OK
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
