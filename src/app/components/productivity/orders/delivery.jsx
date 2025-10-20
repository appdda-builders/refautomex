import axios from 'axios';
import { FaArrowDown, FaArrowUp, FaSearch } from "react-icons/fa";
import { FaMoneyBillTransfer, FaBook, FaBox } from "react-icons/fa6";
import { GrStatusGoodSmall } from "react-icons/gr";
import { GiAutoRepair } from 'react-icons/gi';
import { useState, useEffect } from 'react';
import FindFolio from './find-folio';
import Title from '../title';
import { upperCase } from 'lodash';

const createTooltip = (icon, label, id, visibleTooltip, setVisibleTooltip) => {
    const show = () => setVisibleTooltip(id);
    const hide = () => setVisibleTooltip(null);
    const tooltip = visibleTooltip === id ? (
        <div
            className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 opacity-90 dark:bg-gray-900 bg-gray-300 shadow dark:text-white text-black text-xs rounded px-2 py-1 z-10"
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
    const [viewMode, setViewMode] = useState('P'); // Estado para alternar entre pedidos (P) e historial (F)

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', locale: 'es-ES' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    const handleFilter = async (folio) => {
        alert(`Busca folio: ${folio}`);
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

        try {
            // Envía la solicitud para actualizar el estado en la base de datos
            const response = await axios.patch(`/api/dataManage?type=patchWebStatus`, update_data, {
                headers: { 'Content-Type': 'application/json' },
            });
            if(response){
                // Actualiza dinámicamente el estado de la venta en la lista
                setRequests(requests.map(request => {
                    if (request.folio === folioToChange) {
                        const updatedDetails = request.details.map(detail => {
                            if (detail.num_parte === currentPartNumber) {
                                return { ...detail, status_producto: selectedStatus };
                            }
                            return detail;
                        });
                        return { ...request, details: updatedDetails };
                    }
                    return request;
                }));
            }
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
        setSelectedStatus(status);
        setFolioToChange(folio);
        setCurrentPartNumber(num_parte);
        setIsStatusModalOpen(true);
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(`/api/dataManage?type=getWebDelivery`);
            if (Array.isArray(response.data) && response.data.length >= 2) {
                const pedidos = Array.isArray(response.data[0]) ? response.data[0] : [];
                const detalles = Array.isArray(response.data[1]) ? response.data[1] : [];
                const filteredPedidos = pedidos.filter(pedido => pedido.status === viewMode);

                const requests = filteredPedidos.map(pedido => {
                    const detallesFiltrados = detalles.filter(detalle => String(detalle.idventa) === String(pedido.idventa));
                    return {
                        ...pedido,
                        details: detallesFiltrados.length ? detallesFiltrados : []
                    };
                });

                console.log('Pedidos:', pedidos);
                console.log('Detalles:', detalles);
                console.log('Pedidos filtrados:', requests);

                setRequests(pedidos);
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
        <div className="bg-gradient-to-b min-h-screen from-white via-gray-100 to-gray-400 dark:from-black dark:via-slate-800 dark:to-stone-700 backdrop-blur-md pt-28">
            <Title
                title='Entregas A Domicilio'
                icon={GiAutoRepair}
                back='Volver al panel'
                path='/productivity'
            />
            <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-5 flex justify-center dark:text-blue-200 text-amber-900 text-xl items center uppercase font-semibold italic"></div>
                <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-5">
                    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-6 lg:mx-0 lg:max-w-none">
                        <div className="relative h-[470px] bg-gray-200 dark:bg-stone-800 rounded-2xl my-5 flex justify-center shadow">
                            <div className='flex flex-col px-1 bg-gray-300 dark:bg-stone-900 rounded-l-2xl pt-5 relative w-16'>
                                <div className='bg-slate-100 dark:bg-stone-600 rounded-full shadow w-max absolute top-2 flex flex-col sm:ml-0.5'>
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
                                <div className='bg-amber-100 dark:bg-violet-800 rounded-full shadow w-max absolute top-28 flex flex-col sm:ml-0.5'>
                                    <div
                                        className='blue-circle-button relative'
                                        onClick={() => setIsModalOpen(true)}
                                        onMouseEnter={findTooltip.show}
                                        onMouseLeave={findTooltip.hide}>
                                        <FaSearch />
                                        {findTooltip.tooltip}
                                    </div>
                                    <FindFolio
                                            isOpen={isModalOpen}
                                            onClose={() => setIsModalOpen(false)}
                                            onFilter={handleFilter}
                                    />
                                </div>
                            </div>
                            <div className='w-full h-full overflow-scroll'>
                                <table className="w-full lg:w-[1200px] text-sm text-left text-gray-500 dark:text-gray-400 mx-auto">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 text-center">
                                        <tr>
                                            <th scope="col" className="p-1.5">STATUS</th>
                                            <th scope="col" className="py-2 px-8">FOLIO</th>
                                            <th scope="col" className="py-2 px-8">CLIENTE</th>
                                            <th scope="col" className="py-2 px-8">TOTAL</th>
                                            <th scope="col" className="py-2 px-8">ENREGAR EL</th>
                                            <th scope="col" className="py-2 px-8">DIA DE VENTA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                            {Array.isArray(requests) && requests.map((item, index) => (
                                            <>
                                                <tr className="bg-white dark:bg-gray-800  border-gray-700 dark:border-gray-200 border-b-2" >
                                                    <td className="py-4 px-4 relative flex-col justify-center items-center flex">
                                                        <button
                                                            className="relative flex h-5 w-5"
                                                        >
                                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                                                                ${item.tracking_web === 'P' ? 'bg-yellow-500'
                                                                : 'bg-red-500'}`}
                                                            ></span>
                                                            <GrStatusGoodSmall className={`relative inline-flex rounded-full h-5 w-5
                                                            ${item.tracking_web === 'P' ? 'text-yellow-500'
                                                                : 'text-red-500'}`}
                                                            />
                                                        </button>
                                                        <span className={`
                                                            ${item.tracking_web === 'P' ? 'bg-yellow-200 dark:bg-yellow-700'
                                                            : 'bg-red-200 dark:bg-red-500'}
                                                            text-sm dark:text-white px-1 shadow rounded-md mt-2`}
                                                        >
                                                            {item.tracking_web === 'P' ? 'Pendiente'
                                                            : 'Finalizada'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-3 cursor-pointer font-medium bg-amber-100 dark:bg-indigo-900 dark:text-white"
                                                        onClick={() => toggleDetails(item.folio, item.idVenta)}
                                                    >
                                                        <div className='flex flex-col items-center'>
                                                            <span className='font-semi text-xs xl:text-lg truncate'>{item.folio}</span>
                                                            <span className='animate-out mt-2 rounded-full shadow border border-slate-700 dark:border-slate-100 p-0.5'>
                                                                {expandedFolio === item.folio ? <FaArrowUp size={13}/> : <FaArrowDown size={13}/>}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-3 bg-amber-50 dark:bg-blue-900 dark:text-white">
                                                        <div className='flex flex-col items-center justify-center'>
                                                            <span className='text-lg'>
                                                                {upperCase(item.nombre)}
                                                            </span>
                                                            <span className='font-bold'>
                                                                {item.telefono}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 font-bold text-lg">
                                                        $ {item.total_venta}
                                                    </td>
                                                    <td className="py-4 px-2 m-1 cursor-pointer font-medium dark:text-white ">
                                                        <span className='bg-red-100 dark:bg-red-900 rounded-full p-1 flex flex-col items-center justify-center'>
                                                            {formatDate(item.f_entrega)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-2 m-1 cursor-pointer font-medium dark:text-white">
                                                        <span className='flex flex-col items-center justify-center'>
                                                            {formatDate(item.f_pedido)}
                                                            <br />
                                                            {item.idventa}
                                                        </span>
                                                    </td>
                                                </tr>
                                                {expandedFolio === item.folio && (
                                                    <tr className="bg-gray-100 dark:bg-gray-700">
                                                        <td colSpan="7" className="py-1 pb-3 px-1">
                                                            <div>
                                                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 mt-2 shadow">
                                                                    <thead className="text-xs text-gray-700 dark:text-white uppercase bg-gray-300 dark:bg-gray-600">
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
                                                                            <tr key={i} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                                                                <td className="p-4 relative flex-col justify-center items-center flex">
                                                                                    <button
                                                                                        className="relative flex h-5 w-5"
                                                                                        onClick={() => handleOpenStatusModal(item.status, item.folio, detail.num_parte)}
                                                                                    >
                                                                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                                                                                        ${detail.status_producto === 'P' ? 'bg-green-500'
                                                                                            : 'bg-blue-500'}`}
                                                                                        ></span>
                                                                                        <GrStatusGoodSmall className={`relative inline-flex rounded-full h-5 w-5
                                                                                        ${detail.status_producto === 'P' ? 'text-green-500'
                                                                                            : 'text-blue-500'}`}
                                                                                        />
                                                                                    </button>
                                                                                    <span className={`
                                                                                        ${detail.status_producto === 'P' ? 'bg-green-200 dark:bg-green-700'
                                                                                        : 'bg-blue-200 dark:bg-blue-700'}
                                                                                        text-sm dark:text-white px-1 shadow rounded-md mt-2`}
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
                                            </>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                {/**Modal para Status */}
                {isStatusModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black opacity-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-80">
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                                ¿Cambiar status de
                                <br/>
                                {folioToChange}?
                            </h2>
                            <div className="mb-4">
                                <label htmlFor="status" className="block text-gray-700 dark:text-gray-300 mb-2">
                                    Cambia status del producto seleccionado:
                                </label>
                                <select
                                    id="status"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="P">Pendiente</option>
                                    <option value="E">Entregado</option>
                                </select>
                            </div>
                            <div className='py-4 px-4 relative flex-col justify-center items-center flex'>
                                <span className="relative flex h-5 w-5"
                                >
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                                    ${selectedStatus === 'P' ? 'bg-green-500'
                                    : 'bg-blue-500'}`}
                                    ></span>
                                    <GrStatusGoodSmall className={`relative inline-flex rounded-full h-5 w-5
                                    ${selectedStatus === 'P' ? 'text-green-500'
                                    : 'text-blue-500'}`}
                                    /></span>
                                <span className={`
                                    ${selectedStatus === 'P' ? 'bg-green-200 dark:bg-green-700'
                                    : 'bg-blue-200 dark:bg-blue-700'}
                                    text-sm dark:text-white px-1 shadow rounded-md mt-2`}
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