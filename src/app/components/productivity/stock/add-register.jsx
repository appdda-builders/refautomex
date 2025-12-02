import React, { useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import { buildApiUrl } from '@/app/lib/refautomex-api';
import { MdAddCircle, MdAssignmentAdd } from 'react-icons/md';
import FindProducts from '@/app/components/productivity/sales/find-products';

const parseRoutes = (raw) => {
    if (!raw) return [];
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
        return [];
    }
};

const isWebBranchValue = (value) => {
    if (value === null || value === undefined) return false;
    const normalized = String(value).toUpperCase();
    return normalized === '1' || normalized === 'WEB';
};

const NOT_ASSIGNED_OPTION = { value: '__NOT_ASSIGNED__', label: 'Selecciona', isDisabled: true };

const withDefaultOption = (options = []) => [NOT_ASSIGNED_OPTION, ...options];

const getSelectValue = (options = [], value) => {
    if (!value) return NOT_ASSIGNED_OPTION;
    return options.find((option) => option.value === value) || NOT_ASSIGNED_OPTION;
};

export default function AddRegister({ onCancelEdit, onRefreshProducts }) {
    const [productForm, setProductForm] = useState({
        refaccion: '',
        descripcion: '',
        mod_ini: '',
        mod_fin: '',
        idgrupo: '',
        idmarca: '',
        idproveedor: '',
    });
    const IVA_FACTOR = 1.16;

    const [detailForm, setDetailForm] = useState({
        idsucursal: '',
        localizacion: '',
        existencia: '',
        costo: '',
        precio: '',
        aiva: '',
        utilidad: '',
    });
    const [groupOptions, setGroupOptions] = useState([]);
    const [brandOptions, setBrandOptions] = useState([]);
    const [providerOptions, setProviderOptions] = useState([]);
    const [sucursalOptions, setSucursalOptions] = useState([]);
    const [quantityOptions, setQuantityOptions] = useState([]);
    const [pendingProducts, setPendingProducts] = useState([]);
    const [activeProducts, setActiveProducts] = useState([]);
    const [pendingLoading, setPendingLoading] = useState(false);
    const [selectedPendingPart, setSelectedPendingPart] = useState(null);
    const [activeStep, setActiveStep] = useState('product');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorMessages, setErrorMessages] = useState({});

    const findProductsRef = useRef(null);

    const extractGroupOptionsFromProducts = (products = []) => {
        const uniqueGroups = new Map();
        products.forEach((product) => {
            const id = product.idgrupo ?? product.idGrupo ?? product.id_grupo;
            const name = product.grupo ?? product.group;
            if (id && name && !uniqueGroups.has(id)) {
                uniqueGroups.set(id, {
                    value: id,
                    label: name
                });
            }
        });
        return Array.from(uniqueGroups.values()).sort((a, b) =>
            a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })
        );
    };

    const selectedPendingProduct =
        pendingProducts.find((product) => product.num_parte === selectedPendingPart) ||
        activeProducts.find((product) => product.num_parte === selectedPendingPart);

    const handleSearchProductPick = (product) => {
        if (!product?.num_parte) return;
        setSelectedPendingPart(product.num_parte);
        setActiveStep('detail');
        setDetailForm({
            idsucursal: '',
            localizacion: '',
            existencia: '',
            costo: '',
            precio: '',
            aiva: '',
            utilidad: '',
        });
    };

    const prefillDetailFromExisting = (detail) => {
        if (!detail) return;
        setDetailForm(prev => ({
            ...prev,
            idsucursal: '',
            localizacion: detail.localizacion ? detail.localizacion.toUpperCase() : '',
            existencia: detail.existencia ?? '',
            costo: detail.costo ?? '',
            precio: detail.precio ?? '',
            aiva: detail.aiva ?? '',
            utilidad: detail.utilidad ?? '',
        }));
    };

    const handleProductInputChange = (field, value) => {
        const normalizedValue = field === 'descripcion' && typeof value === 'string'
            ? value.toUpperCase()
            : value;
        setProductForm((prev) => ({
            ...prev,
            [field]: normalizedValue,
        }));
    };

    const recalculateDetailFinance = (priceValue, utilityValue) => {
        const parsedPrice = parseFloat(priceValue);
        if (Number.isNaN(parsedPrice)) {
            return {};
        }
        const computedAIva = (parsedPrice / IVA_FACTOR).toFixed(2);
        const parsedUtility = parseFloat(utilityValue);
        const computedCost =
            Number.isNaN(parsedUtility) || parsedUtility === 0
                ? ''
                : (parsedPrice / IVA_FACTOR / parsedUtility).toFixed(2);
        return {
            aiva: computedAIva,
            costo: computedCost,
        };
    };

    const handleDetailInputChange = (field, value) => {
        setDetailForm((prev) => {
            const next = { ...prev, [field]: value };
            const currentBranch = field === 'idsucursal' ? value : prev.idsucursal;
            const isWebBranch = isWebBranchValue(currentBranch);

            if (isWebBranch) {
                next.localizacion = '0';
                next.existencia = '0';
            }

            if (field === 'precio') {
                if (value === '') {
                    next.aiva = '';
                    next.costo = '';
                    return next;
                }
                const recalculated = recalculateDetailFinance(value, next.utilidad);
                return { ...next, ...recalculated };
            }
            if (field === 'utilidad') {
                if (value === '') {
                    next.costo = '';
                    return next;
                }
                if (next.precio) {
                    const recalculated = recalculateDetailFinance(next.precio, value);
                    return { ...next, ...recalculated };
                }
                return next;
            }
            if (field === 'idsucursal') {
                setErrorMessages(prev => {
                    const clone = { ...prev };
                    const activeProduct = activeProducts.find(
                        product => product.num_parte === selectedPendingPart
                    );
                    const existsInBranch = activeProduct?.detalles?.some(
                        detail => String(detail.idsucursal) === String(value)
                    );
                    if (existsInBranch) {
                        clone.idsucursal = 'Este producto ya está activo en la sucursal seleccionada.';
                    } else {
                        delete clone.idsucursal;
                    }
                    if (isWebBranchValue(value)) {
                        delete clone.localizacion;
                        delete clone.existencia;
                    }
                    return clone;
                });
            }
            return next;
        });
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

        if (!productForm.idproveedor) {
            valid = false;
            newErrors.idproveedor = 'Selecciona un proveedor.';
        }

        setErrorMessages(newErrors);
        return valid;
    };

    const validateDetailForm = () => {
        const patterns = {
            localizacion: /^[0-9]{2}[A-Z]{1}[0-9A-Z]{2}[-0-9]{2,3}$/,
            existencia: /^[0-9]+$/,
            precio: /^[0-9]+(\.[0-9]+)?$/,
            aiva: /^[0-9]+(\.[0-9]+)?$/,
            costo: /^[0-9]+(\.[0-9]+)?$/,
            utilidad: /^[0-9]+(\.[0-9]+)?$/,
        };

        const newErrors = {};
        let valid = true;

        if (!selectedPendingProduct) {
            valid = false;
            newErrors.selectedProduct = 'Selecciona un producto pendiente.';
        }

        const isWebBranch = isWebBranchValue(detailForm.idsucursal);
        const normalizedForm = {
            ...detailForm,
            localizacion: detailForm.localizacion ? detailForm.localizacion.toUpperCase() : '',
        };

        if (!detailForm.idsucursal) {
            valid = false;
            newErrors.idsucursal = 'Selecciona una sucursal.';
        }

        Object.entries(patterns).forEach(([field, regex]) => {
            if (isWebBranch && (field === 'localizacion' || field === 'existencia')) {
                return;
            }
            if (!regex.test(normalizedForm[field] || '')) {
                valid = false;
                newErrors[field] = `${field} es inválido.`;
            }
        });

        setErrorMessages(newErrors);
        return valid;
    };

    const checkLocationAvailability = async ({ idsucursal, localizacion, refaccion }) => {
        if (!idsucursal || !localizacion || isWebBranchValue(idsucursal)) {
            return { ok: true };
        }
        try {
            const params = new URLSearchParams({
                localizacion,
                idsucursal,
                num_parte: refaccion,
            });
            const response = await fetch(`${buildApiUrl('/verifyLocation')}?${params.toString()}`, {
                cache: 'no-store',
                headers: { Accept: 'application/json, text/plain, */*' },
            });
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.exists) {
                return { ok: false, message: data.message || 'Localización ya ocupada.' };
            }
            return { ok: true };
        } catch (error) {
            console.error('Error verificando localización:', error);
            return { ok: false, message: 'Error al verificar la localización.' };
        }
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

        const normalizedDescription = (productForm.descripcion || '').toUpperCase();

        const payload = {
            refaccion: productForm.refaccion,
            descripcion: normalizedDescription,
            mod_ini: productForm.mod_ini,
            mod_fin: productForm.mod_fin,
            idgrupo: productForm.idgrupo,
            idmarca: productForm.idmarca,
            idproveedor: productForm.idproveedor,
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
                mod_ini: '',
                mod_fin: '',
                idgrupo: '',
                idmarca: '',
                idproveedor: '',
            });
            fetchPendingProducts();
            findProductsRef.current?.refreshProducts?.();
            onRefreshProducts?.();
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

        const isWebBranch = isWebBranchValue(detailForm.idsucursal);
        const normalizedLocalizacion = detailForm.localizacion ? detailForm.localizacion.toUpperCase() : '';

        const locationValidation = await checkLocationAvailability({
            idsucursal: detailForm.idsucursal,
            localizacion: normalizedLocalizacion,
            refaccion: selectedPendingProduct?.num_parte,
        });

        if (!isWebBranch && !locationValidation.ok) {
            setErrorMessages(prev => ({ ...prev, localizacion: locationValidation.message }));
            setErrorMessage(locationValidation.message);
            return;
        }
        const payload = {
            refaccion: selectedPendingProduct.num_parte,
            idsucursal: detailForm.idsucursal,
            localizacion: isWebBranch ? '0' : normalizedLocalizacion,
            existencia: isWebBranch ? '0' : detailForm.existencia,
            costo: detailForm.costo,
            precio: detailForm.precio,
            aiva: detailForm.aiva,
            utilidad: detailForm.utilidad,
            status: 'A',
        };

        try {
            const response = await fetch(buildApiUrl('/newProductDetail'), {
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
                aiva: '',
                utilidad: '',
            });
            setSelectedPendingPart(null);
            fetchPendingProducts();
            findProductsRef.current?.refreshProducts?.();
            onRefreshProducts?.();
        } catch (error) {
            console.error('Error al asignar detalle:', error);
            setErrorMessage('Hubo un error al asignar el detalle. Intenta de nuevo.');
        }
    };

    const fetchPendingProducts = async () => {
        setPendingLoading(true);
        try {
            const response = await fetch(buildApiUrl('/getWarehouseProducts'), {
                cache: 'no-store',
                headers: { Accept: 'application/json, text/plain, */*' },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const formattedExisting = (data?.[0] || []).map(product => ({
                ...product,
                rutas: parseRoutes(product.rutas),
            }));
            const activeGrouped = {};
            (data?.[1] || []).forEach(product => {
                const key = product.num_parte;
                if (!activeGrouped[key]) {
                    activeGrouped[key] = {
                        ...product,
                        rutas: parseRoutes(product.rutas),
                        detalles: []
                    };
                }
                activeGrouped[key].detalles.push({
                    idsucursal: product.idsucursal,
                    sucursal: product.sucursal,
                    localizacion: product.localizacion,
                    existencia: product.existencia,
                    costo: product.costo,
                    precio: product.precio,
                    aiva: product.aiva,
                    utilidad: product.utilidad
                });
            });

            setPendingProducts(formattedExisting);
            setActiveProducts(Object.values(activeGrouped));
            setGroupOptions((prev) => {
                if (prev.length) {
                    return prev;
                }
                const fallback = extractGroupOptionsFromProducts(formattedExisting);
                return fallback.length ? fallback : prev;
            });
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

                if (response.status === 404) {
                    console.warn('Endpoint /getGroups no disponible. Se usarán datos locales si es posible.');
                    return;
                }

                if (!response.ok) {
                    console.warn(`No se pudieron obtener grupos (${response.status}).`);
                    return;
                }

                const payload = await response.json();
                const normalizedPayload = Array.isArray(payload) ? payload : [];
                const options = normalizedPayload.map(group => ({
                    value: group.idgrupo,
                    label: group.grupo,
                }));
                if (options.length) {
                    setGroupOptions(options);
                }
            } catch (error) {
                console.warn('Error al obtener grupos. Se intentará usar datos locales.', error);
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
                const options = payload.map((provider) => ({
                    value: provider.idproveedor,
                    label: provider.empresa,
                }));
                setProviderOptions(options);
            } catch (error) {
                console.error('Error al obtener proveedores:', error);
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
        fetchProviderOptions();
        fetchQuantityOptions();
        fetchSucursalOptions();
        fetchPendingProducts();
    }, []);

    const existingProductOptions = pendingProducts.map((product) => ({
        value: product.num_parte,
        label: `${product.num_parte} | ${product.descripcion}`,
        status: 'E'
    }));

    const activeProductOptions = activeProducts.map((product) => ({
        value: product.num_parte,
        label: `${product.num_parte} | ${product.descripcion}`,
        status: 'A'
    }));

    const selectedActiveProduct = activeProducts.find(product => product.num_parte === selectedPendingPart);

    useEffect(() => {
        if (!selectedPendingPart) {
            setDetailForm(prev => ({
                ...prev,
                idsucursal: '',
                costo: '',
                precio: '',
                aiva: '',
                utilidad: ''
            }));
            return;
        }

        if (selectedActiveProduct?.detalles?.length) {
            const detail = selectedActiveProduct.detalles[0];
            setDetailForm(prev => ({
                ...prev,
                idsucursal: '',
                costo: detail.costo ?? '',
                precio: detail.precio ?? '',
                aiva: detail.aiva ?? '',
                utilidad: detail.utilidad ?? ''
            }));
        } else {
            setDetailForm(prev => ({
                ...prev,
                idsucursal: '',
                costo: '',
                precio: '',
                aiva: '',
                utilidad: ''
            }));
        }
    }, [selectedPendingPart, selectedActiveProduct]);

    const renderProductForm = () => {
        const groupSelectOptions = groupOptions.filter(
            (option) => option.label && option.label.toLowerCase() !== 'not assigned'
        );
        const brandSelectOptions = withDefaultOption(brandOptions);
        const providerSelectOptions = providerOptions.slice(2);
        const yearOptions = withDefaultOption(
            Array.from({ length: 36 }, (_, i) => {
                const year = 1990 + i;
                return { value: year, label: `${year}` };
            })
        );

        return (
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
                        className="block w-full rounded-xl border-0 py-2 px-3 text-[rgb(var(--color-text))] bg-[rgb(var(--color-card))] shadow shadow-[rgb(var(--color-galaxy))] focus:ring-2 focus:ring-indigo-500 uppercase"
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
                        className="block w-full rounded-xl border-0 py-2 px-3 text-[rgb(var(--color-text))] bg-[rgb(var(--color-card))] shadow shadow-[rgb(var(--color-galaxy))] focus:ring-2 focus:ring-indigo-500 uppercase"
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
                        options={groupSelectOptions}
                        value={
                            groupSelectOptions.find((option) => option.value === productForm.idgrupo) || null
                        }
                        onChange={(selectedOption) =>
                            handleProductInputChange('idgrupo', selectedOption ? selectedOption.value : '')
                        }
                        placeholder="Selecciona un grupo"
                        classNamePrefix="react-select"
                    />
                    {errorMessages.idgrupo && (
                        <span className="text-red-600 text-sm">{errorMessages.idgrupo}</span>
                    )}
                </div>

                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Proveedor
                    </label>
                    <Select
                        options={providerSelectOptions}
                        value={
                            providerSelectOptions.find((option) => option.value === productForm.idproveedor) || null
                        }
                        onChange={(selectedOption) =>
                            handleProductInputChange('idproveedor', selectedOption ? selectedOption.value : '')
                        }
                        placeholder="Selecciona un proveedor"
                        classNamePrefix="react-select"
                    />
                    {errorMessages.idproveedor && (
                        <span className="text-red-600 text-sm">{errorMessages.idproveedor}</span>
                    )}
                </div>

                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Modelo inicial
                    </label>
                    <Select
                        options={yearOptions}
                        value={getSelectValue(yearOptions, productForm.mod_ini)}
                        onChange={(selectedOption) =>
                            handleProductInputChange('mod_ini', selectedOption ? selectedOption.value : '')
                        }
                        isOptionDisabled={(option) => option.isDisabled}
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
                        options={yearOptions}
                        value={getSelectValue(yearOptions, productForm.mod_fin)}
                        onChange={(selectedOption) =>
                            handleProductInputChange('mod_fin', selectedOption ? selectedOption.value : '')
                        }
                        isOptionDisabled={(option) => option.isDisabled}
                        classNamePrefix="react-select"
                    />
                    {errorMessages.mod_fin && (
                        <span className="text-red-600 text-sm">{errorMessages.mod_fin}</span>
                    )}
                </div>

                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                        Marca de auto
                    </label>
                    <Select
                        options={brandSelectOptions}
                        value={getSelectValue(brandSelectOptions, productForm.idmarca)}
                        onChange={(selectedOption) =>
                            handleProductInputChange('idmarca', selectedOption ? selectedOption.value : '')
                        }
                        isOptionDisabled={(option) => option.isDisabled}
                        classNamePrefix="react-select"
                    />
                    {errorMessages.idmarca && (
                        <span className="text-red-600 text-sm">{errorMessages.idmarca}</span>
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
    };

    const renderDetailForm = () => {
        const baseSucursalOptions = withDefaultOption(sucursalOptions);
        const quantitySelectOptions = withDefaultOption(quantityOptions);
        const utilitySelectOptions = withDefaultOption([
            { value: 1.25, label: '25%' },
            { value: 1.3, label: '30%' },
            { value: 1.35, label: '35%' },
        ]);

        const activeBranchIds = new Set(
            selectedActiveProduct?.detalles?.map(detail => String(detail.idsucursal)) || []
        );
        const filteredSucursalOptions = withDefaultOption(
            sucursalOptions.filter(option => !activeBranchIds.has(String(option.value)))
        );
        const displayedSucursalOptions = selectedActiveProduct ? filteredSucursalOptions : baseSucursalOptions;
        const noAvailableSucursal =
            selectedActiveProduct && displayedSucursalOptions.length <= 1;
        const webBranchSelected = isWebBranchValue(detailForm.idsucursal);

        return (
        <form onSubmit={handleDetailSubmit}>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] md:px-5 lg:px-0">
                <div className="rounded-3xl bg-[rgb(var(--color-card))] shadow-lg border border-[rgb(var(--color-border))]">
                    <FindProducts
                        ref={findProductsRef}
                        onAddProduct={handleSearchProductPick}
                        onRemoveProduct={() => {}}
                        addedItems={[]}
                        isWarehouse={false}
                        includePendingProducts
                        includeWebBranch
                        showAllBranches
                        onProductPick={handleSearchProductPick}
                        selectedProducts={selectedPendingPart ? [selectedPendingPart] : []}
                    />
                </div>
                <div className="grid grid-cols-1 gap-x-2 gap-y-8 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Producto seleccionado
                        </label>
                        {selectedPendingProduct ? (
                            <div className="mt-2 p-3 rounded-xl bg-[rgb(var(--color-bg))] text-xs text-[rgb(var(--color-text))] shadow-inner space-y-2">
                                <div>
                                    <p><span className="font-semibold">Descripción:</span> {selectedPendingProduct.descripcion}</p>
                                    <p><span className="font-semibold">Modelos:</span> {selectedPendingProduct.mod_ini} - {selectedPendingProduct.mod_fin}</p>
                                </div>
                            {selectedActiveProduct?.detalles?.length > 0 && (
                                <div className="space-y-1">
                                    <p className="font-semibold text-emerald-500">Asignaciones existentes</p>
                                    {selectedActiveProduct.detalles.map((detail, idx) => (
                                        <button
                                            type="button"
                                            key={`${selectedActiveProduct.num_parte}-${detail.idsucursal}-${idx}`}
                                            onClick={() => prefillDetailFromExisting(detail)}
                                            className="flex flex-col rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-left hover:border-emerald-400 hover:shadow transition"
                                        >
                                            <span className="text-gray-500">
                                                <span className="font-semibold">Sucursal:</span> {detail.sucursal || detail.idsucursal}
                                            </span>
                                            <span className="text-gray-500">
                                                <span className="font-semibold">Localización:</span> {detail.localizacion || '—'}
                                            </span>
                                            <span className="text-gray-500">
                                                <span className="font-semibold">Existencia:</span> {detail.existencia ?? '—'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            </div>
                        ) : (
                            <div className="mt-2 p-3 rounded-xl bg-amber-50 text-amber-700 text-sm border border-amber-200">
                                No has seleccionado ninguna refacción.
                            </div>
                        )}
                        {errorMessages.selectedProduct && (
                            <span className="text-red-600 text-sm">{errorMessages.selectedProduct}</span>
                        )}
                    </div>

                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Sucursal por asignar
                        </label>
                        {noAvailableSucursal ? (
                            <div className="mt-2 p-3 rounded-xl bg-amber-50 text-amber-700 text-sm border border-amber-200">
                                Producto asignado en todas las sucursales. No se puede asignar nuevamente.
                            </div>
                        ) : (
                            <>
                                <Select
                                    options={displayedSucursalOptions}
                                    value={getSelectValue(displayedSucursalOptions, detailForm.idsucursal)}
                                    onChange={(selectedOption) =>
                                        handleDetailInputChange('idsucursal', selectedOption ? selectedOption.value : '')
                                    }
                                    isOptionDisabled={(option) => option.isDisabled}
                                    classNamePrefix="react-select"
                                />
                                {errorMessages.idsucursal && (
                                    <span className="text-red-600 text-sm">{errorMessages.idsucursal}</span>
                                )}
                            </>
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
                            disabled={webBranchSelected}
                            className={`block w-full rounded-xl border-0 py-2 px-3 text-[rgb(var(--color-text))] shadow focus:ring-2 focus:ring-indigo-500 uppercase ${
                                webBranchSelected
                                    ? 'bg-gray-100 cursor-not-allowed'
                                    : 'bg-[rgb(var(--color-card))]'
                            }`}
                        />
                        {errorMessages.localizacion && (
                            <span className="text-red-600 text-sm">{errorMessages.localizacion}</span>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Existencia
                        </label>
                        {webBranchSelected ? (
                            <input
                                type="text"
                                value="0"
                                disabled
                                className="block w-full rounded-xl border-0 py-2 px-3 text-[rgb(var(--color-text))] bg-gray-100 shadow cursor-not-allowed"
                            />
                        ) : (
                            <Select
                                options={quantitySelectOptions}
                                value={getSelectValue(quantitySelectOptions, detailForm.existencia)}
                                onChange={(selectedOption) =>
                                    handleDetailInputChange('existencia', selectedOption ? selectedOption.value : '')
                                }
                                isOptionDisabled={(option) => option.isDisabled}
                                classNamePrefix="react-select"
                            />
                        )}
                        {errorMessages.existencia && (
                            <span className="text-red-600 text-sm">{errorMessages.existencia}</span>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-[rgb(var(--color-text))]">
                            Utilidad
                        </label>
                        <Select
                            options={utilitySelectOptions}
                            value={getSelectValue(utilitySelectOptions, detailForm.utilidad)}
                            onChange={(selectedOption) =>
                                handleDetailInputChange('utilidad', selectedOption ? selectedOption.value : '')
                            }
                            isOptionDisabled={(option) => option.isDisabled}
                            classNamePrefix="react-select"
                        />
                        {errorMessages.utilidad && (
                            <span className="text-red-600 text-sm">{errorMessages.utilidad}</span>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-500">
                            Costo
                        </label>
                        <input
                            type="text"
                            value={detailForm.costo}
                            readOnly
                            className="block w-full rounded-xl border-0 py-2 px-3 text-gray-500 bg-gray-100 shadow focus:ring-2 focus:ring-indigo-500 uppercase cursor-not-allowed"
                        />
                        {errorMessages.costo && (
                            <span className="text-red-600 text-sm">{errorMessages.costo}</span>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-500">
                            A IVA
                        </label>
                        <input
                            type="text"
                            value={detailForm.aiva}
                            readOnly
                            className="block w-full rounded-xl border-0 py-2 px-3 text-gray-500 bg-gray-100 shadow focus:ring-2 focus:ring-indigo-500 uppercase cursor-not-allowed"
                        />
                        {errorMessages.aiva && (
                            <span className="text-red-600 text-sm">{errorMessages.aiva}</span>
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
    };

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
                        <p className="text-lg font-semibold">Estado de productos</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border rounded-2xl p-4 bg-amber-50 text-amber-700 shadow-inner">
                        <p className="text-xs uppercase tracking-wide">Productos existentes</p>
                        <p className="text-3xl font-bold">{pendingProducts.length}</p>
                                <p className="text-xs">Pendientes de asignación</p>
                            </div>
                            <div className="border rounded-2xl p-4 bg-emerald-50 text-emerald-700 shadow-inner">
                                <p className="text-xs uppercase tracking-wide">Productos activos</p>
                                <p className="text-3xl font-bold">{activeProducts.length}</p>
                                <p className="text-xs">Con detalle en sucursales</p>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="font-semibold text-amber-600 mb-1">Existentes</p>
                                <div className="space-y-1 max-h-28 overflow-y-auto pr-2">
                                    {pendingProducts.slice(0, 6).map((product) => (
                                        <div key={`pending-${product.num_parte}`} className="flex items-center gap-2 bg-[rgb(var(--color-card))/80] rounded-lg px-2 py-1 border border-amber-200">
                                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                                            <span className="truncate">{product.num_parte} - {product.descripcion}</span>
                                        </div>
                                    ))}
                                    {pendingProducts.length === 0 && <p className="text-[rgb(var(--color-text))]/70">Sin productos pendientes.</p>}
                                </div>
                            </div>
                            <div>
                                <p className="font-semibold text-emerald-600 mb-1">Activos</p>
                                <div className="space-y-1 max-h-28 overflow-y-auto pr-2">
                                    {activeProducts.slice(0, 6).map((product) => (
                                        <div key={`active-${product.num_parte}`} className="flex items-center gap-2 bg-[rgb(var(--color-card))/80] rounded-lg px-2 py-1 border border-emerald-200">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="truncate">{product.num_parte} - {product.descripcion}</span>
                                        </div>
                                    ))}
                                    {activeProducts.length === 0 && <p className="text-[rgb(var(--color-text))]/70">Sin productos activos.</p>}
                                </div>
                            </div>
                        </div>
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
