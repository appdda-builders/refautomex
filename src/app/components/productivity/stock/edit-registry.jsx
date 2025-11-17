import { MdDelete, MdAddPhotoAlternate } from 'react-icons/md';
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
import { buildApiUrl } from '@/app/lib/refautomex-api';

export default function EditRegistry({ prodOverview, onCancelEdit, setProdOverview }) {
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const [isSuccessfull, setIsSuccessfull] = useState(false);
    const [brandOptions, setBrandOptions] = useState([]);
    const [QuantityOptions, setQuantityOptions] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorMessages, setErrorMessages] = useState({
        num_parte: '',
        sucursal: '',
        localizacion: '',
        descripcion: '',
        existencia: '',
        costo: '',
        precio: '',
        utilidad: '',
        mod_ini: '',
        mod_fin: '',
        idmarca: ''
    });

    const defaultProdOverview = {
        rutas: ['productos/no-img.png'],
    };

    const currentProduct = prodOverview || defaultProdOverview;
    const rutasArray = currentProduct.rutas && currentProduct.rutas.length > 0 ? currentProduct.rutas : ['productos/no-img.png'];
    const [selectedImage, setSelectedImage] = useState(`${multimediaSrc}productos/no-img.png`);

    const handleBrandChange = (selectedOption) => {
        setProdOverview(prevState => ({ ...prevState, idmarca: selectedOption.value }));
    };

    const handleQuantityChange = (selectedOption) => {
        setProdOverview(prevState => ({ ...prevState, existencia: selectedOption.value }));
    };

    const handleUtilityChange = (selectedOption) => {
        setProdOverview(prevState => ({ ...prevState, utilidad: selectedOption.value }));
    };

    const handleCostChange = (e) => {
        const cost = e.target.value;
        const price = Math.round(cost * currentProduct.utilidad);
        setProdOverview(prevState => ({ ...prevState, precio: price }));
        setProdOverview(prevState => ({ ...prevState, costo : cost }));
    };

    const validateSubmit = async () => {
        const regexPatterns = {
            num_parte: /^[A-Z0-9-]+$/,
            localizacion: /^[0-9]{2}[A-Z]{1}[0-9A-Z]{2}[-0-9]{2,3}$/,
            descripcion: /^\s*\S+.*$/,
            mod_ini: /^[0-9]{1,4}$/,
            mod_fin: /^[0-9]{1,4}$/,
            existencia: /^[0-9]+$/,
            precio: /^[0-9]+(\.[0-9]+)?$/,
            costo: /^[0-9]+(\.[0-9]+)?$/,
        };
        let isValid = true;
        let newErrorMessages = {};
        // Validar campos locales con regex
        for (const [key, value] of Object.entries(prodOverview)) {
            if (key === 'costo') {
                if (value == null || value === '' || isNaN(value) || Number(value) <= 0) {
                    isValid = false;
                    newErrorMessages[key] = 'Costo no puede ser 0, nulo o inválido.';
                    continue;
                }
            }
            if (regexPatterns[key] && !regexPatterns[key].test(value)) {
                isValid = false;
                newErrorMessages[key] = `${key} - inválido.`;
            } else {
                newErrorMessages[key] = '';
            }
        }
        // Validar la localización en el servidor
        try {
            const params = {
                localizacion: prodOverview.localizacion,
                idsucursal: currentProduct.idsucursal,
                num_parte: prodOverview.refaccion
            };
            // Llamada al backend
            const response = await axios.get(buildApiUrl('/dataManage'), {
                params: {
                    type: 'verifyLocation', // Tipo de operación
                    params: JSON.stringify(params), // Convertir a JSON
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            // Verificar respuesta del servidor
            if (response.data.exists) {
                newErrorMessages.localizacion = response.data.message; // Mensaje dinámico del servidor
                isValid = false;
            }
        } catch (error) {
            console.error('Error verificando localización:', error);
            newErrorMessages.localizacion = 'Error al verificar la localización.';
            isValid = false;
        }
        return { isValid, newErrorMessages };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessages({});
        setSuccessMessage('');
        setErrorMessage('');

        const validation = await validateSubmit();
        if (!validation.isValid) {
            setErrorMessages(validation.newErrorMessages);
            setErrorMessage('Por favor, corrige los campos marcados como inválidos.');
            return;
        }

        // Preparar datos para actualizar
        const update_data = {
            refaccion: currentProduct.refaccion,
            sucursal: currentProduct.sucursal,
            localizacion: prodOverview.localizacion,
            descripcion: prodOverview.descripcion,
            existencia: prodOverview.existencia,
            costo: parseFloat(prodOverview.costo).toFixed(2),
            precio: parseFloat(prodOverview.precio).toFixed(2),
            utilidad: prodOverview.utilidad,
            mod_ini: prodOverview.mod_ini,
            mod_fin: prodOverview.mod_fin,
            idmarca: prodOverview.idmarca,
            idsucursal: currentProduct.idsucursal,
        };

        // Intentar enviar la actualización
        try {
            const response = await axios.patch(`/api/dataManage?type=patchProduct`, update_data, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('Respuesta del servidor:', response.data);
            setSuccessMessage('Registro actualizado exitosamente.');
            setErrorMessages({});
        } catch (error) {
            setErrorMessage('Hubo un error al guardar los datos. Intenta de nuevo.');
            console.error('Error submitting the form:', error);
        }
    };

    useEffect(() => {
        if (!currentProduct.rutas || currentProduct.rutas.length === 0 || !currentProduct.rutas[0]) {
            setSelectedImage(`${multimediaSrc}productos/no-img.png`);
        } else {
            setSelectedImage(`${multimediaSrc}${rutasArray[0]}`);
        }

        const fetchBrand = async () => {
            try {
                const response = await axios.get(buildApiUrl('/getBrands'));
                const formattedBrandOptions = response.data.map(marca => ({
                    value: marca.idmarca,
                    label: marca.marca
                }));
                setBrandOptions(formattedBrandOptions);
            } catch (error) {
                console.error('Error fetching Brands:', error);
            }
        };

        const fetchQuantity = async () => {
            try {
                const response = await axios.get(buildApiUrl('/getQuantity'));
                const formattedQuantityOptions = response.data.map(cantidad => ({
                    value: cantidad.idCantidad,
                    label: cantidad.cantidad
                }));
                setQuantityOptions(formattedQuantityOptions);
            } catch (error) {
                console.error('Error fetching Quantity:', error);
            }
        };

        fetchBrand();
        fetchQuantity();
    }, [prodOverview]);

    return (
        <form onSubmit={handleSubmit}>
            <div className="md:px-20 py-10">
                <div className="flex flex-col xl:flex-row">
                    <div className="flex-1 flex flex-col xl:flex-row items-center my-auto">
                        <div className="overflow-hidden rounded-3xl shadow-xl bg-gray-200 h-[250px] w-[250px] sm:h-[350px] sm:w-[350px] xl:w-[400px] xl:h-[400px]">
                            <img
                                src={selectedImage}
                                alt="Selected product"
                                className="h-full w-full object-cover object-center"
                            />
                        </div>
                        <div className="flex flex-row xl:flex-col justify-center items-center xl:m-10 m-2">
                            <div
                                className='flex justify-center items-center my-2 opacity-80 hover:opacity-100 w-16 h-16 object-cover cursor-pointer rounded-xl mr-2 dark:bg-stone-950 bg-stone-300 border-stone-500 border border-dashed hover:animate-out'
                                onClick={() => setSelectedImage(`${multimediaSrc}productos/no-img.png`)}
                            >
                                <MdAddPhotoAlternate className='h-10 w-10' />
                            </div>
                            {rutasArray.map((ruta, index) => {
                                const imagePath = ruta ? `${multimediaSrc}${ruta}` : `${multimediaSrc}productos/no-img.png`;
                                return (
                                    <div key={index} className='relative'>
                                        <img
                                            src={imagePath}
                                            alt={`product ${index + 1}`}
                                            className={`w-16 h-16 object-cover cursor-pointer my-2 rounded-xl mr-2 ${selectedImage === imagePath ? 'border-2 border-amber-400 dark:border-yellow-300' : 'border border-stone-300'}`}
                                            onClick={() => setSelectedImage(imagePath)}
                                        />
                                        <MdDelete className='absolute top-0 right-0 bg-red-100 text-red-600 rounded-full border border-gray-400' />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex-1 px-2 2xl:px-20 my-auto">
                        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="sm:col-span-2">
                                <label htmlFor="first-name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                                    Refacción
                                </label>
                                <div className="mt-2 bg-slate-200 dark:bg-stone-700 dark:text-white animate-up rounded-md p-1 shadow">
                                    {currentProduct.refaccion}
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="first-name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                                    Sucursal
                                </label>
                                <div className="mt-2 bg-slate-200 dark:bg-stone-700 dark:text-white animate-up rounded-md p-1 shadow">
                                    {currentProduct.sucursal}
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="location" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                                    Localizaci&oacute;n
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="location"
                                        name="location"
                                        type="text"
                                        autoComplete="location"
                                        value={currentProduct.localizacion}
                                        className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 uppercase`}
                                        onChange={(e) => setProdOverview(prevState => ({ ...prevState, localizacion: e.target.value }))}
                                    />
                                    {errorMessages.localizacion && (
                                        <span className="text-red-600 dark:text-red-400 text-sm">
                                            {errorMessages.localizacion}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-full">
                                <label htmlFor="descripcion" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                                    Descripci&oacute;n
                                </label>
                                <div className="mt-2">
                                    <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    type="text"
                                    autoComplete="descripcions"
                                    value={currentProduct.descripcion}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 uppercase"
                                    onChange={(e) => setProdOverview(prevState => ({ ...prevState, descripcion: e.target.value }))}
                                    />
                                    {errorMessages.descripcion && (
                                        <span className="text-red-600 dark:text-red-400 text-sm">
                                            {errorMessages.descripcion}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                                    Existencia
                                </label>
                                <div className="mt-2">
                                    <Select
                                        id="existencia"
                                        name="existencia"
                                        value={QuantityOptions.find(option => option.value === prodOverview?.existencia)}
                                        onChange={handleQuantityChange}
                                        options={QuantityOptions}
                                        isDisabled={isSuccessfull}
                                        classNamePrefix="react-select"
                                    />
                                    {errorMessages.existencia && (
                                        <span className="text-red-600 dark:text-red-400 text-sm">
                                            {errorMessages.existencia}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                                    Modelo
                                </label>
                                <div className="mt-2 flex items-center justify-center">
                                    <Select
                                        id='mod_ini'
                                        name='mod_ini'
                                        className='w-full'
                                        options={Array.from({ length: 36 }, (_, i) => {
                                            const year = 1990 + i;
                                            return { value: year, label: `${year}` };
                                        })}
                                        value={{ value: currentProduct.mod_ini, label: currentProduct.mod_ini }}
                                        onChange={(selectedOption) => {
                                            setProdOverview(prevState => ({ ...prevState, mod_ini: selectedOption.value }));
                                        }}
                                    />
                                    <span className='mx-2 md:mx-0.5 xl:mx-2'>-</span>
                                    <Select
                                        id='mod_fin'
                                        name='mod_fin'
                                        className='w-full'
                                        options={Array.from({ length: 36 }, (_, i) => {
                                            const year = 1990 + i;
                                            return { value: year, label: `${year}` };
                                        })}
                                        value={{ value: currentProduct.mod_fin, label: currentProduct.mod_fin }}
                                        onChange={(selectedOption) => {
                                            setProdOverview(prevState => ({ ...prevState, mod_fin: selectedOption.value }));
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                                    Marca de auto
                                </label>
                                <div className="mt-2">
                                    <Select
                                        id="marca"
                                        name="marca"
                                        value={brandOptions.find(option => option.value === prodOverview?.idmarca)}
                                        onChange={handleBrandChange}
                                        options={brandOptions}
                                        isDisabled={isSuccessfull}
                                        classNamePrefix="react-select"
                                    />
                                    {errorMessages.idmarca && (
                                        <span className="text-red-600 dark:text-red-400 text-sm">
                                            {errorMessages.idmarca}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                                    Utilidad
                                </label>
                                <div className="mt-2">
                                    <Select
                                        options={[
                                            { value: 1.25, label: '25%' },
                                            { value: 1.3, label: '30%' },
                                            { value: 1.35, label: '35%' },
                                        ]}
                                        value={{ value: currentProduct.utilidad, label: `${((currentProduct.utilidad - 1) * 100).toFixed(0) }%` }}
                                        onChange={handleUtilityChange}
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="costo" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                                    Costo de proveedor
                                </label>
                                <div className="mt-2">
                                    <input
                                    id="costo"
                                    name="costo"
                                    type="text"
                                    autoComplete="costo"
                                    value={currentProduct.costo}
                                    onChange={handleCostChange}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                    {errorMessages.costo && (
                                        <span className="text-red-600 dark:text-red-400 text-sm">
                                            {errorMessages.costo}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                                    Precio Público Mínimo
                                </label>
                                <div className="mt-2 bg-slate-200 dark:bg-stone-700 dark:text-white animate-up rounded-md p-1 shadow">
                                    {currentProduct.precio}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    {successMessage && <div className="text-green-600 dark:text-green-400">{successMessage}</div>}
                    {errorMessages && (
                        <div className="text-red-600 dark:text-red-400">
                            {errorMessages.num_parte}
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-center items-center mt-3 max-w-7xl">
                    <div className="grid grid-cols-2 mt-6 items-center justify-end gap-x-6">
                        <button
                        onClick={onCancelEdit}
                        type="button"
                        className="bg-gradient-to-bl hover:bg-gradient-to-tr bg-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out dark:text-slate-300">
                        Regresar
                        </button>
                        <button
                        type="submit"
                        className={isSuccessfull ? 'bg-gradient-to-bl hover:bg-gradient-to-tr bg-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out cursor-not-allowed' : 'bg-gradient-to-bl hover:bg-gradient-to-tr from-amber-500 via-yellow-400 to-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer'}
                        disabled={isSuccessfull}
                        >
                        Guardar
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}
