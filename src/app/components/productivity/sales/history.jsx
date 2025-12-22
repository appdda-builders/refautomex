import { buildApiUrl } from '@/app/lib/refautomex-api';
import { useState, useEffect, useRef, Fragment, useMemo, useCallback, useContext } from 'react';
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
import { useReactToPrint } from 'react-to-print';
import ComponentToPrint from './component-print';
import { AuthContext } from '@/app/lib/auth-tracker';

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

const normalizeBranchId = (value) => {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed || null;
};

const isWebBranch = (value) => {
    const normalized = normalizeBranchId(value);
    if (!normalized) return false;
    const upper = normalized.toUpperCase();
    return upper === '1' || upper === 'WEB';
};

export default function History() {
    const [visibleTooltip, setVisibleTooltip] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [imageErrors, setImageErrors] = useState({});
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
    const [ticketData, setTicketData] = useState(null);
    const [branchOptions, setBranchOptions] = useState([]);
    const [branchMap, setBranchMap] = useState({});
    const [selectedBranch, setSelectedBranch] = useState('');
    const [branchInitialized, setBranchInitialized] = useState(false);
    const [employeeBranchMap, setEmployeeBranchMap] = useState({});
    const { userData } = useContext(AuthContext);
    const userBranchId = normalizeBranchId(userData?.idsucursal);
    const componentRef = useRef(null);
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        onAfterPrint: () => setTicketData(null),
    });

    const findTooltip = createTooltip(FaSearch, 'Buscar ticket', 'find', visibleTooltip, setVisibleTooltip);
    const withdrawTooltip = createTooltip(BiMoneyWithdraw, 'Solicitar retiro', 'withdraw', visibleTooltip, setVisibleTooltip);
    const historyTooltip = createTooltip(FaMoneyBillTransfer, 'Entradas y salidas', 'history', visibleTooltip, setVisibleTooltip);
    const chartTooltip = createTooltip(FaChartColumn, 'Gráfico por años', 'chart', visibleTooltip, setVisibleTooltip);

    const formatDate = (dateInput, timeZone) => {
        if (!dateInput) return "Fecha no disponible";

        let date;
        if (typeof dateInput === "string") {
            const datePart = dateInput.includes("T")
                ? dateInput.split("T")[0]
                : dateInput;
            const [year, month, day] = datePart.split("-");
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

            const params = new URLSearchParams({ id: formattedDate });
            if (idVenta) params.append('idVenta', idVenta);
            const endpoint = `${buildApiUrl('/getHistory')}?${params.toString()}`;
            const response = await fetch(endpoint, {
                cache: 'no-store',
                headers: { Accept: 'application/json, text/plain, */*' },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (Array.isArray(data)) {
                setSales(data);
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
        if (ticketData) {
            handlePrint();
        }
    }, [ticketData, handlePrint]);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await fetch(buildApiUrl('/getSucursal'), {
                    cache: 'no-store',
                    headers: { Accept: 'application/json, text/plain, */*' },
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const payload = await response.json();
                const normalized = Array.isArray(payload) ? payload : [];
                const filtered = normalized.filter((branch) => !isWebBranch(branch.idsucursal));
                const options = filtered
                    .map((branch) => ({
                        value: normalizeBranchId(branch.idsucursal),
                        label: branch.sucursal || `Sucursal ${branch.idsucursal}`,
                    }))
                    .filter((option) => Boolean(option.value));
                const names = options.reduce((acc, option) => {
                    if (option.value) acc[option.value] = option.label;
                    return acc;
                }, {});
                setBranchOptions(options);
                setBranchMap(names);
            } catch (err) {
                console.error('Error fetching sucursales:', err);
            }
        };

        fetchBranches();
    }, []);

    useEffect(() => {
        const fetchEmployeeBranches = async () => {
            try {
                const response = await fetch(buildApiUrl('/getAllEmployees'), {
                    cache: 'no-store',
                    headers: { Accept: 'application/json, text/plain, */*' },
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const payload = await response.json();
                const map = (Array.isArray(payload) ? payload : []).reduce((acc, employee) => {
                    const branchId = normalizeBranchId(employee.idsucursal ?? employee.idSucursal);
                    const userId = normalizeBranchId(employee.idusuario ?? employee.idUsuario);
                    if (!branchId || !userId || isWebBranch(branchId)) return acc;
                    acc[userId] = branchId;
                    return acc;
                }, {});
                setEmployeeBranchMap(map);
            } catch (err) {
                console.error('Error fetching empleados:', err);
            }
        };

        fetchEmployeeBranches();
    }, []);

    useEffect(() => {
        if (branchInitialized || branchOptions.length === 0) return;
        const normalizedUserBranch = userBranchId && !isWebBranch(userBranchId) ? userBranchId : null;
        const hasUserBranch = normalizedUserBranch
            ? branchOptions.some((option) => option.value === normalizedUserBranch)
            : false;
        if (hasUserBranch) {
            setSelectedBranch(normalizedUserBranch);
        } else if (branchOptions[0]?.value) {
            setSelectedBranch(branchOptions[0].value);
        }
        setBranchInitialized(true);
    }, [branchInitialized, branchOptions, userBranchId]);

    const handleImageError = (userId) => {
        if (!userId) return;
        setImageErrors((prev) => ({ ...prev, [userId]: true }));
    };

    const handleSearch = () => {
        setCurrentDate(selectedDate);
        setIsModalOpen(false);
    };

    const resolveSaleBranchId = useCallback((sale) => {
        if (!sale) return null;
        const directBranch = normalizeBranchId(
            sale.idsucursal ??
            sale.idSucursal ??
            sale.id_sucursal ??
            sale.sucursalId ??
            sale.branchId ??
            sale.branch_id
        );
        if (directBranch) return directBranch;

        if (sale.sucursal && branchOptions.length > 0) {
            const normalizedName = String(sale.sucursal).trim().toLowerCase();
            const matched = branchOptions.find(
                (option) => option.label?.toLowerCase() === normalizedName
            );
            if (matched?.value) return matched.value;
        }

        const saleUserId = normalizeBranchId(
            sale.idusuario ??
            sale.idUsuario ??
            sale.idempleado ??
            sale.idEmpleado
        );
        if (saleUserId && employeeBranchMap[saleUserId]) {
            return employeeBranchMap[saleUserId];
        }
        return null;
    }, [branchOptions, employeeBranchMap]);

    const resolveBranchLabel = useCallback((sale) => {
        const branchId = resolveSaleBranchId(sale);
        if (!branchId) return null;
        return branchMap[branchId] || sale.sucursal || null;
    }, [branchMap, resolveSaleBranchId]);

    const visibleSales = useMemo(() => {
        const baseSales = Array.isArray(sales) ? sales : [];
        const noBranchFilter = !selectedBranch;
        return baseSales.filter((sale) => {
            const branchId = resolveSaleBranchId(sale);
            const fallbackBranch = normalizeBranchId(sale?.sucursal);
            if ((branchId && isWebBranch(branchId)) || (!branchId && fallbackBranch && isWebBranch(fallbackBranch))) {
                return false;
            }
            if (noBranchFilter) return true;
            return branchId ? branchId === selectedBranch : false;
        });
    }, [sales, selectedBranch, resolveSaleBranchId]);

    useEffect(() => {
        setExpandedFolio(null);
    }, [selectedBranch]);

    const total = visibleSales && visibleSales.length > 0
        ? visibleSales
            .filter((item) => item.status === 'A') // Filtra solo las ventas activas
            .reduce((acc, item) => acc + parseFloat(item.total_venta || 0), 0)
        : 0;

    const selectedBranchLabel = selectedBranch
        ? (branchMap[selectedBranch] || 'la sucursal seleccionada')
        : 'todas las sucursales';

    const buildTicketDataFromSale = (sale) => {
        if (!sale) return null;

        const items = (sale.details || []).map((detail) => {
            const quantity = Number(detail.cantidad) || 0;
            const parsedPrice = parseFloat(detail.precio_venta ?? detail.precio ?? 0);
            const price = Number.isFinite(parsedPrice) ? parsedPrice : 0;
            const parsedMonto = parseFloat(detail.monto ?? price * quantity);
            const monto = Number.isFinite(parsedMonto) ? parsedMonto : price * quantity;
            return {
                refaccion: detail.num_parte || detail.refaccion || 'S/N',
                descripcion: detail.descripcion || detail.concepto_comodin || '',
                cantidad: quantity,
                precio: price,
                monto,
            };
        });

        const subtotal = items.reduce((acc, item) => acc + (item.monto || 0), 0);
        const parsedDiscount = parseFloat(sale.descuento);
        const discount = Number.isFinite(parsedDiscount) ? parsedDiscount : 0;
        const parsedTotal = parseFloat(sale.total_venta ?? subtotal);
        const totalTicket = Number.isFinite(parsedTotal) ? parsedTotal : subtotal;

        return {
            items,
            subtotal,
            discount,
            total: totalTicket,
            currentDate: formatDate(sale.fecha_venta, timeZone),
            employee: sale.empleado || '',
            folio: sale.folio || '',
            notes: sale.nota || '',
        };
    };

    const handleTicketPrint = (sale) => {
        const ticket = buildTicketDataFromSale(sale);
        if (ticket) {
            setTicketData(ticket);
        }
    };

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
            const response = await fetch(buildApiUrl('/patchSaleStatus'), {
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
                <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[rgb(var(--color-text))]">
                    <div className="text-xl uppercase font-semibold italic text-center sm:text-left">
                        {formattedCurrentDate}
                    </div>
                    <div className="flex items-center justify-center sm:justify-end gap-3">
                        <label className="text-sm text-[rgb(var(--color-text))]/80">Sucursal</label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            disabled={branchOptions.length === 0}
                            className="bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] rounded-xl px-3 py-2 text-sm shadow outline-none"
                        >
                            <option value="">Todas</option>
                            {branchOptions.map((branch) => (
                                <option key={branch.value} value={branch.value}>
                                    {branch.value === userBranchId ? `ACTUAL · ${branch.label}` : branch.label}
                                </option>
                            ))}
                        </select>
                    </div>
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
                                {!visibleSales || visibleSales.length === 0 ? (
                                    <div className="flex justify-center items-center h-full text-[rgb(var(--color-text))]">
                                        No se encontraron registros para la fecha listada en {selectedBranchLabel}.
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
                                            {Array.isArray(visibleSales) && visibleSales.map((item, index) => {
                                                const branchLabel = resolveBranchLabel(item);
                                                return (
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
                                                                <div className="absolute left-0 translate-y-2.5 translate-x-6 lg:-translate-x-4 top-1/4 mx-3 text-md xl:text-lg leading-6 xl:pr-1 flex justify-center items-center text-[rgb(var(--color-text))] bg-[rgb(var(--color-card))] cursor-pointer">
                                                                    {item.idusuario && !imageErrors[item.idusuario] ? (
                                                                        <div className="flex h-9 w-9 items-center justify-center bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-card-white))] hover:border-[rgb(var(--color-amber))] animate-out shadow-lg rounded-full overflow-hidden">
                                                                            <img
                                                                                src={`${multimediaSrc}usr/${item.idusuario}.jpg`}
                                                                                onError={() => handleImageError(item.idusuario)}
                                                                                className="w-full h-full object-cover bg-gray-50"
                                                                                alt={`Empleado ${item.empleado || item.idusuario}`}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <BiSolidUserCircle className="w-9 h-9 rounded-full shadow-xl border border-indigo-100 my-auto animate-out" />
                                                                    )}
                                                                    <div className='ml-1.5 mr-2 text-sm italic hidden lg:flex flex-col'>
                                                                        <span>
                                                                            {item.empleado}
                                                                        </span>
                                                                        {branchLabel && (
                                                                        <span className='mt-1 text-[0.65rem] uppercase tracking-wide rounded-full border border-[rgb(var(--color-border))] px-2 py-0.5 bg-[rgb(var(--color-card))] text-[rgb(var(--color-text))] shadow shadow-[rgb(var(--color-galaxy))] justify-center items-center flex w-28'>
                                                                            {branchLabel}
                                                                        </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    className='relative p-3 m-1 rounded-full shadow hover:shadow-xl bg-amber-500 color-cultured cursor-pointer inline-block'
                                                                    onClick={() => handleTicketPrint(item)}
                                                                    aria-label='Ticket'
                                                                >
                                                                    <IoTicket />
                                                                </button>
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
                                                );
                                            })}
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
            {ticketData && (
                <div className="hidden">
                    <ComponentToPrint
                        ref={componentRef}
                        items={ticketData.items}
                        subtotal={ticketData.subtotal}
                        discount={ticketData.discount}
                        total={ticketData.total}
                        currentDate={ticketData.currentDate}
                        employee={ticketData.employee}
                        folio={ticketData.folio}
                        notes={ticketData.notes}
                    />
                </div>
            )}
        </div>
    );
}
