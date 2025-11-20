import { buildApiUrl } from '@/app/lib/refautomex-api';
import { FaArrowDown, FaArrowUp, FaSearch } from "react-icons/fa";
import { FaMoneyBillTransfer, FaBook, FaBox } from "react-icons/fa6";
import { GrStatusGoodSmall } from "react-icons/gr";
import { GiAutoRepair } from 'react-icons/gi';
import { useState, useEffect, Fragment } from 'react';
import { SlMagnifierRemove } from "react-icons/sl";
import FindFolio from './find-folio';
import Title from '../title';
import { upperCase } from 'lodash';

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

export default function Site() {
    const [visibleTooltip, setVisibleTooltip] = useState(null);
    const findTooltip = createTooltip(FaSearch, 'Buscar pedido', 'find', visibleTooltip, setVisibleTooltip);
    const findRevertTooltip = createTooltip(FaSearch, 'Quitar filtro', 'find', visibleTooltip, setVisibleTooltip);
    const order = createTooltip(FaBox, 'Pedidos', 'order', visibleTooltip, setVisibleTooltip);
    const history = createTooltip(FaMoneyBillTransfer, 'Historial', 'history', visibleTooltip, setVisibleTooltip);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [error, setError] = useState(null);
    const [expandedFolio, setExpandedFolio] = useState(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPartNumber, setCurrentPartNumber] = useState('');
    const [folioToChange, setFolioToChange] = useState('');
    const [idVenta, setIdVenta] = useState('');
    const [viewMode, setViewMode] = useState('P');
    const [isSearchingFolio, setIsSearchingFolio] = useState(false);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', locale: 'es-ES' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    const handleFilter = async ({ folio }) => {
        setIsSearchingFolio(true);

        try {
            const params = new URLSearchParams({ id: folio });
            const endpoint = `${buildApiUrl('/getFolioHistory')}?${params.toString()}`;
            const response = await fetch(endpoint, {
                cache: 'no-store',
                headers: { Accept: 'application/json, text/plain, */*' },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (Array.isArray(data) && data.length >= 2) {
                const pedidos = Array.isArray(data[0]) ? data[0] : [];
                const detalles = Array.isArray(data[1]) ? data[1] : [];
                const matchedPedido = pedidos.find(p => p.folio === folio);
                if (!matchedPedido) {
                    alert(`No se encontró ningún pedido con el folio ${folio}`);
                    return;
                }

                const detallesFiltrados = detalles.filter(d => String(d.idventa) === String(matchedPedido.idventa));

                setRequests([
                    {
                        ...matchedPedido,
                        idventa: matchedPedido.idventa || matchedPedido.idVenta,
                        details: detallesFiltrados
                    }
                ]);
            } else {
                alert(`No se encontraron datos con el folio ${folio}`);
                setRequests([]);
            }
        } catch (error) {
            console.error("Error al buscar por folio:", error);
            alert("Folio no encontrado.");
            setRequests([]);
        }
    };

    const handleChangeStatus = async (e) => {
        e.preventDefault();

        if (!selectedStatus) {
            alert('Por favor, selecciona un estado.');
            return;
        }

        const update_data = {
            folio: folioToChange,
            status: selectedStatus,
            idventa: idVenta,
            num_parte: currentPartNumber,
        };

        //console.log('Datos a actualizar:', update_data);

        try {
            const response = await fetch(buildApiUrl('/patchHistoryStatus'), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json, text/plain, */*',
                },
                body: JSON.stringify(update_data),
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Primero actualizamos el producto individual
            const updatedRequests = requests.map(request => {
                if (request.folio === folioToChange) {
                    const updatedDetails = request.details.map(detail => {
                        if (detail.num_parte === currentPartNumber) {
                            return { ...detail, status_producto: selectedStatus };
                        }
                        return detail;
                    });
                    // Verificar si todos los detalles están entregados
                    const allDelivered = updatedDetails.every(d => d.status_producto === 'E');
                    const newParentStatus = allDelivered ? 'F' : 'P';
                    return {
                        ...request,
                        status: newParentStatus,
                        details: updatedDetails
                    };
                }
                return request;
            });
            setRequests(updatedRequests);
        } catch (error) {
            console.error('Error actualizando el estado:', error);
            alert('Hubo un error al actualizar el estado. Intenta de nuevo.');
        }

        setIsStatusModalOpen(false);
    };

    const toggleDetails = (folio, idven) => {
        setExpandedFolio(expandedFolio === folio ? null : folio);
        setIdVenta(idven);
    };

    const handleOpenStatusModal = (status, folio, num_parte) => {
        const request = requests.find(req => req.folio === folio);
        const detail = request?.details.find(d => d.num_parte === num_parte);
        setSelectedStatus(detail?.status_producto || 'P');
        setFolioToChange(folio);
        setCurrentPartNumber(num_parte);
        setIdVenta(request?.idventa || request?.idVenta);
        setIsStatusModalOpen(true);
    };

    const fetchData = async () => {
        try {
            const response = await fetch(buildApiUrl('/getWebDelivery'), {
                cache: 'no-store',
                headers: { Accept: 'application/json, text/plain, */*' },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const payload = await response.json();
            if (Array.isArray(payload) && payload.length >= 2) {
                const pedidos = Array.isArray(payload[0]) ? payload[0] : [];
                const detalles = Array.isArray(payload[1]) ? payload[1] : [];
                const filteredPedidos = pedidos.filter(pedido => pedido.status === viewMode);

                const requests = filteredPedidos.map(pedido => {
                    const detallesFiltrados = detalles.filter(detalle => String(detalle.idventa) === String(pedido.idventa));
                    return {
                        ...pedido,
                        idventa: pedido.idventa || pedido.idVenta, // unify casing
                        details: detallesFiltrados.length ? detallesFiltrados : []
                    };
                });

                setRequests(requests);
            } else {
                console.error("Estructura inesperada de response.data:", response.data);
                setRequests([]);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            setError(error.message);
            setRequests([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, [viewMode]);

    return (
        <div className="bg-gradient-to-b min-h-screen from-[rgb(var(--color-bg))] via-[rgb(var(--color-card))] to-[rgb(var(--color-gray))] backdrop-blur-md pt-28">
            <Title
                title='Entregas a domicilio (STRIPE).'
                icon={GiAutoRepair}
                back='Volver al panel'
                path='/productivity'
            />
            <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-5 flex justify-center text-[rgb(var(--color-text))] text-xl items center uppercase font-semibold italic"></div>
                <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-5">
                    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-4 gap-y-3 lg:mx-0 lg:max-w-none">
                        <div className="relative h-[70vh] bg-[rgb(var(--color-bg))] rounded-2xl mb-5 flex justify-center shadow">
                            <div className='flex flex-col px-1 bg-[rgb(var(--color-card))] rounded-l-2xl pt-5 relative w-16'>
                            <div className='bg-[rgb(var(--color-card))] rounded-full shadow w-max absolute top-2 flex flex-col sm:ml-0.5'>
                                    {isSearchingFolio ? (
                                        <div
                                            className='muted-circle-button relative'
                                            onClick={() => {
                                                setIsSearchingFolio(false);
                                                fetchData();
                                            }}
                                            onMouseEnter={findRevertTooltip.show}
                                            onMouseLeave={findRevertTooltip.hide}>
                                            <SlMagnifierRemove />
                                            {findRevertTooltip.tooltip}
                                        </div>
                                    ):(
                                        <div
                                            className='blue-circle-button relative'
                                            onClick={() => setIsModalOpen(true)}
                                            onMouseEnter={findTooltip.show}
                                            onMouseLeave={findTooltip.hide}>
                                            <FaSearch />
                                            {findTooltip.tooltip}
                                        </div>
                                    )}

                                    <FindFolio
                                            isOpen={isModalOpen}
                                            onClose={() => setIsModalOpen(false)}
                                            onFilter={handleFilter}
                                    />
                                </div>
                                {!isSearchingFolio && (
                                    <div className='bg-[rgb(var(--color-card))] rounded-full shadow w-max absolute top-16 flex flex-col sm:ml-0.5'>
                                        <div
                                            className={`${viewMode === 'P'
                                            ? 'p-3 m-1 rounded-full shadow hover:shadow-xl bg-amber-500 color-cultured cursor-pointer inline-block'
                                            : 'gray-circle-button'} relative`}
                                            onMouseEnter={order.show}
                                            onMouseLeave={order.hide}
                                            onClick={() => setViewMode('P')}
                                        >
                                            <FaBox />
                                            {order.tooltip}
                                        </div>
                                        <div
                                            className={`${viewMode === 'F'
                                            ? 'p-3 m-1 rounded-full shadow hover:shadow-xl bg-amber-500 color-cultured cursor-pointer inline-block'
                                            : 'gray-circle-button'} relative`}
                                            onMouseEnter={history.show}
                                            onMouseLeave={history.hide}
                                            onClick={() => setViewMode('F')}
                                        >
                                            <FaBook />
                                            {history.tooltip}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className='w-full h-full overflow-scroll'>
                                <table className="w-full lg:w-[1155px] text-sm text-left text-[rgb(var(--color-text))] mx-auto">
                                    <thead className="text-xs text-[rgb(var(--color-text))] uppercase bg-[rgb(var(--color-card))] text-center">
                                        <tr>
                                            <th scope="col" className="p-1.5">STATUS</th>
                                            <th scope="col" className="py-2 px-8">FOLIO</th>
                                            <th scope="col" className="py-2 px-8">CLIENTE</th>
                                            <th scope="col" className="py-2 px-8">TOTAL</th>
                                            <th scope="col" className="py-2 px-8">ENTREGA</th>
                                            <th scope="col" className="py-2 px-8">DIA DE VENTA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                            {Array.isArray(requests) && requests.map((item, index) => (
                                            <Fragment key={item.folio || index}>
                                                <tr className="bg-[rgb(var(--color-bg))]" >
                                                    <td className="py-4 px-4 relative flex-col justify-center items-center flex">
                                                        <button
                                                            className="relative flex h-5 w-5"
                                                        >
                                                            <GrStatusGoodSmall className={`relative inline-flex rounded-full h-5 w-5 animate-pulse
                                                            ${item.status === 'P' ? 'text-[rgb(var(--color-amber))]'
                                                                : 'text-[rgb(var(--color-error))]'}`}
                                                            />
                                                        </button>
                                                        <span className={`
                                                            ${item.status === 'P' ? 'bg-[rgb(var(--color-amber))]'
                                                            : 'bg-[rgb(var(--color-error))]'}
                                                            text-sm text-[rgb(var(--color-text-base))] px-1  rounded-md mt-2`}
                                                        >
                                                            {item.status === 'P' ? 'Pedido'
                                                            : 'Finalizada'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-1 md:px-3 cursor-pointer font-medium bg-[rgb(var(--color-card))]"
                                                        onClick={() => toggleDetails(item.folio, item.idVenta)}
                                                    >
                                                        <div className='flex flex-col items-center text-[rgb(var(--color-text))]'>
                                                            <span className='font-semibold text-sm xl:text-lg truncate'>{item.folio}</span>
                                                            <span className='animate-out mt-2 rounded-full shadow shadow-[rgb(var(--color-galaxy))] text-[rgb(var(--color-text))] p-0.5'>
                                                                {expandedFolio === item.folio ? <FaArrowUp size={13}/> : <FaArrowDown size={13}/>}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-3 bg-[rgb(var(--color-gray))]">
                                                        <div className='flex flex-col items-center justify-center'>
                                                            <span className='text-lg text-[rgb(var(--color-text))]'>
                                                                {upperCase(item.nombre)}
                                                            </span>
                                                            <span className='font-bold text-[rgb(var(--color-text))]'>
                                                                {item.telefono}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 font-bold text-lg">
                                                        $ {item.total_venta}
                                                    </td>
                                                    <td className="py-4 px-2 m-1 cursor-pointer font-medium">
                                                        <span className='bg-[rgb(var(--color-error))] text-[rgb(var(--color-text-base))] lg:rounded-full p-1 flex flex-col items-center justify-center'>
                                                            {formatDate(item.f_entrega)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-2 m-1 cursor-pointer font-medium">
                                                        <span className='flex flex-col items-center justify-center'>
                                                            {formatDate(item.f_pedido)}
                                                        </span>
                                                    </td>
                                                </tr>
                                                {expandedFolio === item.folio && (
                                                    <tr className="bg-[rgb(var(--color-bg))]">
                                                        <td colSpan="7" className="py-1 pb-3 px-1">
                                                            <div>
                                                                <table className="w-full text-sm text-left text-[rgb(var(--color-text))] mt-2 shadow">
                                                                    <thead className="text-xs text-[rgb(var(--color-text))] uppercase bg-[rgb(var(--color-card))]">
                                                                        <tr>
                                                                            <th scope="col" className="py-2 px-4">STATUS</th>
                                                                            <th scope="col" className="py-2 px-4">NÚMERO DE PARTE</th>
                                                                            <th scope="col" className="py-2 px-4">DESCRIPCIÓN</th>
                                                                            <th scope="col" className="py-2 px-4">CANTIDAD</th>
                                                                            <th scope="col" className="py-2 px-4">PRECIO UNITARIO</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {item.details && item.details.map((detail, i) => (
                                                                            <tr key={i} className="bg-[rgb(var(--color-gray))] border-b border-[rgb(var(--color-border))]">
                                                                                <td className="p-4 relative flex-col justify-center items-center flex">
                                                                                    <button
                                                                                        className="relative flex h-5 w-5"
                                                                                        onClick={() => handleOpenStatusModal(item.status, item.folio, detail.num_parte)}
                                                                                    >
                                                                                        <GrStatusGoodSmall className={`relative inline-flex rounded-full h-5 w-5 animate-pulse
                                                                                        ${detail.status_producto === 'P' ? 'text-[rgb(var(--color-success))]'
                                                                                            : 'text-[rgb(var(--color-text))]'}`}
                                                                                        />
                                                                                    </button>
                                                                                    <span className={`
                                                                                        ${detail.status_producto === 'P' ? 'bg-[rgb(var(--color-success))]'
                                                                                        : 'bg-[rgb(var(--color-blue))]'}
                                                                                        text-sm text-[rgb(var(--color-text-base))] px-1 shadow rounded-md mt-2`}
                                                                                    >
                                                                                        {detail.status_producto === 'P' ? 'Pendiente'
                                                                                        : detail.status_producto === 'E' ? 'Entregado'
                                                                                        : 'Error en venta'}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-2 px-4">{detail.num_parte}</td>
                                                                                <td className="py-2 px-4 uppercase">{detail.descripcion ? detail.descripcion : detail.concepto_comodin}</td>
                                                                                <td className="py-2 px-4">{detail.cantidad}</td>
                                                                                <td className="py-2 px-4">$ {detail.precio_venta}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr className='bg-[rgb(var(--color-card))] border-[rgb(var(--color-border))] border-b-2'>
                                                    <td colSpan={9} className='text-lg font-semibold text-[rgb(var(--color-text))] pl-1'>NOTA: {upperCase(item.nota)}</td>
                                                </tr>
                                            </Fragment>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                {/**Modal para Status */}
                {isStatusModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--color-gray-base))]/60">
                        <div className="bg-[rgb(var(--color-bg))] p-6 rounded-lg shadow-lg w-80">
                            <h2 className="text-xl font-semibold mb-4 text-[rgb(var(--color-text))]">
                                ¿Cambiar status de
                                <br/>
                                {folioToChange}?
                            </h2>
                            <div className="mb-4">
                                <label htmlFor="status" className="block text-[rgb(var(--color-text))] mb-2">
                                    Cambia status del producto seleccionado:
                                </label>
                                <select
                                    id="status"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-[rgb(var(--color-border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                                >
                                    <option value="P">Pendiente</option>
                                    <option value="E">Entregado</option>
                                </select>
                            </div>
                            <div className='py-4 px-4 relative flex-col justify-center items-center flex'>
                                <span className="relative flex h-5 w-5"
                                >
                                    <GrStatusGoodSmall className={`relative inline-flex rounded-full h-5 w-5 animate-pulse
                                    ${selectedStatus === 'P' ? 'text-[rgb(var(--color-success))]'
                                    : 'text-[rgb(var(--color-blue))]'}`}
                                    /></span>
                                <span className={`text-sm text-[rgb(var(--color-text))] px-1 shadow rounded-md mt-2`}
                                >
                                    {selectedStatus === 'P' ? 'Pendiente'
                                    : 'Entregado'}
                                </span>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsStatusModalOpen(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleChangeStatus}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
}
