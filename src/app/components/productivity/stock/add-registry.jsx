import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { buildApiUrl } from '@/app/lib/refautomex-api';
import { MdAddCircle, MdAssignmentAdd } from 'react-icons/md';

const parseRoutes = (raw) => {
    if (!raw) return [];
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
        return [];
    }
};

export default function AddRegistry({ onCancelEdit }) {
    const [productForm, setProductForm] = useState({
        refaccion: '',
        descripcion: '',
        mod_ini: '1990',
        mod_fin: '1990',
        idgrupo: '',
        idmarca: '',
    });
    const [detailForm, setDetailForm] = useState({
        idsucursal: '',
        localizacion: '',
        existencia: '',
        costo: '',
        precio: '',
        utilidad: '1.3',
    });
    const [groupOptions, setGroupOptions] = useState([]);
    const [brandOptions, setBrandOptions] = useState([]);
    const [sucursalOptions, setSucursalOptions] = useState([]);
    const [quantityOptions, setQuantityOptions] = useState([]);
    const [pendingProducts, setPendingProducts] = useState([]);
    const [pendingLoading, setPendingLoading] = useState(false);
    const [selectedPendingPart, setSelectedPendingPart] = useState(null);
    const [activeStep, setActiveStep] = useState('product');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorMessages, setErrorMessages] = useState({});

    const selectedPendingProduct = pendingProducts.find(
        (product) => product.num_parte === selectedPendingPart
    );

    const handleProductInputChange = (field, value) => {
        setProductForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleDetailInputChange = (field, value) => {
        setDetailForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const validateProductForm = () => {
        const patterns = {
            refaccion: /^[A-Z0-9-]+$/,
            descripcion: /^\s*\S+.*$/,
            mod_ini: /^[0-9]{1,4}$/,
            mod_fin: /^[0-9]{1,4}$/,
        };
        const newErrors = {};
        let valid = true;

        Object.entries(patterns).forEach(([field, regex]) => {
            if (!regex.test(productForm[field] || '')) {
                valid = false;
                newErrors[field] = `${field} es inválido.`;
            }
        });

        if (!productForm.idgrupo) {
            valid = false;
            newErrors.idgrupo = 'Selecciona un grupo.';
        }

        if (!productForm.idmarca) {
            valid = false;
            newErrors.idmarca = 'Selecciona una marca.';
        }

        setErrorMessages(newErrors);
        return valid;
    };

    const validateDetailForm = () => {
        const patterns = {
            localizacion: /^[0-9]{2}[A-Z]{1}[0-9A-Z]{2}[-0-9]{2,3}$/,
            existencia: /^[0-9]+$/,
            precio: /^[0-9]+(\.[0-9]+)?$/,
            costo: /^[0-9]+(\.[0-9]+)?$/,
            utilidad: /^[0-9]+(\.[0-9]+)?$/,
        };

        const newErrors = {};
        let valid = true;

        if (!selectedPendingProduct) {
            valid = false;
            newErrors.selectedProduct = 'Selecciona un producto pendiente.';
        }

        if (!detailForm.idsucursal) {
            valid = false;
            newErrors.idsucursal = 'Selecciona una sucursal.';
        }

        Object.entries(patterns).forEach(([field, regex]) => {
            if (!regex.test(detailForm[field] || '')) {
                valid = false;
                newErrors[field] = `${field} es inválido.`;
            }
        });

        setErrorMessages(newErrors);
        return valid;
    };

    const handleProductSubmit = async (event) => {
        event.preventDefault();
        setErrorMessages({});
        setSuccessMessage('');
        setErrorMessage('');

        if (!validateProductForm()) {
            setErrorMessage('Por favor, corrige los campos marcados como inválidos.');
            return;
        }

        const payload = {
            ...productForm,
            idsucursal: null,
            localizacion: null,
            existencia: null,
            costo: null,
            precio: null,
            utilidad: null,
            rutas: [],
            status: 'E',
        };

        try {
            const response = await fetch(buildApiUrl('/newProduct'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Error al guardar el registro');
            }

            setSuccessMessage('Producto registrado como existente.');
            setProductForm({
                refaccion: '',
                descripcion: '',
                mod_ini: '1990',
                mod_fin: '1990',
                idgrupo: '',
                idmarca: '',
            });
            fetchPendingProducts();
        } catch (error) {
            console.error('Error al guardar registro:', error);
            setErrorMessage('Hubo un error al guardar los datos. Intenta de nuevo.');
        }
    };

    const handleDetailSubmit = async (event) => {
        event.preventDefault();
        setErrorMessages({});
        setSuccessMessage('');
        setErrorMessage('');

        if (!validateDetailForm()) {
            setErrorMessage('Por favor, corrige los campos marcados como inválidos.');
            return;
        }

        const payload = {
            refaccion: selectedPendingProduct.num_parte,
            idsucursal: detailForm.idsucursal,
            localizacion: detailForm.localizacion,
            descripcion: selectedPendingProduct.descripcion,
            existencia: detailForm.existencia,
            costo: detailForm.costo,
            precio: detailForm.precio,
            utilidad: detailForm.utilidad,
            mod_ini: selectedPendingProduct.mod_ini,
            mod_fin: selectedPendingProduct.mod_fin,
            idmarca: selectedPendingProduct.idmarca,
            idgrupo: selectedPendingProduct.idgrupo,
            rutas: selectedPendingProduct.rutas || [],
            status: 'A',
        };

        try {
            const response = await fetch(buildApiUrl('/newProduct'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Error al asignar el detalle');
            }

            setSuccessMessage('Detalle asignado correctamente.');
            setDetailForm({
                idsucursal: '',
                localizacion: '',
                existencia: '',
                costo: '',
                precio: '',
                utilidad: '1.3',
            });
            setSelectedPendingPart(null);
            fetchPendingProducts();
        } catch (error) {
            console.error('Error al asignar detalle:', error);
            setErrorMessage('Hubo un error al asignar el detalle. Intenta de nuevo.');
        }
    };

    const fetchPendingProducts = async () => {
        setPendingLoading(true);
        try {
            const response = await fetch(buildApiUrl('/getAllProducts'), {
                cache: 'no-store',
                headers: { Accept: 'application/json, text/plain, */*' },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const formatted = (data?.[0] || [])
                .filter((product) => product.status === 'E')
                .map((product) => ({
                    ...product,
                    rutas: parseRoutes(product.rutas),
                }));
            setPendingProducts(formatted);
        } catch (error) {
            console.error('Error al obtener productos pendientes:', error);
        } finally {
            setPendingLoading(false);
        }
    };

    useEffect(() => {
        const fetchGroupOptions = async () => {
            try {
                const response = await fetch(buildApiUrl('/getGroups'), {
                    cache: 'no-store',
                    headers: { Accept: 'application/json, text/plain, */*' },
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const payload = await response.json();
                const options = payload.map(group => ({
                    value: group.idgrupo,
                    label: group.grupo,
                }));
                setGroupOptions(options);
            } catch (error) {
                console.error('Error al obtener grupos:', error);
            }
        };

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

        const fetchSucursalOptions = async () => {
            try {
                const response = await fetch(buildApiUrl('/getSucursal'), {
                    cache: 'no-store',
                    headers: { Accept: 'application/json, text/plain, */*' },
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const payload = await response.json();
                const options = payload.map((sucursal) => ({
                    value: sucursal.idsucursal,
                    label: sucursal.sucursal,
                }));
                setSucursalOptions(options);
            } catch (error) {
                console.error('Error al obtener sucursales:', error);
            }
        };

        fetchGroupOptions();
        fetchBrandOptions();
        fetchQuantityOptions();
        fetchSucursalOptions();
        fetchPendingProducts();
    }, []);

    const detailProductOptions = pendingProducts.map((product) => ({
        value: product.num_parte,
        label: `${product.num_parte} - ${product.descripcion}`,
    }));

    const renderProductForm = () => (
        <form onSubmit={handleProductSubmit}>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Refacción
                    </label>
                    <input
                        type="text"
                        value={productForm.refaccion}
                        onChange={(e) => handleProductInputChange('refaccion', e.target.value)}
                        className="block w-full rounded-xl border-0 py-2 px-3 text-[rgb(var(--color-text))] bg-[rgb(var(--color-card))] shadow focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                    {errorMessages.refaccion && (
                        <span className="text-red-600 text-sm">{errorMessages.refaccion}</span>
                    )}
                </div>

                <div className="col-span-full">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Descripción
                    </label>
                    <textarea
                        value={productForm.descripcion}
                        onChange={(e) => handleProductInputChange('descripcion', e.target.value)}
                        className="block w-full rounded-xl border-0 py-2 px-3 text-[rgb(var(--color-text))] bg-[rgb(var(--color-card))] shadow focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                    {errorMessages.descripcion && (
                        <span className="text-red-600 text-sm">{errorMessages.descripcion}</span>
                    )}
                </div>

                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Grupo
                    </label>
                    <Select
                        options={groupOptions}
                        value={groupOptions.find((option) => option.value === productForm.idgrupo)}
                        onChange={(selectedOption) =>
                            handleProductInputChange('idgrupo', selectedOption ? selectedOption.value : '')
                        }
                        classNamePrefix="react-select"
                    />
                    {errorMessages.idgrupo && (
                        <span className="text-red-600 text-sm">{errorMessages.idgrupo}</span>
                    )}
                </div>

                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Marca de auto
                    </label>
                    <Select
                        options={brandOptions}
                        value={brandOptions.find((option) => option.value === productForm.idmarca)}
                        onChange={(selectedOption) =>
                            handleProductInputChange('idmarca', selectedOption ? selectedOption.value : '')
                        }
                        classNamePrefix="react-select"
                    />
                    {errorMessages.idmarca && (
                        <span className="text-red-600 text-sm">{errorMessages.idmarca}</span>
                    )}
                </div>

                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Modelo inicial
                    </label>
                    <Select
                        options={Array.from({ length: 36 }, (_, i) => {
                            const year = 1990 + i;
                            return { value: year, label: `${year}` };
                        })}
                        value={{ value: productForm.mod_ini, label: productForm.mod_ini }}
                        onChange={(selectedOption) =>
                            handleProductInputChange('mod_ini', selectedOption ? selectedOption.value : '')
                        }
                        classNamePrefix="react-select"
                    />
                    {errorMessages.mod_ini && (
                        <span className="text-red-600 text-sm">{errorMessages.mod_ini}</span>
                    )}
                </div>

                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Modelo final
                    </label>
                    <Select
                        options={Array.from({ length: 36 }, (_, i) => {
                            const year = 1990 + i;
                            return { value: year, label: `${year}` };
                        })}
                        value={{ value: productForm.mod_fin, label: productForm.mod_fin }}
                        onChange={(selectedOption) =>
                            handleProductInputChange('mod_fin', selectedOption ? selectedOption.value : '')
                        }
                        classNamePrefix="react-select"
                    />
                    {errorMessages.mod_fin && (
                        <span className="text-red-600 text-sm">{errorMessages.mod_fin}</span>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
                <button
                    type="button"
                    onClick={onCancelEdit}
                    className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                >
                    Guardar producto
                </button>
            </div>
        </form>
    );

    const renderDetailForm = () => (
        <form onSubmit={handleDetailSubmit}>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Producto pendiente
                    </label>
                    <Select
                        options={detailProductOptions}
                        value={detailProductOptions.find((option) => option.value === selectedPendingPart) || null}
                        onChange={(option) => setSelectedPendingPart(option ? option.value : null)}
                        isLoading={pendingLoading}
                        placeholder="Selecciona un producto"
                        classNamePrefix="react-select"
                    />
                    {errorMessages.selectedProduct && (
                        <span className="text-red-600 text-sm">{errorMessages.selectedProduct}</span>
                    )}
                    {selectedPendingProduct && (
                        <div className="mt-3 p-3 rounded-xl bg-[rgb(var(--color-card))] text-xs text-[rgb(var(--color-text))] shadow-inner">
                            <p><span className="font-semibold">Descripción:</span> {selectedPendingProduct.descripcion}</p>
                            <p><span className="font-semibold">Modelos:</span> {selectedPendingProduct.mod_ini} - {selectedPendingProduct.mod_fin}</p>
                        </div>
                    )}
                </div>

                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Sucursal
                    </label>
                    <Select
                        options={sucursalOptions}
                        value={sucursalOptions.find((option) => option.value === detailForm.idsucursal)}
                        onChange={(selectedOption) =>
                            handleDetailInputChange('idsucursal', selectedOption ? selectedOption.value : '')
                        }
                        classNamePrefix="react-select"
                    />
                    {errorMessages.idsucursal && (
                        <span className="text-red-600 text-sm">{errorMessages.idsucursal}</span>
                    )}
                </div>

                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Localización
                    </label>
                    <input
                        type="text"
                        value={detailForm.localizacion}
                        onChange={(e) => handleDetailInputChange('localizacion', e.target.value)}
                        className="block w-full rounded-xl border-0 py-2 px-3 text-[rgb(var(--color-text))] bg-[rgb(var(--color-card))] shadow focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                    {errorMessages.localizacion && (
                        <span className="text-red-600 text-sm">{errorMessages.localizacion}</span>
                    )}
                </div>

                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Existencia
                    </label>
                    <Select
                        options={quantityOptions}
                        value={quantityOptions.find((option) => option.value === detailForm.existencia)}
                        onChange={(selectedOption) =>
                            handleDetailInputChange('existencia', selectedOption ? selectedOption.value : '')
                        }
                        classNamePrefix="react-select"
                    />
                    {errorMessages.existencia && (
                        <span className="text-red-600 text-sm">{errorMessages.existencia}</span>
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
                            value: detailForm.utilidad,
                            label: `${((detailForm.utilidad - 1) * 100).toFixed(0)}%`,
                        }}
                        onChange={(selectedOption) =>
                            handleDetailInputChange('utilidad', selectedOption ? selectedOption.value : '')
                        }
                        classNamePrefix="react-select"
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
                        value={detailForm.costo}
                        onChange={(e) => handleDetailInputChange('costo', e.target.value)}
                        className="block w-full rounded-xl border-0 py-2 px-3 text-[rgb(var(--color-text))] bg-[rgb(var(--color-card))] shadow focus:ring-2 focus:ring-indigo-500 uppercase"
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
                        value={detailForm.precio}
                        onChange={(e) => handleDetailInputChange('precio', e.target.value)}
                        className="block w-full rounded-xl border-0 py-2 px-3 text-[rgb(var(--color-text))] bg-[rgb(var(--color-card))] shadow focus:ring-2 focus:ring-indigo-500 uppercase"
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
                    className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                >
                    Guardar detalle
                </button>
            </div>
        </form>
    );

    return (
        <div className="flex flex-col space-y-6 max-w-7xl mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-3xl bg-[rgb(var(--color-card))] shadow-lg p-6 border border-[rgb(var(--color-border))]">
                    <p className="text-sm text-[rgb(var(--color-text))] uppercase tracking-widest">
                        Alta de productos
                    </p>
                    <h2 className="text-2xl font-semibold text-[rgb(var(--color-text))] mt-2">
                        Registra y ubica tus refacciones
                    </h2>
                    <p className="text-sm text-[rgb(var(--color-text))]/70 mt-2">
                        Primero da de alta el producto y luego asina su detalle a una sucursal para activarlo.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-4">
                        <button
                            type="button"
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                                activeStep === 'product'
                                    ? 'bg-[rgb(var(--color-galaxy))] text-white shadow-lg'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            onClick={() => setActiveStep('product')}
                        >
                            <MdAddCircle className="text-lg" />
                            Paso 1: Producto
                        </button>
                        <button
                            type="button"
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                                activeStep === 'detail'
                                    ? 'bg-[rgb(var(--color-galaxy))] text-white shadow-lg'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            onClick={() => setActiveStep('detail')}
                        >
                            <MdAssignmentAdd className="text-lg" />
                            Paso 2: Detalle
                        </button>
                    </div>
                </div>

                <div className="relative rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br from-[rgb(var(--color-galaxy))] via-[rgb(var(--color-bg))] to-[rgb(var(--color-card))] text-[rgb(var(--color-text))] p-6">
                    <div className="relative space-y-4">
                        <p className="text-lg font-semibold">Asignación de Imagenes</p>
                        <p className="text-sm">
                            Esta card se creará con una imagen de not found inicial.
                        </p>
                        <ul className="text-sm space-y-2">
                            <li>• Agrega una o más imágenes para cada producto.</li>
                            <li>• Activación automática al agregar detalle.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {successMessage && (
                <div className="text-green-600 text-sm font-semibold">{successMessage}</div>
            )}
            {errorMessage && (
                <div className="text-red-600 text-sm font-semibold">{errorMessage}</div>
            )}

            <div className="rounded-3xl bg-[rgb(var(--color-card))] shadow-lg border border-[rgb(var(--color-border))] p-6">
                {activeStep === 'product' ? renderProductForm() : renderDetailForm()}
            </div>
        </div>
    );
}
