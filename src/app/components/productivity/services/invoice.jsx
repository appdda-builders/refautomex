import axios from 'axios';
import { buildApiUrl } from '@/app/lib/refautomex-api';
import { useState, useEffect } from 'react';
import Title from '../title';
import { FaUsersViewfinder } from 'react-icons/fa6';
import { FaSearch } from "react-icons/fa";
import { IoMdCloudDone } from "react-icons/io";
import { BiSolidUserCircle } from 'react-icons/bi';
import { GrStatusGoodSmall } from "react-icons/gr";
import { GoClockFill } from "react-icons/go";
import { IoTicket } from "react-icons/io5";

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

export default function Invoice() {
    const [visibleTooltip, setVisibleTooltip] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [imgError, setImgError] = useState(false);
    const [sales, setSales] = useState([]);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [folio, setFolio] = useState('');
    const [expandedFolio, setExpandedFolio] = useState(null);
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;

    const findTooltip = createTooltip(FaSearch, 'Buscar ticket', 'find', visibleTooltip, setVisibleTooltip);
    const pending = createTooltip(GoClockFill, 'Pendientes', 'pending', visibleTooltip, setVisibleTooltip);
    const finished = createTooltip(IoMdCloudDone, 'Finalizadas', 'finished', visibleTooltip, setVisibleTooltip);

    const fetchData = async (date, folio) => {
        setError(null);
        try {
            const formattedDate = typeof date === 'string' ? date : date.toISOString().split('T')[0];
            const response = await axios.get(buildApiUrl('/getHistory'), {
                params: { id: formattedDate, folio },
            });
            if (Array.isArray(response.data)) {
                setSales(response.data);
            } else {
                setSales([]);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            setError(error.message);
            setSales([]);
        }
    };

    useEffect(() => {
        fetchData(currentDate, folio);
    }, [currentDate, folio]);

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

    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('es-MX', options);
    };

    const total = sales && sales.length > 0 ? sales.reduce((acc, item) => acc + parseFloat(item.total_venta), 0) : 0;

    const toggleDetails = (folio) => {
        setExpandedFolio(expandedFolio === folio ? null : folio);
    };

    return (
        <div className="bg-gradient-to-b min-h-screen from-white via-gray-100 to-gray-400 dark:from-black dark:via-slate-800 dark:to-stone-700 backdrop-blur-md pt-28">
            <Title
                title='Facturación a clientes'
                icon={FaUsersViewfinder}
                back='Volver al panel'
                path='/productivity'
            />
            <div>
                <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-5 flex justify-center dark:text-blue-200 text-amber-900 text-xl items center uppercase font-semibold italic">{formatDate(currentDate)}</div>
                <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-5">
                    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-6 lg:mx-0 lg:max-w-none">
                        <div className="relative h-[470px] bg-gray-200 dark:bg-stone-800 rounded-2xl my-5 flex justify-center shadow">
                            <div className='flex flex-col px-1 bg-gray-300 dark:bg-stone-900 rounded-l-2xl pt-5'>
                                <div
                                    className='blue-circle-button relative'
                                    onClick={() => setIsModalOpen(true)}
                                    onMouseEnter={findTooltip.show}
                                    onMouseLeave={findTooltip.hide}>
                                    <FaSearch />
                                    {findTooltip.tooltip}
                                </div>
                                <div
                                    className='relative p-3 m-1 rounded-full shadow hover:shadow-xl bg-amber-500 color-cultured cursor-pointer inline-block'
                                    onMouseEnter={pending.show}
                                    onMouseLeave={pending.hide}>
                                    <GoClockFill />
                                    {pending.tooltip}
                                </div>
                                <div
                                    className='green-circle-button relative'
                                    onMouseEnter={finished.show}
                                    onMouseLeave={finished.hide}>
                                    <IoMdCloudDone />
                                    {finished.tooltip}
                                </div>
                            </div>
                            <div className='w-full h-full overflow-scroll'>
                                {!sales || sales.length === 0 ? (
                                    <div className="flex justify-center items-center h-full text-gray-700 dark:text-gray-200">
                                        ¡No hay facturas pendientes!
                                    </div>
                                ) : (
                                    <table className="w-full lg:w-[1200px] text-sm text-left text-gray-500 dark:text-gray-400 mx-auto">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
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
                                                <>
                                                    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700" key={index}>
                                                        <td className="py-4 px-5 relative">
                                                            <span className="relative flex h-5 w-5">
                                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${item.status === 'A' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                                <GrStatusGoodSmall className={`relative inline-flex rounded-full h-5 w-5 ${item.status === 'A' ? 'text-green-500' : 'text-red-500'}`}/>
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-5 m-1 cursor-pointer font-medium bg-amber-100 dark:bg-indigo-900 dark:text-white" onClick={() => toggleDetails(item.folio)}>
                                                            {item.folio}
                                                        </td>
                                                        <td className="py-4 px-8 font-bold text-lg">$ {item.total_venta}</td>
                                                        <td className="py-4 px-8 relative flex justify-center items-center">
                                                            <div className="absolute left-0 translate-y-2.5 translate-x-6 lg:-translate-x-4 top-1/4 mx-3 text-md xl:text-lg leading-6 xl:pr-1 flex rounded-3xl justify-center items-center shadow dark:shadow-slate-100/10 dark:text-white bg-white dark:bg-slate-300/10 cursor-pointer">
                                                                {!imgError && item.idusuario ? (
                                                                    <div className="flex h-9 w-9 items-center justify-center bg-slate-50 dark:bg-stone-900 border border-slate-300 dark:border-stone-600 hover:bg-slate-100 hover:border-amber-300 dark:hover:border-amber-400 animate-out shadow-lg rounded-full overflow-hidden">
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
                                                        <td className="py-4 px-3">
                                                            <span className='relative p-2 m-1 rounded-full shadow hover:shadow-xl bg-amber-500 color-cultured cursor-pointer inline-block'>
                                                                <IoTicket/>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    {expandedFolio === item.folio && (
                                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                                            <td colSpan="6" className="py-1 pb-3 px-1">
                                                                <div>
                                                                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 mt-2 shadow">
                                                                        <thead className="text-xs text-gray-700 dark:text-white uppercase bg-gray-300 dark:bg-gray-600">
                                                                            <tr>
                                                                                <th scope="col" className="py-2 px-4">NÚMERO DE PARTE</th>
                                                                                <th scope="col" className="py-2 px-4">DESCRIPCIÓN</th>
                                                                                <th scope="col" className="py-2 px-4">CANTIDAD</th>
                                                                                <th scope="col" className="py-2 px-4">PRECIO</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {item.details && item.details.map((detail, i) => (
                                                                                <tr key={i} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                                                                    <td className="py-2 px-4">{detail.num_parte}</td>
                                                                                    <td className="py-2 px-4">{detail.descripcion}</td>
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
                                            <tr className="bg-stone-200 border-b dark:bg-stone-600 dark:border-gray-700">
                                                <td className="py-4 px-6 font-bold" colSpan="3">TOTAL:</td>
                                                <td className="py-4 px-6 font-bold text-lg dark:text-white text-black" colSpan="2">$ {total.toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black opacity-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-80">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Buscar en histórico</h2>
                        <div className="mb-4">
                            <label htmlFor="startDate" className="block text-gray-700 dark:text-gray-300 mb-2">Fecha:</label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                max={new Date().toISOString().split('T')[0]}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="folio" className="block text-gray-700 dark:text-gray-300 mb-2">Folio:</label>
                            <input
                                type="text"
                                id="folio"
                                name="folio"
                                value={folio}
                                onChange={(e) => setFolio(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
        </div>
    );
}
