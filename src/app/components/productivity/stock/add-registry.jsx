import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
import { buildApiUrl } from '@/app/lib/refautomex-api';

export default function AddRegistry({ onCancelEdit }) {
    const [addItem, setAddItem] = useState({
        refaccion: '',
        idsucursal: '',
        localizacion: '',
        descripcion: '',
        existencia: '',
        costo: '',
        precio: '',
        utilidad: '1.3',
        mod_ini: '1990',
        mod_fin: '1990',
        idmarca: '',
    });
    const [brandOptions, setBrandOptions] = useState([]);
    const [sucursalOptions, setSucursalOptions] = useState([]);
    const [quantityOptions, setQuantityOptions] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorMessages, setErrorMessages] = useState({});

    const handleInputChange = (field, value) => {
        setAddItem((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSelectChange = (field, selectedOption) => {
        setAddItem((prev) => ({
            ...prev,
            [field]: selectedOption ? selectedOption.value : '',
        }));
    };

    const validateSubmit = () => {
        const regexPatterns = {
            refaccion: /^[A-Z0-9-]+$/,
            localizacion: /^[0-9]{2}[A-Z]{1}[0-9A-Z]{2}[-0-9]{2,3}$/,
            descripcion: /^\s*\S+.*$/,
            mod_ini: /^[0-9]{1,4}$/,
            mod_fin: /^[0-9]{1,4}$/,
            existencia: /^[0-9]+$/,
            precio: /^[0-9]+(\.[0-9]+)?$/,
            costo: /^[0-9]+(\.[0-9]+)?$/,
            utilidad: /^[0-9]+(\.[0-9]+)?$/,
        };

        let isValid = true;
        const newErrorMessages = {};

        for (const [key, value] of Object.entries(addItem)) {
            if (regexPatterns[key] && !regexPatterns[key].test(value)) {
                isValid = false;
                newErrorMessages[key] = `${key} es inválido.`;
            }
        }

        setErrorMessages(newErrorMessages);
        return isValid;

        //validar si el numero de parte existe
        //validar si la localizacion ya existe

        //Si nada existe entonces se puede agregar
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessages({});
        setSuccessMessage('');
        setErrorMessage('');

        if (!validateSubmit()) {
            setErrorMessage('Por favor, corrige los campos marcados como inválidos.');
            return;
        }

        try {
            await axios.post('/api/dataManage?type=addProduct', addItem, {
                headers: { 'Content-Type': 'application/json' },
            });
            setSuccessMessage('Registro agregado exitosamente.');
        } catch (error) {
            setErrorMessage('Hubo un error al guardar los datos. Intenta de nuevo.');
        }
    };

    useEffect(() => {
        const fetchBrandOptions = async () => {
            try {
                const response = await axios.get(buildApiUrl('/getBrands'));
                const options = response.data.map((brand) => ({
                    value: brand.idmarca,
                    label: brand.marca,
                }));
                setBrandOptions(options);
            } catch (error) {
                console.error('Error al obtener marcas:', error);
            }
        };

        const fetchQuantityOptions = async () => {
            try {
                const response = await axios.get(buildApiUrl('/getQuantity'));
                const options = response.data.map((quantity) => ({
                    value: quantity.idCantidad,
                    label: quantity.cantidad,
                }));
                setQuantityOptions(options);
            } catch (error) {
                console.error('Error al obtener cantidades:', error);
            }
        };

        const fetchSucursalOptions = async () => {
            try {
                const response = await axios.get(buildApiUrl('/getSucursal'));
                const options = response.data.map((sucursal) => ({
                    value: sucursal.idsucursal,
                    label: sucursal.sucursal,
                }));
                setSucursalOptions(options);
            } catch (error) {
                console.error('Error al obtener sucursales:', error);
            }
        };

        fetchBrandOptions();
        fetchQuantityOptions();
        fetchSucursalOptions();
    }, []);

    return (
        <form onSubmit={handleSubmit}>
            <div className="md:px-20 py-10">
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Refacción
                        </label>
                        <input
                            type="text"
                            value={addItem.refaccion}
                            onChange={(e) => handleInputChange('refaccion', e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 uppercase"
                        />
                        {errorMessages.refaccion && (
                            <span className="text-red-600 text-sm">{errorMessages.refaccion}</span>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Sucursal
                        </label>
                        <Select
                            options={sucursalOptions}
                            value={sucursalOptions.find((option) => option.value === addItem.idsucursal)}
                            onChange={(selectedOption) => handleSelectChange('sucursal', selectedOption)}
                        />
                        {errorMessages.sucursal && (
                            <span className="text-red-600 text-sm">{errorMessages.sucursal}</span>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Localización
                        </label>
                        <input
                            type="text"
                            value={addItem.localizacion}
                            onChange={(e) => handleInputChange('localizacion', e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 uppercase"
                        />
                        {errorMessages.localizacion && (
                            <span className="text-red-600 text-sm">{errorMessages.localizacion}</span>
                        )}
                    </div>

                    <div className="col-span-full">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Descripción
                        </label>
                        <textarea
                            value={addItem.descripcion}
                            onChange={(e) => handleInputChange('descripcion', e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 uppercase"
                        />
                        {errorMessages.descripcion && (
                            <span className="text-red-600 text-sm">{errorMessages.descripcion}</span>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Existencia
                        </label>
                        <Select
                            options={quantityOptions}
                            value={quantityOptions.find((option) => option.value === addItem.existencia)}
                            onChange={(selectedOption) => handleSelectChange('existencia', selectedOption)}
                        />
                        {errorMessages.existencia && (
                            <span className="text-red-600 text-sm">{errorMessages.existencia}</span>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Modelo
                        </label>
                        <div className="flex items-center">
                            <Select
                                options={Array.from({ length: 36 }, (_, i) => {
                                    const year = 1990 + i;
                                    return { value: year, label: `${year}` };
                                })}
                                value={{ value: addItem.mod_ini, label: addItem.mod_ini }}
                                onChange={(selectedOption) => handleSelectChange('mod_ini', selectedOption)}
                                className="w-full"
                            />
                            <span className="mx-2">-</span>
                            <Select
                                options={Array.from({ length: 36 }, (_, i) => {
                                    const year = 1990 + i;
                                    return { value: year, label: `${year}` };
                                })}
                                value={{ value: addItem.mod_fin, label: addItem.mod_fin }}
                                onChange={(selectedOption) => handleSelectChange('mod_fin', selectedOption)}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Marca de auto
                        </label>
                        <Select
                            options={brandOptions}
                            value={brandOptions.find((option) => option.value === addItem.idmarca)}
                            onChange={(selectedOption) => handleSelectChange('idmarca', selectedOption)}
                        />
                        {errorMessages.idmarca && (
                            <span className="text-red-600 text-sm">{errorMessages.idmarca}</span>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Utilidad
                        </label>
                        <Select
                            options={[
                                { value: 1.25, label: '25%' },
                                { value: 1.3, label: '30%' },
                                { value: 1.35, label: '35%' },
                            ]}
                            value={{
                                value: addItem.utilidad,
                                label: `${((addItem.utilidad - 1) * 100).toFixed(0)}%`,
                            }}
                            onChange={(selectedOption) => handleSelectChange('utilidad', selectedOption)}
                        />
                        {errorMessages.utilidad && (
                            <span className="text-red-600 text-sm">{errorMessages.utilidad}</span>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Costo
                        </label>
                        <input
                            type="text"
                            value={addItem.costo}
                            onChange={(e) => handleInputChange('costo', e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 uppercase"
                        />
                        {errorMessages.costo && (
                            <span className="text-red-600 text-sm">{errorMessages.costo}</span>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Precio
                        </label>
                        <input
                            type="text"
                            value={addItem.precio}
                            onChange={(e) => handleInputChange('precio', e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 uppercase"
                        />
                        {errorMessages.precio && (
                            <span className="text-red-600 text-sm">{errorMessages.precio}</span>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </form>
    );

}
