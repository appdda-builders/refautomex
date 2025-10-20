import { useState } from 'react';

export default function FindFilter({ isOpen, onClose, onFilter }) {
    const [activeTab, setActiveTab] = useState('provider'); // Controla la pestaña activa
    const [providerName, setProviderName] = useState('');
    const [refaccion, setRefaccion] = useState('');
    const [captureDate, setCaptureDate] = useState('');

    const handleApplyFilter = () => {
        if (activeTab === 'provider') {
            onFilter({ providerName });
        } else if (activeTab === 'refaccion') {
            onFilter({ refaccion });
        } else if (activeTab === 'date') {
            onFilter({ dateRange });
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg w-96">
                <h2 className="text-lg font-semibold dark:text-white">Filtrar Proveedores</h2>
                {/* Tabs */}
                <div className="flex justify-center mt-2 mb-4">
                    <button
                        className={`px-4 py-2 ${activeTab === 'provider' ? 'bg-amber-500 text-white' : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white'} rounded-l-lg`}
                        onClick={() => setActiveTab('provider')}
                    >
                        Proveedor
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'refaccion' ? 'bg-amber-500 text-white' : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white'}`}
                        onClick={() => setActiveTab('refaccion')}
                    >
                        Refacción
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'date' ? 'bg-amber-500 text-white' : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white'} rounded-r-lg`}
                        onClick={() => setActiveTab('date')}
                    >
                        Fecha
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'provider' && (
                    <div>
                        <label className="block text-sm dark:text-gray-300">Proveedor:</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                            value={providerName}
                            onChange={(e) => setProviderName(e.target.value)}
                        />
                    </div>
                )}
                {activeTab === 'refaccion' && (
                    <div>
                        <label className="block text-sm dark:text-gray-300">Refacción:</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                            value={refaccion}
                            onChange={(e) => setRefaccion(e.target.value)}
                        />
                    </div>
                )}
                {activeTab === 'date' && (
                    <div>
                        <label className="block text-sm dark:text-gray-300">Fechas de Captura:</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={captureDate}
                                onChange={(e) => setCaptureDate(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="mt-6 flex justify-end gap-4">
                    <button
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded text-black dark:text-white"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-500 dark:bg-blue-700 text-white rounded"
                        onClick={handleApplyFilter}
                    >
                        Filtrar
                    </button>
                </div>
            </div>
        </div>
    );
}
