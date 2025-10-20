import { useState } from 'react';

export default function FindFolio({ isOpen, onClose, onFilter }) {
    const [folio, setFolio] = useState('');

    const handleApplyFilter = () => {
        onFilter({ folio });
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg w-96">
                <h2 className="text-lg font-semibold dark:text-white">Filtra por folio</h2>
                    <div>
                        <label className='block text-sm dark:text-gray-300 text-slate-500 pt-1 pb-3 ml-2' >T-123456789 | W-123456789</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={folio}
                                onChange={(e) => setFolio(e.target.value)}
                            />
                        </div>
                    </div>

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
