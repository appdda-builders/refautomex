import React, { useState, useEffect } from 'react';
import { FaTruckRampBox, FaParachuteBox } from "react-icons/fa6";
import { CgDanger } from "react-icons/cg";


export default function MigrateModal({ isOpen, toggleModal, onSubmit }) {
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
        console.log('Submit');
    };

    const generateRange = (start, end, prefix = '') =>
        Array.from({ length: end - start + 1 }, (_, i) => prefix + (start + i).toString().padStart(2, '0'));

    const niveles = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // A-Z
    const secciones = generateRange(0, 99);
    const anaqueles = generateRange(0, 99);

    return (
        <div className={`fixed z-10 inset-0 overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}>
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Migrar Matrices por Localizacion</h3>
                    </div>
                    <div className='flex flex-col px-2 text-stone-800 border-l-4 border-l-amber-600 m-2 shadow rounded'>
                        <div className="bg-red-200 p-2 mx-2 my-1 rounded-md">
                            <div className="flex items-center justify-center">
                                NO SE PUEDEN HACER CAMBIOS SIN SUPERVISIÓN Y ACEPTACIÓN DEL COMITÉ INTERNO
                            </div>
                        </div>
                        Para migrar las localizaciones de una matriz de productos debes asegurarte de tener disponible
                        <br />
                        <span className='text-amber-700'>TODA LA MATRIZ DESTINO</span>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:p-6">
                        <div className="space-y-4">
                            {/* ORIGEN */}
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                                <label className="flex items-center text-sm font-semibold text-gray-700">
                                    <FaTruckRampBox className="w-5 h-5 mr-2 text-blue-800" />
                                    ORIGEN:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                                    <select
                                        name="origen_anq"
                                        className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    >
                                        <option value="">Anaquel</option>
                                        {anaqueles.map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                    <select
                                        name="origen_nivel"
                                        className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    >
                                        <option value="">Nivel</option>
                                        {niveles.map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                    <select
                                        name="origen_sec"
                                        className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    >
                                        <option value="">Sección</option>
                                        {secciones.map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {/* DESTINO */}
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                <label className="flex items-center text-sm font-semibold text-gray-700">
                                    <FaParachuteBox className="w-5 h-5 mr-2 text-amber-700" />
                                    DESTINO:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                                    <select
                                        name="destino_anq"
                                        className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    >
                                        <option value="">Anaquel</option>
                                        {anaqueles.map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                    <select
                                        name="destino_nivel"
                                        className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    >
                                        <option value="">Nivel</option>
                                        {niveles.map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                    <select
                                        name="destino_sec"
                                        className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                    >
                                        <option value="">Sección</option>
                                        {secciones.map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        {/* Mensajes de advertencia */}
                        <div className='h-8 top-1 left-2 relative'>
                            {missingFieldsWarning && (
                                <div className="absolute flex bg-red-100 text-red-800 p-3 rounded mb-4 text-sm animate-out">
                                    <CgDanger className='text-red-800 w-5 h-5 mr-1' />
                                    <span>
                                        Para hacer pedido, llena todos los campos.
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* Botones */}
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
}
