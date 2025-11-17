import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
import { buildApiUrl } from '@/app/lib/refautomex-api';
import FindProducts from '../sales/find-products';
import TableCapture from './table-capture';

export default function EditCapture({ onCancelEdit }) {
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
    const [items, setItems] = useState([]);
    const [brandOptions, setBrandOptions] = useState([]);
    const [sucursalOptions, setSucursalOptions] = useState([]);
    const [quantityOptions, setQuantityOptions] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorMessages, setErrorMessages] = useState({});
    const [discount, setDiscount] = useState(0);
    const [subtotal, setSubtotal] = useState(0);
    const [total, setTotal] = useState(0);

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

    const handleAddProduct = (product) => {
        setItems(prevItems => {
            const exists = prevItems.some(item => item.refaccion === product.refaccion);
            const updatedItems = exists
                ? prevItems.filter(item => item.refaccion !== product.refaccion)
                : [...prevItems, { ...product, monto: Math.ceil(product.precio * product.cantidad) }];
            updateTotals(updatedItems, discount);
            return updatedItems;
        });
    };

    const updateTotals = (items, discount) => {
        const newSubtotal = items.reduce((acc, item) => acc + item.monto, 0);
        setSubtotal(newSubtotal);
        const discountAmount = newSubtotal * discount / 100;
        const newTotal = newSubtotal - discountAmount;
        setTotal(newTotal);
    };


    const handleRemoveProduct = (refaccion) => {
        setItems(prevItems => {
            const updatedItems = prevItems.filter(item => item.refaccion !== refaccion);
            updateTotals(updatedItems, discount);
            return updatedItems;
        });
    };

    const handleUpdateProduct = (updatedItems) => {
        setItems(prevItems => {
            if (JSON.stringify(prevItems) !== JSON.stringify(updatedItems)) {
                updateTotals(updatedItems, discount);
                return updatedItems;
            }
            return prevItems;
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="md:px-20 py-10 px-3">
                <div className="mb-6 flex justify-end gap-4">
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
                        Capturar
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-8">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-900 dark:text-white">
                            Num Factura
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

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-900 dark:text-white">
                            Proveedor
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

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-900 dark:text-white">
                            Fecha Compra
                            {/* LA FECHA PAGO ES EL RESULTADO SE SUMAR LOS DIAS DE LA BASE DE DATOS A LA FECHA DE LA COMPRA,
                            SI LA FECHA DE LA COMPRA NO TIENE DIAS DE PLAZO ENTONCES FECHA_CAPTURA = FECHA_PAGO */}
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

                    <div className="md:col-span-2 relative">
                        <label className="block text-sm font-medium text-gray-900 dark:text-white">
                            % General
                        </label>
                        <input
                            type="text"
                            value={addItem.localizacion}
                            onChange={(e) => handleInputChange('localizacion', e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 uppercase"
                            />
                        {errorMessages.descripcion && (
                            <span className="text-red-600 text-sm">{errorMessages.descripcion}</span>
                        )}
                        <button className='bg-gradient-to-bl hover:bg-gradient-to-tr from-amber-500 via-yellow-400 to-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer absolute right-0 -bottom-7 py-0'>Aplicar</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 mx-auto gap-x-10 gap-y-6 lg:mx-0 px-10 xl:px-0 pt-5">
                    <div className="bg-gray-200 dark:bg-stone-700 lg:rounded-2xl my-5 py-2 shadow w-auto overflow-hidden rounded-xl md:-mx-8 xl:-mx-4">
                        <FindProducts
                            onAddProduct={handleAddProduct}
                            onRemoveProduct={handleRemoveProduct}
                            addedItems={items}
                            isWarehouse={true}
                        />
                    </div>
                    <div className='grid-cols-1 lg:col-span-2 w-auto'>
                        <TableCapture
                            items={items}
                            onRemoveProduct={handleRemoveProduct}
                            onUpdateProduct={handleUpdateProduct}
                        />
                    </div>
                </div>
            </div>
        </form>
    );

}
