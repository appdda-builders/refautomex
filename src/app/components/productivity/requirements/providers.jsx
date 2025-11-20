import { useState, useEffect, useMemo, useCallback } from 'react';
import Title from '../title';
import { HiClipboardDocumentList } from "react-icons/hi2";
import { GrStatusGoodSmall } from "react-icons/gr";
import { MdPhone, MdEmail, MdOutlineDiscount, MdOutlineAccessTime } from "react-icons/md";
import { buildApiUrl } from '@/app/lib/refautomex-api';

const getInitials = (text = '') => {
    if (!text) return 'PR';
    const clean = text.trim();
    if (!clean) return 'PR';
    const [firstWord] = clean.split(' ');
    return firstWord.charAt(0).toUpperCase();
};

const normalize = (value) => (
    (value || '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
);

const isProviderActive = (provider) => {
    if (provider?.status) {
        return provider.status === 'A' || provider.status.toLowerCase() === 'activo';
    }
    if (typeof provider?.activo !== 'undefined') {
        return provider.activo === 1 || provider.activo === true;
    }
    if (typeof provider?.is_active !== 'undefined') {
        return Boolean(provider.is_active);
    }
    return true;
};

const formatPercentage = (value) => {
    const number = parseFloat(value);
    if (Number.isFinite(number) && number > 0) {
        return `${number.toFixed(2)} %`;
    }
    return null;
};

const INITIAL_PROVIDER_FORM = {
    idproveedor: '',
    empresa: '',
    contacto: '',
    representante: '',
    telefono: '',
    celular: '',
    email: '',
    correo: '',
    direccion: '',
    plazo_dias: '',
    descuento: '',
    status: 'A',
};

export default function Providers() {
    const [providers, setProviders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // list | detail | create
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [providerForm, setProviderForm] = useState(INITIAL_PROVIDER_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [formFeedback, setFormFeedback] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchProviders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(buildApiUrl('/getAllProviders'), {
                cache: 'no-store',
                headers: { Accept: 'application/json, text/plain, */*' },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setProviders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching providers:', err);
            setError('No pudimos cargar la lista de proveedores. Intenta de nuevo más tarde.');
            setProviders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    const filteredProviders = useMemo(() => {
        const term = normalize(searchTerm);
        if (!term) return providers;

        return providers.filter((provider) => {
            const searchableText = [
                provider?.empresa,
                provider?.nombre,
                provider?.contacto,
                provider?.representante,
                provider?.alias,
                provider?.email,
                provider?.correo,
                provider?.telefono,
                provider?.celular,
                provider?.marca
            ].map(normalize).join(' ');

            return searchableText.includes(term);
        });
    }, [providers, searchTerm]);

    const mapProviderToForm = (provider) => ({
        idproveedor: provider?.idproveedor || provider?.id || '',
        empresa: provider?.empresa || '',
        contacto: provider?.contacto || provider?.representante || '',
        representante: provider?.representante || '',
        telefono: provider?.telefono || '',
        celular: provider?.celular || '',
        email: provider?.email || '',
        correo: provider?.correo || '',
        direccion: provider?.direccion || provider?.domicilio || '',
        plazo_dias: provider?.plazo_dias || provider?.plazo || provider?.diascredito || '',
        descuento: provider?.descuento || provider?.descuento_sugerido || '',
        status: provider?.status || (isProviderActive(provider) ? 'A' : 'I'),
    });

    const handleProviderClick = (provider) => {
        setSelectedProvider(provider);
        setProviderForm(mapProviderToForm(provider));
        setViewMode('detail');
        setFormErrors({});
        setFormFeedback(null);
    };

    const handleCreateProviderClick = () => {
        setSelectedProvider(null);
        setProviderForm(INITIAL_PROVIDER_FORM);
        setViewMode('create');
        setFormErrors({});
        setFormFeedback(null);
    };

    const handleCancelForm = () => {
        setViewMode('list');
        setSelectedProvider(null);
        setProviderForm(INITIAL_PROVIDER_FORM);
        setFormErrors({});
        setFormFeedback(null);
    };

    const handleFormChange = (field, value) => {
        setProviderForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const validateProviderForm = () => {
        const errors = {};
        if (!providerForm.empresa?.trim()) {
            errors.empresa = 'La razón social es obligatoria.';
        }
        if (!providerForm.contacto?.trim()) {
            errors.contacto = 'El contacto es obligatorio.';
        }
        if (providerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providerForm.email)) {
            errors.email = 'El correo principal no es válido.';
        }
        if (providerForm.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providerForm.correo)) {
            errors.correo = 'El correo alterno no es válido.';
        }
        if (providerForm.telefono && providerForm.telefono.replace(/\D/g, '').length < 7) {
            errors.telefono = 'El teléfono requiere al menos 7 dígitos.';
        }
        if (providerForm.celular && providerForm.celular.replace(/\D/g, '').length < 7) {
            errors.celular = 'El celular requiere al menos 7 dígitos.';
        }
        if (providerForm.descuento && Number(providerForm.descuento) < 0) {
            errors.descuento = 'El descuento no puede ser negativo.';
        }
        return errors;
    };

    const handleSubmitForm = async () => {
        const errors = validateProviderForm();
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            setFormFeedback({
                type: 'error',
                message: 'Revisa los campos marcados antes de continuar.',
            });
            return;
        }
        setIsSubmitting(true);
        setFormFeedback(null);
        const isEditing = viewMode === 'detail';
        const endpoint = isEditing ? '/patchProvider' : '/newProvider';
        const method = isEditing ? 'PATCH' : 'POST';
        const payload = { ...providerForm };
        if (!isEditing) {
            delete payload.idproveedor;
        } else if (!payload.idproveedor && selectedProvider) {
            payload.idproveedor = selectedProvider.idproveedor || selectedProvider.id;
        }

        try {
            const response = await fetch(buildApiUrl(endpoint), {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json, text/plain, */*',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            setFormFeedback({
                type: 'success',
                message: isEditing ? 'Proveedor actualizado correctamente.' : 'Proveedor agregado correctamente.',
            });
            await fetchProviders();
            if (!isEditing) {
                setProviderForm(INITIAL_PROVIDER_FORM);
            } else {
                setSelectedProvider((prev) => (prev ? { ...prev, ...payload } : prev));
            }
        } catch (err) {
            console.error('Error saving provider:', err);
            setFormFeedback({
                type: 'error',
                message: 'No fue posible guardar la información. Intenta nuevamente.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const shouldHideFirstTwo = !normalize(searchTerm);
    const providersToDisplay = shouldHideFirstTwo
        ? filteredProviders.slice(2)
        : filteredProviders;

    const activeProviders = providersToDisplay.filter((provider) => isProviderActive(provider));
    const pausedProviders = providersToDisplay.filter((provider) => !isProviderActive(provider));

    const renderProviderCard = (provider, index) => {
        const providerKey = provider.id || provider.idproveedor || provider.empresa || index;
        const contactName = provider.contacto || provider.representante || 'Sin contacto asignado';
        const phone = provider.telefono || provider.celular || provider.phone || '';
        const email = provider.email || provider.correo || provider.mail || '';
        const creditDays = provider.plazo_dias || provider.plazo || provider.diascredito;
        const discount = formatPercentage(provider.descuento || provider.descuento_sugerido);

        return (
            <div
                key={providerKey}
                className="relative p-1 rounded-xl animate-out bg-[rgb(var(--color-card))] shadow shadow-[rgba(var(--color-galaxy))] hover:shadow-[rgba(var(--color-gray))] transition cursor-pointer"
                onClick={() => handleProviderClick(provider)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleProviderClick(provider);
                    }
                }}
                role="button"
                tabIndex={0}
            >
                <span className="absolute flex h-5 w-5 top-0 -left-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isProviderActive(provider) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <GrStatusGoodSmall className={`relative inline-flex rounded-full h-5 w-5 ${isProviderActive(provider) ? 'text-green-500' : 'text-red-500'}`}/>
                </span>
                <dt className="text-xl font-bold leading-7 text-[rgb(var(--color-text))] pl-16">
                    <div className="absolute left-4 top-2 flex h-10 w-10 items-center justify-center rounded-full shadow-2xl bg-[rgb(var(--color-bg))] text-[rgb(var(--color-amber))] font-semibold">
                        {getInitials(provider.empresa)}
                    </div>
                    {provider.empresa || 'Proveedor sin nombre'}
                </dt>
                <dd className="mt-4 pl-1 text-sm text-[rgb(var(--color-text))] space-y-2">
                    {phone && phone !== 'Sin teléfono' && (
                        <div className="flex items-center gap-2">
                            <MdPhone />
                            <span>{phone}</span>
                        </div>
                    )}
                    {email && email !== 'Sin correo' && (
                        <div className="flex items-center gap-2">
                            <MdEmail />
                            <span className="truncate">{email}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <MdOutlineAccessTime />
                        <span>{creditDays ? `${creditDays} días de crédito` : 'Sin plazo definido'}</span>
                    </div>
                    {discount && (
                        <div className="flex items-center gap-2">
                            <MdOutlineDiscount />
                            <span>Descuento sugerido: {discount}</span>
                        </div>
                    )}
                    <p className="text-xs text-[rgb(var(--color-card-base))] font-semibold mt-2 pt-2 border-t border-[rgb(var(--color-border))]">
                        Contacto: {contactName}
                    </p>
                </dd>
            </div>
        );
    };

    return (
        <div className="bg-gradient-to-b from-[rgb(var(--color-bg))] via-[rgb(var(--color-card))] to-[rgb(var(--color-gray))] backdrop-blur-md pt-28">
            <Title
                title='Proveedores'
                icon={HiClipboardDocumentList}
                back='Volver al panel'
                path='/productivity'
            />
            <div className="mx-auto max-w-7xl px-6 lg:px-8 min-h-screen h-auto">
                {viewMode === 'list' ? (
                    <div className="mx-auto mt-4 max-w-7xl">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <input
                                type="text"
                                placeholder="Buscar por empresa, contacto o correo"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="p-2 border border-[rgb(var(--color-border))] rounded-md flex-1 bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                            />
                            <button
                                type="button"
                                className="px-4 py-2 rounded-md bg-amber-500 text-white font-semibold shadow hover:bg-amber-600"
                                onClick={handleCreateProviderClick}
                            >
                                Alta de proveedor
                            </button>
                        </div>
                        {error && (
                            <div className="mb-4 mt-4 rounded-md bg-red-50 p-4 text-sm text-red-800 shadow">
                                {error}
                            </div>
                        )}
                        {loading ? (
                            <div className="text-center py-10 text-[rgb(var(--color-text))]">Cargando proveedores...</div>
                        ) : (
                            <>
                                <section className="mt-6">
                                    <h2 className="text-2xl font-bold text-[rgb(var(--color-text))] mb-4">Proveedores activos</h2>
                                    {activeProviders.length === 0 ? (
                                        <p className="text-sm text-[rgb(var(--color-gray))]">No encontramos proveedores activos con ese criterio.</p>
                                    ) : (
                                        <dl className="grid grid-cols-1 gap-5 gap-x-4 xl:gap-x-3 lg:max-w-none md:grid-cols-2 xl:grid-cols-4 lg:gap-y-8">
                                            {activeProviders.map(renderProviderCard)}
                                        </dl>
                                    )}
                                </section>

                                <section className="mt-10">
                                    <h2 className="text-2xl font-bold text-[rgb(var(--color-text))] mb-4">Pausados o sin actividad</h2>
                                    {pausedProviders.length === 0 ? (
                                        <p className="text-sm text-[rgb(var(--color-gray))]">No hay proveedores pausados.</p>
                                    ) : (
                                        <dl className="grid grid-cols-1 gap-3 lg:max-w-none md:grid-cols-2 xl:grid-cols-4 lg:gap-y-8">
                                            {pausedProviders.map(renderProviderCard)}
                                        </dl>
                                    )}
                                </section>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="mx-auto my-10 max-w-4xl bg-[rgb(var(--color-card))] rounded-2xl shadow-lg p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <h2 className="text-2xl font-bold text-[rgb(var(--color-text))]">
                                {viewMode === 'detail' ? `Editar proveedor: ${providerForm.empresa || ''}` : 'Alta de proveedor'}
                            </h2>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancelForm}
                                    className="px-4 py-2 rounded-md border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg))]"
                                >
                                    Volver a proveedores
                                </button>
                            </div>
                        </div>
                        {formFeedback && (
                            <div
                                className={`mb-4 rounded-md p-4 text-sm shadow ${
                                    formFeedback.type === 'success'
                                        ? 'bg-green-50 text-green-800'
                                        : 'bg-red-50 text-red-800'
                                }`}
                            >
                                {formFeedback.message}
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-text))]">Empresa</label>
                                <input
                                    type="text"
                                    value={providerForm.empresa}
                                    onChange={(e) => handleFormChange('empresa', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-2 text-[rgb(var(--color-text))]"
                                />
                                {formErrors.empresa && <p className="text-xs text-red-500 mt-1">{formErrors.empresa}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-text))]">Contacto</label>
                                <input
                                    type="text"
                                    value={providerForm.contacto}
                                    onChange={(e) => handleFormChange('contacto', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-2 text-[rgb(var(--color-text))]"
                                />
                                {formErrors.contacto && <p className="text-xs text-red-500 mt-1">{formErrors.contacto}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-text))]">Representante</label>
                                <input
                                    type="text"
                                    value={providerForm.representante}
                                    onChange={(e) => handleFormChange('representante', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-2 text-[rgb(var(--color-text))]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-text))]">Teléfono</label>
                                <input
                                    type="tel"
                                    value={providerForm.telefono}
                                    onChange={(e) => handleFormChange('telefono', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-2 text-[rgb(var(--color-text))]"
                                />
                                {formErrors.telefono && <p className="text-xs text-red-500 mt-1">{formErrors.telefono}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-text))]">Celular</label>
                                <input
                                    type="tel"
                                    value={providerForm.celular}
                                    onChange={(e) => handleFormChange('celular', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-2 text-[rgb(var(--color-text))]"
                                />
                                {formErrors.celular && <p className="text-xs text-red-500 mt-1">{formErrors.celular}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-text))]">Correo principal</label>
                                <input
                                    type="email"
                                    value={providerForm.email}
                                    onChange={(e) => handleFormChange('email', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-2 text-[rgb(var(--color-text))]"
                                />
                                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-text))]">Correo alterno</label>
                                <input
                                    type="email"
                                    value={providerForm.correo}
                                    onChange={(e) => handleFormChange('correo', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-2 text-[rgb(var(--color-text))]"
                                />
                                {formErrors.correo && <p className="text-xs text-red-500 mt-1">{formErrors.correo}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-text))]">Plazo (días)</label>
                                <input
                                    type="number"
                                    value={providerForm.plazo_dias}
                                    onChange={(e) => handleFormChange('plazo_dias', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-2 text-[rgb(var(--color-text))]"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-text))]">Descuento sugerido (%)</label>
                                <input
                                    type="number"
                                    value={providerForm.descuento}
                                    onChange={(e) => handleFormChange('descuento', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-2 text-[rgb(var(--color-text))]"
                                    step="0.01"
                                />
                                {formErrors.descuento && <p className="text-xs text-red-500 mt-1">{formErrors.descuento}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--color-text))]">Estatus</label>
                                <select
                                    value={providerForm.status}
                                    onChange={(e) => handleFormChange('status', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-2 text-[rgb(var(--color-text))]"
                                >
                                    <option value="A">Activo</option>
                                    <option value="I">Inactivo</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[rgb(var(--color-text))]">Dirección</label>
                                <textarea
                                    value={providerForm.direccion}
                                    onChange={(e) => handleFormChange('direccion', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] p-2 text-[rgb(var(--color-text))]"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={handleCancelForm}
                                className="px-4 py-2 rounded-md border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg))]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitForm}
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-md bg-green-600 text-white font-semibold shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
