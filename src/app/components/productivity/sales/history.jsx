import axios from 'axios';
import { buildApiUrl } from '@/app/lib/refautomex-api';
import { useState, useEffect, Fragment } from 'react';
import Title from '../title';
import { MdSell } from "react-icons/md";
import { FaSearch } from "react-icons/fa";
import { FaMoneyBillTransfer, FaChartColumn } from "react-icons/fa6";
import { BiMoneyWithdraw } from 'react-icons/bi';
import { BiSolidUserCircle } from 'react-icons/bi';
import { GrStatusGoodSmall } from "react-icons/gr";
import { IoTicket } from "react-icons/io5";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { useTimeZoneContext } from '@/app/lib/time-zone-context';

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

export default function History() {
    const [visibleTooltip, setVisibleTooltip] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [imgError, setImgError] = useState(false);
    const [sales, setSales] = useState([]);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [idVenta, setVenta] = useState('');
    const [folio, setFolio] = useState('');
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [folioToChange, setFolioToChange] = useState('');
    const [expandedFolio, setExpandedFolio] = useState(null);
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;

    const findTooltip = createTooltip(FaSearch, 'Buscar ticket', 'find', visibleTooltip, setVisibleTooltip);
    const withdrawTooltip = createTooltip(BiMoneyWithdraw, 'Solicitar retiro', 'withdraw', visibleTooltip, setVisibleTooltip);
    const historyTooltip = createTooltip(FaMoneyBillTransfer, 'Entradas y salidas', 'history', visibleTooltip, setVisibleTooltip);
    const chartTooltip = createTooltip(FaChartColumn, 'Gráfico por años', 'chart', visibleTooltip, setVisibleTooltip);

    const formatDate = (dateInput, timeZone) => {
        if (!dateInput) return "Fecha no disponible";

        let date;
        if (typeof dateInput === "string") {
            const [year, month, day] = dateInput.split("-");
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(dateInput);
        }

        if (isNaN(date.getTime())) {
            console.error("Fecha inválida recibida:", dateInput);
            return "Fecha inválida";
        }

        return new Intl.DateTimeFormat("es-MX", {
            timeZone,
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
        }).format(date);
    };

    const timeZone = useTimeZoneContext();
    // Aplicamos la zona horaria detectada en toda la app
    const formattedCurrentDate = formatDate(currentDate, timeZone);

    const fetchData = async (date, idVenta) => {
        setError(null);
        try {
            // Convertir la fecha a `YYYY-MM-DD` asegurando que sea un string
            const formattedDate = typeof date === "string"
                ? date
                : new Intl.DateTimeFormat("es-MX", {
                    timeZone,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                }).format(new Date(date)).split('/').reverse().join('-'); // Convierte `DD/MM/YYYY` a `YYYY-MM-DD`

            const response = await axios.get(buildApiUrl('/getHistory'), {
                params: { id: formattedDate, idVenta },
            });

            if (Array.isArray(response.data)) {
                setSales(response.data);
            } else {
                setSales([]);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
            setError(error.message);
            setSales([]);
        }
    };

    useEffect(() => {
        if (timeZone) {
            fetchData(currentDate, idVenta);
        }
    }, [currentDate, idVenta, timeZone]);

    useEffect(() => {
        if (sales && sales.length > 0) {
            const id = sales[0].idusuario;
            const imageUrl = `${multimediaSrc}usr/${id}.jpg`;
            const image = new Image();
            image.src = imageUrl;
            image.onload = () => setImgError(false);
            image.onerror = () => setImgError(true);
        }
    }, [sales, multimediaSrc]);

    const handleSearch = () => {
        setCurrentDate(selectedDate);
        setIsModalOpen(false);
    };

    const total = sales && sales.length > 0
    ? sales
        .filter((item) => item.status === 'A') // Filtra solo las ventas activas
        .reduce((acc, item) => acc + parseFloat(item.total_venta || 0), 0)
    : 0;

    const toggleDetails = (folio, idVenta) => {
        setExpandedFolio(expandedFolio === folio ? null : folio);
        setVenta(idVenta);
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
        };

        try {
            const response = await axios.patch(buildApiUrl('/patchSaleStatus'), update_data, {
                headers: { 'Content-Type': 'application/json' },
            });
            if(response){

                setSales((prevSales) =>
                    prevSales.map((sale) =>
                        sale.folio === folioToChange ? { ...sale, status: selectedStatus } : sale
                    )
                );
            }
        } catch (error) {
            console.error('Error actualizando el estado:', error);
            alert('Hubo un error al actualizar el estado. Intenta de nuevo.');
        }

        setIsStatusModalOpen(false);
    };

    const handleOpenStatusModal = (status, folio) => {
        setSelectedStatus(status);
        setFolioToChange(folio);
        setIsStatusModalOpen(true);
    };

    return (
        <div className="bg-gradient-to-b min-h-screen from-[rgb(var(--color-bg))] via-[rgb(var(--color-card))] to-[rgb(var(--color-gray))] backdrop-blur-md pt-28">
            <Title
                title='Histórico de ventas'
                icon={MdSell}
                back='Volver al panel'
                path='/productivity'
            />
            <div>
                <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-5 flex justify-center text-[rgb(var(--color-text))] text-xl items center uppercase font-semibold italic">
                    {formatDate(currentDate, timeZone)}
                </div>
                <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-5">
                    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-6 lg:mx-0 lg:max-w-none">
                        <div className="relative h-[470px] bg-[rgb(var(--color-card))] rounded-2xl my-5 flex justify-center shadow">
                            <div className='flex flex-col px-1 bg-[rgb(var(--color-card))] rounded-l-2xl pt-5'>
                                <div
                                    className='blue-circle-button relative'
                                    onClick={() => setIsModalOpen(true)}
                                    onMouseEnter={findTooltip.show}
                                    onMouseLeave={findTooltip.hide}>
                                    <FaSearch />
                                    {findTooltip.tooltip}
                                </div>
                                <div
                                    className='gray-circle-button relative'
                                    onMouseEnter={withdrawTooltip.show}
                                    onMouseLeave={withdrawTooltip.hide}>
                                    <BiMoneyWithdraw />
                                    {withdrawTooltip.tooltip}
                                </div>
                                <div
                                    className='green-circle-button relative'
                                    onMouseEnter={historyTooltip.show}
                                    onMouseLeave={historyTooltip.hide}>
                                    <FaMoneyBillTransfer />
                                    {historyTooltip.tooltip}
                                </div>
                                <div
                                    className='relative p-3 m-1 rounded-full shadow hover:shadow-xl bg-amber-500 color-cultured cursor-pointer inline-block'
                                    onMouseEnter={chartTooltip.show}
                                    onMouseLeave={chartTooltip.hide}>
                                    <FaChartColumn />
                                    {chartTooltip.tooltip}
                                </div>
                            </div>
                            <div className='w-full h-full overflow-scroll'>
                                {!sales || sales.length === 0 ? (
                                    <div className="flex justify-center items-center h-full text-[rgb(var(--color-text))]">
                                        No se encontraron registros para la fecha listada.
                                    </div>
                                ) : (
                                    <table className="w-full lg:w-[1200px] text-sm text-left text-[rgb(var(--color-text))] mx-auto">
                                        <thead className="text-xs text-[rgb(var(--color-text))] uppercase bg-[rgb(var(--color-card))] text-center">
                                            <tr>
                                                <th scope="col" className="p-1.5">STATUS</th>
                                                <th scope="col" className="py-2 px-8">FOLIO</th>
                                                <th scope="col" className="py-2 px-8">TOTAL</th>
                                                <th scope="col" className="py-2 px-8">EMPLEADO</th>
                                                <th scope="col" className="py-2 px-8">ACCION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.isArray(sales) && sales.map((item, index) => (
                                                <Fragment key={item.folio || index}>
                                                    <tr className="bg-[rgb(var(--color-card))] border-b border-[rgb(var(--color-border))]">
                                                        <td className="py-4 px-4 relative flex-col justify-center items-center flex">
                                                            <button
                                                                className="relative flex h-5 w-5"
                                                                onClick={() => handleOpenStatusModal(item.status, item.folio)}
                                                            >
                                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                                                                ${item.status === 'A' ? 'bg-green-500'
                                                                    : item.status === 'C' ? 'bg-red-500'
                                                                    : item.status === 'D' ? 'bg-amber-500'
                                                                    : 'bg-blue-500'}`}
                                                                ></span>
                                                                <GrStatusGoodSmall className={`relative inline-flex rounded-full h-5 w-5
                                                                ${item.status === 'A' ? 'text-green-500'
                                                                    : item.status === 'C' ? 'text-red-500'
                                                                    : item.status === 'D' ? 'text-amber-500'
                                                                    : 'text-blue-500'}`}
                                                                />
                                                            </button>
                                                            <span className={`
                                                                ${item.status === 'A' ? 'bg-[rgb(var(--color-success))]'
                                                                : item.status === 'C' ? 'bg-[rgb(var(--color-error))]'
                                                                : item.status === 'D' ? 'bg-[rgb(var(--color-amber))]'
                                                                : 'bg-blue-200'}
                                                                text-sm text-[rgb(var(--color-text-base))] px-1 shadow rounded-md mt-2`}
                                                            >
                                                                {item.status === 'A' ? 'Activa'
                                                                : item.status === 'C' ? 'Cancelada'
                                                                : item.status === 'D' ? 'Devuelta'
                                                                : 'Error en venta'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-3 cursor-pointer font-medium bg-[rgb(var(--color-galaxy))] text-center"
                                                            onClick={() => toggleDetails(item.folio, item.idVenta)}
                                                        >
                                                            <div className='flex flex-col items-center'>
                                                                <span className='font-semi text-xs xl:text-lg truncate'>{item.folio}</span>
                                                                <span className='animate-out mt-2 rounded-full shadow border border-slate-700 p-0.5'>
                                                                    {expandedFolio === item.folio ? <FaArrowUp size={13}/> : <FaArrowDown size={13}/>}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-8 font-bold text-lg">
                                                            <div className='flex flex-col items-center'>
                                                                <span>
                                                                    $ {item.total_venta}
                                                                </span>
                                                                <span className='bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))] rounded-xl px-2 mx-2 text-xs shadow bottom-1 left-5'>
                                                                    {item.metodopago}
                                                                </span>
                                                            </div>

                                                        </td>
                                                        <td className="py-4 px-8 relative flex flex-1 justify-center items-center">
                                                            <div className="absolute left-0 translate-y-2.5 translate-x-6 lg:-translate-x-4 top-1/4 mx-3 text-md xl:text-lg leading-6 xl:pr-1 flex rounded-3xl justify-center items-center shadow text-[rgb(var(--color-text))] bg-[rgb(var(--color-card))] cursor-pointer">
                                                                {!imgError && item.idusuario ? (
                                                                    <div className="flex h-9 w-9 items-center justify-center bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-card-white))] hover:border-[rgb(var(--color-amber))] animate-out shadow-lg rounded-full overflow-hidden">
                                                                        <img src={`${multimediaSrc}usr/${item.idusuario}.jpg`} onError={() => setImgError(true)} className="w-full h-full object-cover bg-gray-50" />
                                                                    </div>
                                                                ) : (
                                                                    <BiSolidUserCircle className="w-6 h-6 rounded-full shadow-xl border border-indigo-100 my-auto animate-out" />
                                                                )}
                                                                <div className='ml-1.5 mr-2 text-sm italic hidden lg:block'>
                                                                    {item.empleado}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-3 text-center">
                                                            <span className='relative p-2 m-1 rounded-full shadow hover:shadow-xl bg-amber-500 color-cultured cursor-pointer inline-block'>
                                                                <IoTicket/>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    {expandedFolio === item.folio && (
                                                        <tr className="bg-[rgb(var(--color-card))]">
                                                            <td colSpan="6" className="py-1 pb-3 px-1">
                                                                <div>
                                                                    <table className="w-full text-sm text-left text-[rgb(var(--color-text))] mt-2 shadow">
                                                                        <thead className="text-xs text-[rgb(var(--color-text))] uppercase bg-[rgb(var(--color-card))]">
                                                                            <tr>
                                                                                <th scope="col" className="py-2 px-4">NÚMERO DE PARTE</th>
                                                                                <th scope="col" className="py-2 px-4">DESCRIPCIÓN</th>
                                                                                <th scope="col" className="py-2 px-4">CANTIDAD</th>
                                                                                <th scope="col" className="py-2 px-4">PRECIO UNITARIO</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {item.details && item.details.map((detail, i) => (
                                                                                <tr key={`${detail.num_parte || 'detail'}-${i}`} className="bg-[rgb(var(--color-bg))] border-b border-[rgb(var(--color-border))]">
                                                                                    <td className="py-2 px-4">{detail.num_parte}</td>
                                                                                    <td className="py-2 px-4 uppercase">{detail.descripcion ? detail.descripcion : detail.concepto_comodin}</td>
                                                                                    <td className="py-2 px-4">{detail.cantidad}</td>
                                                                                    <td className="py-2 px-4">$ {detail.precio_venta}</td>
                                                                                </tr>
                                                                            ))}
                                                                            <tr className='bg-[rgb(var(--color-galaxy))]'>
                                                                                <td className="py-2 px-4 text-[rgb(var(--color-text))]"> NOTA: {item.nota}</td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            ))}
                                            <tr className="bg-[rgb(var(--color-card))] border-b border-[rgb(var(--color-border))]">
                                                <td className="py-4 px-6 font-bold" colSpan="3">TOTAL:</td>
                                                <td className="py-4 px-6 font-bold text-lg text-[rgb(var(--color-text))]" colSpan="2">$ {total.toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/*Modal para Buscar */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.6)]">
                    <div className="bg-[rgb(var(--color-card-white))] p-6 rounded-lg shadow-lg w-80">
                        <h2 className="text-xl font-semibold mb-4 text-[rgb(var(--color-text))]">Buscar en histórico</h2>
                        <div className="mb-4">
                            <label htmlFor="startDate" className="block text-[rgb(var(--color-text))] mb-2">Fecha:</label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                max={new Date().toISOString().split('T')[0]}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-3 py-2 border border-[rgb(var(--color-border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="folio" className="block text-[rgb(var(--color-text))] mb-2">Folio:</label>
                            <input
                                type="text"
                                id="folio"
                                name="folio"
                                value={folio}
                                onChange={(e) => setFolio(e.target.value)}
                                className="w-full px-3 py-2 border border-[rgb(var(--color-border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                                placeholder="Ingrese el número de folio"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSearch}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
                            >
                                <FaSearch className="mr-2" /> Buscar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/**Modal para Status */}
            {isStatusModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.6)]">
                    <div className="bg-[rgb(var(--color-card))] p-6 rounded-lg shadow-lg w-80">
                        <h2 className="text-xl font-semibold mb-4 text-[rgb(var(--color-text))]">
                            ¿Cambiar status de
                            <br/>
                            {folioToChange}?
                        </h2>
                        <div className="mb-4">
                            <label htmlFor="status" className="block text-[rgb(var(--color-text))] mb-2">
                                Selecciona el nuevo status:
                            </label>
                            <select
                                id="status"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-[rgb(var(--color-border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))]"
                            >
                                <option value="A">Activa</option>
                                <option value="C">Cancelada</option>
                                <option value="D">Devuelta</option>
                                <option value="E">Error en venta</option>
                            </select>
                        </div>
                        <div className='py-4 px-4 relative flex-col justify-center items-center flex'>
                            <span className="relative flex h-5 w-5"
                            >
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                                ${selectedStatus === 'A' ? 'bg-green-500'
                                : selectedStatus === 'C' ? 'bg-red-500'
                                : selectedStatus === 'D' ? 'bg-amber-500'
                                : 'bg-blue-500'}`}
                                ></span>
                                <GrStatusGoodSmall className={`relative inline-flex rounded-full h-5 w-5
                                ${selectedStatus === 'A' ? 'text-green-500'
                                : selectedStatus === 'C' ? 'text-red-500'
                                : selectedStatus === 'D' ? 'text-amber-500'
                                : 'text-blue-500'}`}
                                /></span>
                            <span className={`
                                ${selectedStatus === 'A' ? 'bg-green-200'
                                : selectedStatus === 'C' ? 'bg-red-200'
                                : selectedStatus === 'D' ? 'bg-amber-200'
                                : 'bg-blue-200'}
                                text-sm text-[rgb(var(--color-text-base))] px-1 shadow rounded-md mt-2`}
                            >
                                {selectedStatus === 'A' ? 'Activa'
                                : selectedStatus === 'C' ? 'Cancelada'
                                : selectedStatus === 'D' ? 'Devuelta'
                                : 'Error en venta'}
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
