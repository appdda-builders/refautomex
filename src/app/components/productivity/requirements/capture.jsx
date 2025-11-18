import axios from 'axios';
import { buildApiUrl } from '@/app/lib/refautomex-api';
import { useState, useEffect } from 'react';
import Title from '../title';
import { MdPolicy } from "react-icons/md";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { FaSearch } from "react-icons/fa";
import { FaMoneyBillTransfer, FaChartColumn, FaCircleNodes } from "react-icons/fa6";
import { MdOutlineWallet } from "react-icons/md";
import { FaBox } from "react-icons/fa6";
import FindFilter from './find-filter';
import NewCapture from './new-capture';
import EditCaptue from './edit-capture';

function ProvidersSections({ providers, capturedInvoices, activeProvider, onProviderClick }) {
    return (
        <>
            {providers.map((provider, index) => {

                const providerInvoices = capturedInvoices.filter(
                    (invoice) => invoice.empresa === provider.empresa
                );

                if (providerInvoices.length === 0 || provider.empresa === 'NINGUNO') {
                    return null;
                }

                return (
                    <div className='overflow-hidden' key={provider.id || provider.empresa || index}>
                        <div
                            className='relative isolate flex items-left gap-x-6 overflow-hidden bg-[rgb(var(--color-card))] px-6 py-2.5 sm:px-3.5 sm:before:flex-1 border-b border-[rgb(var(--color-border))] cursor-pointer'
                            onClick={() => onProviderClick(provider.id)}
                        >
                            <div
                                aria-hidden="true"
                                className="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
                            >
                                <div
                                    style={{
                                        clipPath:
                                            'polygon(54.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 81.9%)',
                                    }}
                                    className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[rgb(var(--color-galaxy))] to-[rgb(var(--color-amber))] opacity-50"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-10 gap-y-2">
                                <strong className="font-semibold text-[rgb(var(--color-text))] text-xl">{provider.empresa}</strong>
                                <FaCircleNodes size={10} className='text-[rgb(var(--color-amber))] animate-spin'/>
                                <p className="text-sm/6 text-[rgb(var(--color-text))]">
                                    Deuda al proveedor:
                                </p>
                                <p
                                    className="flex-none rounded-full bg-green-600 px-3.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                                >
                                    $ {providerInvoices.reduce((acc, invoice) => acc + parseFloat(invoice.total || 0), 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <div className='overflow-x-auto'>
                        {activeProvider === provider.id && (
                            <DetailsSection capturedInvoices={providerInvoices} />
                        )}
                        </div>
                    </div>
                )
            })}
        </>
    );
}

function PolicySections({ policies, capturedPolicies, activePolicy, onPolicyClick }) {
    return (
        <>
            {policies.map((policy, index) => {

                const policiesInvoices = capturedPolicies.filter(
                    (invoice) => invoice.empresa === policy.empresa
                );

                if (policiesInvoices.length === 0 || policy.empresa === 'NINGUNO') {
                    return null;
                }

                return (
                    <div className='overflow-hidden' key={policy.id || policy.empresa || index}>
                        <div
                            className='relative isolate flex items-left gap-x-6 overflow-hidden bg-[rgb(var(--color-card))] px-6 py-2.5 sm:px-3.5 sm:before:flex-1 border-b border-[rgb(var(--color-border))] cursor-pointer'
                            onClick={() => onProviderClick(policy.id)}
                        >
                            <div
                                aria-hidden="true"
                                className="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
                            >
                                <div
                                    style={{
                                        clipPath:
                                            'polygon(54.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 81.9%)',
                                    }}
                                    className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[rgb(var(--color-galaxy))] to-[rgb(var(--color-amber))] opacity-50"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-10 gap-y-2">
                                <strong className="font-semibold text-[rgb(var(--color-text))] text-xl">{policy.empresa}</strong>
                                <FaCircleNodes size={10} className='text-[rgb(var(--color-amber))] animate-spin'/>
                                <p className="text-sm/6 text-[rgb(var(--color-text))]">
                                    Deuda al proveedor:
                                </p>
                                <p
                                    className="flex-none rounded-full bg-green-600 px-3.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                                >
                                    $ {providerInvoices.reduce((acc, invoice) => acc + parseFloat(invoice.total || 0), 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <div className='overflow-x-auto'>
                        {activeProvider === provider.id && (
                            <DetailsSectionPolicy capturedInvoices={providerInvoices} />
                        )}
                        </div>
                    </div>
                )
            })}
        </>
    );
}

function DetailsSection({ capturedInvoices }) {
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', locale: 'es-ES' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    const calculateDaysRemaining = (fechaCompra, plazoDias) => {
        const fechaCompraDate = new Date(fechaCompra);
        const fechaLimite = new Date(fechaCompraDate.getTime() + plazoDias * 24 * 60 * 60 * 1000);
        const fechaActual = new Date();
        const diffTime = fechaLimite - fechaActual;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { diffDays, fechaLimite };
    };

    return (
        <table className="w-full lg:w-[1200px] text-sm text-left text-[rgb(var(--color-text))] mx-auto">
            <thead className="text-xs text-[rgb(var(--color-text))] uppercase bg-[rgb(var(--color-card))]">
                <tr>
                    <th scope="col" className="p-1.5">No Factura</th>
                    <th scope="col" className="py-2 px-8">Proveedor</th>
                    <th scope="col" className="py-2 px-8">Plazo Días</th>
                    <th scope="col" className="py-2 px-8">Días Restantes</th>
                    <th scope="col" className="py-2 px-8">Fecha Compra</th>
                    <th scope="col" className="py-2 px-8">Fecha Límite</th>
                    <th scope="col" className="py-2 px-8">Descuento Total</th>
                    <th scope="col" className="py-2 px-8">Subtotal</th>
                    <th scope="col" className="py-2 px-8">Total</th>
                    <th scope="col" className="py-2 px-8">Opciones</th>
                </tr>
            </thead>
            <tbody>
            {capturedInvoices.map((invoice, index) => {
                const { diffDays, fechaLimite } = calculateDaysRemaining(invoice.fecha_compra, invoice.plazo_dias);
                return (
                    <tr
                        key={index}
                        className={`py-1 border border-b-stone-700 border-b-2 border-[rgb(var(--color-border))] ${diffDays <= 0 ? 'bg-[rgb(var(--color-error-base))]' : 'bg-[rgb(var(--color-card))]'}`}
                    >
                        <td className="py-1 px-6">{invoice.num_factura}</td>
                        <td className="py-1 px-6">{invoice.empresa}</td>
                        <td className="py-1 px-6">{invoice.plazo_dias} días</td>
                        <td className="py-1 px-6 font-semibold border-x border-gray-400 text-center">{diffDays > 0 ? `${diffDays} días restantes` : `Vencido hace ${Math.abs(diffDays)} días`}</td>
                        <td className="py-1 px-6">{formatDate(invoice.fecha_compra)}</td>
                        <td className="py-1 px-6">{formatDate(fechaLimite)}</td>
                        <td className="py-1 px-6">${invoice.descuento_total.toFixed(2)}</td>
                        <td className="py-1 px-6">${invoice.subtotal.toFixed(2)}</td>
                        <td className="py-1 px-6">${invoice.total.toFixed(2)}</td>
                        <td className="py-1 px-6">Editar</td>
                    </tr>
                );
            })}
            </tbody>
        </table>
    );
}

const createTooltip = (icon, label, id, visibleTooltip, setVisibleTooltip) => {
    const show = () => setVisibleTooltip(id);
    const hide = () => setVisibleTooltip(null);
    const tooltip = visibleTooltip === id ? (
        <div
        className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 opacity-90 bg-[rgb(var(--color-card))] shadow text-[rgb(var(--color-text))] text-xs rounded px-2 py-1 z-10"
            style={{ width: 'max-content', maxWidth: '16rem' }}
        >
            {label}
        </div>
    ) : null;

    return { show, hide, tooltip };
};

export default function Capture() {
    const [visibleTooltip, setVisibleTooltip] = useState(null);
    const [capturedInvoices, setCapturedInvoices] = useState([]);
    const [providers, setProviders] = useState([]);
    const [activeProvider, setActiveProvider] = useState(null);
    const [filteredProviders, setFilteredProviders] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState(null);
    const [isPolicy, setIsPolicy] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const findTooltip = createTooltip(FaSearch, 'Buscar factura', 'find', visibleTooltip, setVisibleTooltip);
    const buy = createTooltip(FaBox, 'Compras', 'buy', visibleTooltip, setVisibleTooltip);
    const policy = createTooltip(FaMoneyBillTransfer, 'Pólizas', 'policy', visibleTooltip, setVisibleTooltip);
    const add = createTooltip(FaChartColumn, 'Nueva captura', 'chart', visibleTooltip, setVisibleTooltip);

    const handleFilter = (filters) => {
        const { providerName, refaccion, dateRange } = filters;
        const filtered = providers.filter((provider) => {
            const matchesProvider = providerName
                ? provider.empresa.toLowerCase().includes(providerName.toLowerCase())
                : true;
            const matchesRefaccion = refaccion
                ? provider.refacciones.some((ref) =>
                    ref.toLowerCase().includes(refaccion.toLowerCase())
                )
                : true;
            const matchesDate =
                dateRange.start && dateRange.end
                    ? provider.invoices.some((invoice) => {
                        const invoiceDate = new Date(invoice.fecha_compra);
                        return (
                            invoiceDate >= new Date(dateRange.start) &&
                            invoiceDate <= new Date(dateRange.end)
                        );
                    })
                    : true;

            return matchesProvider && matchesRefaccion && matchesDate;
        });

        setFilteredProviders(filtered);
    };

    const handleProviderClick = (providerId) => {
        if (activeProvider === providerId) {
            setActiveProvider(null);
        } else {
            setActiveProvider(providerId);
        }
    };

    const onCancelEdit = () => {
        // Cancelar la edición o adiccion
        setIsEditing(false);
        setIsAdding(false);
        setIsPolicy(false);
    };

    const fetchInvoices = async () => {
        try {
            const response = await axios.get(buildApiUrl('/getInvoicesCaptured'));
            if (Array.isArray(response.data)) {
                setCapturedInvoices(response.data[0]);
            } else {
                setCapturedInvoices([]);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setError(error.message);
            setCapturedInvoices([]);
        }
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(buildApiUrl('/getAllProviders'));
            if (Array.isArray(response.data)) {
                setProviders(response.data);
            } else {
                setProviders([]);
            }
        } catch (error) {
            console.error('Error fetching providers:', error);
            setError(error.message);
            setProviders([]);
        }
    };

    useEffect(() => {
        fetchData();
        fetchInvoices();
    }, []);

    const total = capturedInvoices && capturedInvoices.length > 0 ? capturedInvoices.reduce((acc, item) => acc + parseFloat(item.total), 0) : 0;

    return (
        <div className="bg-gradient-to-b min-h-screen from-[rgb(var(--color-bg))] via-[rgb(var(--color-card))] to-[rgb(var(--color-gray))] backdrop-blur-md pt-28">
            <Title
                title='Reporte de compras'
                icon={HiClipboardDocumentList}
                back='Volver al panel'
                path='/productivity'
            />
            <div className={isEditing || isAdding ? 'hidden' : 'block'}>
                <div>
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-2">
                        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-6 lg:mx-0 lg:max-w-none">
                            <div className="relative h-[500px] 2xl:h-[650px] bg-[rgb(var(--color-bg))] rounded-2xl my-2 flex justify-center shadow">
                                <div className='flex flex-col px-1 bg-[rgb(var(--color-card))] rounded-l-2xl pt-5 relative w-16'>
                                    <div className='bg-[rgb(var(--color-card))] rounded-full shadow w-max absolute top-2 flex flex-col sm:ml-0.5'>
                                        <div
                                            className='relative p-3 m-1 rounded-full shadow hover:shadow-xl bg-amber-500 color-cultured cursor-pointer inline-block'
                                            onMouseEnter={buy.show}
                                            onMouseLeave={buy.hide}>
                                            <FaBox />
                                            {buy.tooltip}
                                        </div>
                                        <div
                                            className='gray-circle-button relative'
                                            onMouseEnter={policy.show}
                                            onMouseLeave={policy.hide}>
                                            <MdPolicy />
                                            {policy.tooltip}
                                        </div>
                                    </div>
                                    <div className='bg-[rgb(var(--color-card))] rounded-full shadow w-max absolute top-28 flex flex-col sm:ml-0.5'>
                                        <div
                                            className='green-circle-button relative'
                                            onMouseEnter={add.show}
                                            onMouseLeave={add.hide}
                                            onClick={() => setIsAdding(true)}
                                        >
                                            <MdOutlineWallet />
                                            {add.tooltip}
                                        </div>
                                        <div
                                            className='blue-circle-button relative'
                                            onClick={() => setIsModalOpen(true)}
                                            onMouseEnter={findTooltip.show}
                                            onMouseLeave={findTooltip.hide}>
                                            <FaSearch />
                                            {findTooltip.tooltip}
                                        </div>
                                        <FindFilter
                                            isOpen={isModalOpen}
                                            onClose={() => setIsModalOpen(false)}
                                            onFilter={handleFilter}
                                        />
                                    </div>
                                </div>
                                <div className='w-full h-full overflow-scroll'>
                                    {isPolicy ? (
                                        <PolicySections
                                            policy={providers}
                                            capturedPolicies={capturedInvoices}
                                            activeProvider={activeProvider}
                                            onProviderClick={handleProviderClick}
                                        />
                                    ):(
                                        <ProvidersSections
                                            providers={providers}
                                            capturedInvoices={capturedInvoices}
                                            activeProvider={activeProvider}
                                            onProviderClick={handleProviderClick}
                                    />
                                    )}
                                    <div
                                    className="relative text-3xl isolate flex items-left gap-x-6 overflow-hidden bg-[rgb(var(--color-card))] px-6 py-2.5 sm:px-3.5 sm:before:flex-1 m-2 text-[rgb(var(--color-text))] cursor-pointer rounded-xl shadow-md"
                                    >
                                        Total:
                                        <p
                                            className="flex-none rounded-full bg-green-600 px-3.5 py-1 text-xl font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                                        >
                                            $ {total.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={isEditing ? 'block' : 'hidden'}>
                <EditCaptue onCancelEdit={onCancelEdit}/>
            </div>
            <div className={isAdding ? 'block' : 'hidden'}>
                <NewCapture onCancelEdit={onCancelEdit} />
            </div>
        </div>
    );
}
