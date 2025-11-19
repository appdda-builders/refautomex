import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { buildApiUrl } from '@/app/lib/refautomex-api';
import FindProducts from '../sales/find-products';
import TableCapture from './table-capture';
import { MdDiscount } from "react-icons/md";
import { CiInboxOut } from "react-icons/ci";
import { FaFileCircleCheck } from "react-icons/fa6";
import { IoMdCloseCircle } from "react-icons/io";
import { IoBagRemove } from "react-icons/io5";
import { GoAlertFill } from "react-icons/go";

export default function NewCapture({ onCancelEdit }) {
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
    const tableRef = useRef();
    const today = new Date().toISOString().split('T')[0];
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [brandOptions, setBrandOptions] = useState([]);
    const [providerOptions, setProviderOptions] = useState([]);
    const [quantityOptions, setQuantityOptions] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorMessages, setErrorMessages] = useState({});
    const [discount, setDiscount] = useState(0);
    const [subtotal, setSubtotal] = useState(0);
    const [sugestedDiscount, setSugestedDiscount] = useState(0.0);
    const [generalDiscount, setGeneralDiscount] = useState(0.0);
    const [discountRequest, setDiscountRequest] = useState({
        value: 0.0,
        productRef: null
    });

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

    const handleProviderChange = (selectedOption) => {
        setSelectedProvider(selectedOption);
        handleSelectChange('Proveedor', selectedOption);
    };

    // Actualiza la función applyDiscount
    const applyDiscount = (discountValue, productRef = null) => {
        if (items.length === 0) {
            alert('No hay registros para aplicar el descuento');
            return;
        }
        const numericDiscount = Number(discountValue);
        if (isNaN(numericDiscount) || numericDiscount < 0 || numericDiscount > 1) {
            alert('El descuento debe ser un valor decimal entre 0.0 y 1.0');
            return;
        }
        if (productRef) {
            // Descuento específico
            tableRef.current?.handleDiscountRow(productRef, numericDiscount);
        } else {
            // Descuento general
            tableRef.current?.handleDiscountRow(null, numericDiscount, true);
        }
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

    const onSubmit = (e) => {
        e.preventDefault();
        setErrorMessages({});
        setSuccessMessage('');
        setErrorMessage('');

        if (!validateSubmit()) {
            setErrorMessage('Por favor, corrige los campos marcados como inválidos.');
            return;
        }

        if (!addItem['Factura'] || !selectedProvider || !addItem['Fecha compra']) {
            const newErrors = {};
            if (!addItem['Factura']) newErrors.factura = 'El número de factura es obligatorio.';
            if (!selectedProvider) newErrors.provider = 'El proveedor es obligatorio.';
            if (!addItem['Fecha compra']) newErrors.compra = 'La fecha de compra es obligatoria.';
            setErrorMessages(newErrors);
            setErrorMessage('Por favor, completa todos los campos obligatorios.');
            return;
        }
        // TODO: integrar envío a la API cuando se defina el endpoint correcto.
    };

    useEffect(() => {
        const fetchBrandOptions = async () => {
            try {
                const response = await fetch(buildApiUrl('/getBrands'), {
                    cache: 'no-store',
                    headers: { Accept: 'application/json, text/plain, */*' },
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const payload = await response.json();
                const options = payload.map((brand) => ({
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
                const response = await fetch(buildApiUrl('/getQuantity'), {
                    cache: 'no-store',
                    headers: { Accept: 'application/json, text/plain, */*' },
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const payload = await response.json();
                const options = payload.map((quantity) => ({
                    value: quantity.idCantidad,
                    label: quantity.cantidad,
                }));
                setQuantityOptions(options);
            } catch (error) {
                console.error('Error al obtener cantidades:', error);
            }
        };

        const fetchProviderOptions = async () => {
            try {
                const response = await fetch(buildApiUrl('/getProviders'), {
                    cache: 'no-store',
                    headers: { Accept: 'application/json, text/plain, */*' },
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const payload = await response.json();
                const options = payload
                    .filter(provider => provider.idproveedor > 1)
                    .map(provider => ({
                        value: provider.idproveedor,
                        label: `${provider.idproveedor} | ${provider.empresa}`,
                        sugestion: provider.descuento || 0.0,
                    }));
                setProviderOptions(options);
                setSelectedProvider(null);
                setSugestedDiscount(0.0);
            } catch (error) {
                console.error('Error al obtener proveedores:', error);
            }
        };

        fetchBrandOptions();
        fetchQuantityOptions();
        fetchProviderOptions();
    }, []);

    useEffect(() => {
        if (selectedProvider) {
            // Buscar el proveedor en las opciones disponibles
            const provider = providerOptions.find(
                p => p.value === selectedProvider.value
            );
            // Actualizar el descuento sugerido (0.0 si es null/undefined)
            setSugestedDiscount(provider?.sugestion || 0.0);
        } else {
            setSugestedDiscount(0.0);
        }
    }, [selectedProvider, providerOptions]);

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [showModal]);


    const handleAddProduct = (product) => {
        setItems(prevItems => {
            const exists = prevItems.some(item => item.refaccion === product.refaccion);
            const updatedItems = exists
                ? prevItems.filter(item => item.refaccion !== product.refaccion)
                : [...prevItems, {
                    ...product,
                    monto: Math.ceil(product.precio * product.cantidad),
                    precioInicial: product.precio  // Guardamos el precio original
                }];
            updateTotals(updatedItems, discount);
            return updatedItems;
        });
    };

    const updateTotals = (items, discount) => {
        const newSubtotal = items.reduce((acc, item) => acc + item.monto, 0);
        setSubtotal(newSubtotal);
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

    const confirmCancel = () => {
        setShowModal(true);
    }

    const handleCancel = () => {
        setShowModal(false);
    }

    return (
        <form onSubmit={onSubmit} method="POST">
            <div className="2xl:px-20 py-10 px-3">
                <div className="mb-6 flex justify-end gap-4">
                </div>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="order-2 lg:order-1 w-full bg-[rgb(var(--color-card))] shadow rounded-md p-3 flex flex-col justify-center items-center">
                        <h2 className="text-2xl/7 p-2 font-bold text-[rgb(var(--color-text))] sm:truncate sm:text-3xl sm:tracking-tight mb-1 border-b-2 border-slate-300 w-full">
                            Aplicar Descuento
                        </h2>
                        <div className="mt-1 flex flex-col justify-between sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                            <div className='flex items-center my-1'>
                                <div className="mt-2 flex items-center text-sm text-[rgb(var(--color-text))] opacity-80">
                                    <MdDiscount aria-hidden="true" className="mr-1.5 size-5 shrink-0 text-[rgb(var(--color-text))]" />
                                    DESCUENTO SUGERIDO: {sugestedDiscount === 0 || !sugestedDiscount ? "0.0" : sugestedDiscount}
                                    {sugestedDiscount > 0 && (
                                        <button
                                            type="button"
                                            className="mx-2 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
                                            onClick={() => applyDiscount(sugestedDiscount)}
                                        >
                                            <CiInboxOut aria-hidden="true" className="mr-1.5 -ml-0.5 size-5 text-gray-800" />
                                            APLICAR
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className='flex items-center my-1'>
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <MdDiscount aria-hidden="true" className="mr-1.5 size-5 shrink-0 text-[rgb(var(--color-text))]" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="1"
                                        placeholder='Descuento General (0.0-1.0)'
                                        value={generalDiscount}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value);
                                            setGeneralDiscount(isNaN(value) ? '' : Math.min(1, Math.max(0, value)));
                                        }}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 uppercase"
                                    />
                                    <button
                                        type="button"
                                        className="mx-2 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
                                        onClick={() => applyDiscount(generalDiscount)}
                                    >
                                        <CiInboxOut aria-hidden="true" className="mr-1.5 -ml-0.5 size-5 text-gray-800" />
                                        APLICAR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mb-5 md:mt-5 flex lg:mt-0 lg:ml-4 order-1 lg:order-2">
                        <span className="ml-3 block mx-1">
                            <button
                                onClick={confirmCancel}
                                type="button"
                                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
                            >
                                <IoBagRemove aria-hidden="true" className="mr-1.5 -ml-0.5 size-5 text-gray-400" />
                                CANCELAR
                            </button>
                        </span>
                        <span className="sm:ml-3 mx-1">
                            <button
                                type="submit"
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                <FaFileCircleCheck aria-hidden="true" className="mr-1.5 -ml-0.5 size-5" />
                                CAPTURAR
                            </button>
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3 my-3">
                    <div className="">
                        <label className="block text-sm 2xl:text-lg font-medium text-[rgb(var(--color-text))]">
                            Num Factura
                        </label>
                        <input
                            type="text"
                            placeholder='ID de factura'
                            onChange={(e) => handleInputChange('Factura', e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 uppercase"
                        />
                        {errorMessages.provider && (
                            <span className="text-red-600 text-sm">{errorMessages.provider}</span>
                        )}
                    </div>

                    <div className="">
                        <label className="block text-sm 2xl:text-lg font-medium text-[rgb(var(--color-text))]">
                            Proveedor
                        </label>
                        <Select
                            options={providerOptions}
                            onChange={handleProviderChange}
                            value={selectedProvider}
                            placeholder="Selecciona un proveedor"
                        />
                        {errorMessages.provider && (
                            <span className="text-red-600 text-sm">{errorMessages.provider}</span>
                        )}
                    </div>

                    <div className="">
                        <label className="block text-sm 2xl:text-lg font-medium text-[rgb(var(--color-text))]">
                            Fecha Compra
                            {/* LA FECHA PAGO ES EL RESULTADO SE SUMAR LOS DIAS DE LA BASE DE DATOS A LA FECHA DE LA COMPRA,
                            SI LA FECHA DE LA COMPRA NO TIENE DIAS DE PLAZO ENTONCES FECHA_CAPTURA = FECHA_PAGO */}
                        </label>
                        <input
                            type="date"
                            defaultValue={today}
                            onChange={(e) => handleInputChange('Fecha compra', e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 uppercase"
                        />
                        {errorMessages.compra && (
                            <span className="text-red-600 text-sm">{errorMessages.compra}</span>
                        )}
                    </div>
                </div>
                <div className="mx-auto max-w-[1700px] lg:px-5 mt-5 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 mx-auto gap-x-3 lg:gap-x-14 gap-y-6 lg:mx-0 px-5 xl:px-0">
                        <div className= 'lg:rounded-2xl my-5 pt-2 shadow w-auto overflow-hidden rounded-xl md:-mx-3 lg:-mx-9 xl:-mx-2'>
                            <FindProducts
                                onAddProduct={handleAddProduct}
                                onRemoveProduct={handleRemoveProduct}
                                addedItems={items}
                                isCapture={true}
                            />
                        </div>
                        <div className='grid-cols-1 lg:col-span-2 w-auto'>
                            <TableCapture
                                ref={tableRef}
                                items={items}
                                setItems={setItems}
                                onRemoveProduct={handleRemoveProduct}
                                onUpdateProduct={handleUpdateProduct}
                                discountRequest={discountRequest}
                                onDiscountApplied={() => setDiscountRequest({ value: 0.0, productRef: null })}
                            />
                        </div>
                    </div>
                    {showModal && (
                    <div className="fixed z-40 inset-0 overflow-y-auto bg-stone-700 opacity-80">
                        <div className="flex items-center justify-center min-h-screen">
                            <div className='relative max-w-7xl sm:px-10 lg:px-20 bg-gradient-to-bl from-[rgb(var(--color-card))] via-[rgb(var(--color-card-white))] to-[rgb(var(--color-gray))] p-3 sm:rounded-xl shadow-xl py-12'>
                                <div className='absolute -top-5 right-1/2 translate-x-1/2 shadow bg-[rgb(var(--color-card))] rounded-full p-3 cursor-pointer animate-out'>
                                    <GoAlertFill className='h-9 w-9 text-amber-500 hover:opacity-80'/>
                                </div>
                                <button onClick={handleCancel} className="absolute top-2 right-2 text-red-500 text-xl z-10">
                                    <IoMdCloseCircle className='h-7 w-7 animate-out' />
                                </button>
                                <div className="relative overflow-y-auto h-[140px]">
                                    <div className="flex flex-col items-center justify-center">
                                        <h2 className="text-2xl/7 p-2 font-bold text-[rgb(var(--color-text))] sm:truncate sm:text-3xl sm:tracking-tight mb-1 border-b-2 border-slate-300 w-full">
                                            ¿Está seguro de cancelar la captura?
                                        </h2>
                                        <p className="text-[rgb(var(--color-text))] opacity-80">Si cancela la captura, perderán todos los cambios realizados.</p>
                                    </div>
                                    <div className="flex justify-center px-6 lg:px-8 mt-0.5 sm:mt-3">
                                        <a href='/productivity?load=capture'
                                            type="button"
                                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
                                        >
                                            <IoBagRemove aria-hidden="true" className="mr-1.5 -ml-0.5 size-5 text-gray-400" />
                                            QUIERO CANCELAR
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </form>
    );

}
