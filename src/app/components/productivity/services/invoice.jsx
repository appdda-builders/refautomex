import { buildApiUrl } from '@/app/lib/refautomex-api';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Title from '../title';
import { FaUsersViewfinder } from 'react-icons/fa6';
import { FaSearch } from 'react-icons/fa';
import { IoMdCloudDone } from 'react-icons/io';
import { GoClockFill } from 'react-icons/go';
import { BiSolidUserCircle } from 'react-icons/bi';

const normalizeStatus = (invoice) => {
    const emitida = String(invoice?.emitida || '').toUpperCase(); // 'P' | 'F'
    const hasUuid = Boolean(invoice?.uuid || invoice?.uuid_sat || invoice?.uuid_cfdi);
    if (emitida === 'F' || hasUuid) return 'finalizada';
    return 'pendiente';
};

const shapeInvoice = (invoice) => ({
    id: invoice.idfactura ?? invoice.idFactura ?? invoice.id_factura ?? invoice.id,
    folio: invoice.folio ?? invoice.folio_factura ?? invoice.folioVenta ?? null,
    nombre: invoice.nombre ?? invoice.cliente ?? invoice.razon_social ?? '---',
    email: invoice.email ?? '---',
    telefono: invoice.telefono ?? invoice.phone ?? '---',
    rfc: invoice.rfc ?? '---',
    domicilio: invoice.domicilio ?? invoice.direccion ?? '---',
    cfdi: invoice.cfdi ?? invoice.cfdi_clave ?? invoice.idcfdi ?? '---',
    regimen: invoice.regimen ?? invoice.idregimen ?? '---',
    createdAt: invoice.fecha ?? invoice.fecha_creacion ?? null,
    status: normalizeStatus(invoice),
});

const statusBadgeClass = (status) =>
    status === 'finalizada'
        ? 'bg-green-500 text-white'
        : 'bg-amber-500 text-[rgb(var(--color-text))]';

const isLikelyPlaceId = (val) => {
    if (typeof val !== 'string') return false;
    const trimmed = val.trim();
    if (trimmed.length < 12 || trimmed.length > 120) return false;
    if (/\s/.test(trimmed)) return false;
    return /^[A-Za-z0-9_-]+$/.test(trimmed);
};

export default function Invoice() {
    const [invoices, setInvoices] = useState([]);
    const [filter, setFilter] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [finalizingId, setFinalizingId] = useState(null);
    const [detailsByFolio, setDetailsByFolio] = useState({});
    const [detailsLoading, setDetailsLoading] = useState({});
    const [placeCache, setPlaceCache] = useState({});
    const placeCacheRef = useRef({});
    const placesServiceRef = useRef(null);

    useEffect(() => {
        if (!placesServiceRef.current && typeof window !== 'undefined' && window.google?.maps?.places) {
            placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
        }
    }, []);

    const fetchInvoices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(buildApiUrl('/getInvoices'), {
                cache: 'no-store',
                headers: { Accept: 'application/json, text/plain, */*' },
            });
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            const payload = await response.json();
            const rows = Array.isArray(payload?.[0]) ? payload[0] : Array.isArray(payload) ? payload : [];
            console.log('GetInvoices payload (rows):', rows);
            const shaped = rows.map(shapeInvoice);
            setInvoices(shaped);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            setError(err.message);
            setInvoices([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const resolvePlace = useCallback((placeId) => {
        if (!placeId || placeCacheRef.current[placeId]) return;
        if (!isLikelyPlaceId(placeId)) return;
        const service = placesServiceRef.current;
        if (!service) return;

        service.getDetails(
            { placeId, fields: ['formatted_address'] },
            (place, status) => {
                const formatted =
                    status === window.google.maps.places.PlacesServiceStatus.OK
                        ? place?.formatted_address || placeId
                        : placeId;
                setPlaceCache((prev) => {
                    if (prev[placeId]) return prev;
                    const next = { ...prev, [placeId]: formatted };
                    placeCacheRef.current = next;
                    return next;
                });
            }
        );
    }, []);

    useEffect(() => {
        const uniquePlaceIds = Array.from(
            new Set(invoices.map((inv) => inv.domicilio).filter(isLikelyPlaceId))
        ).slice(0, 50); // evita demasiadas llamadas
        uniquePlaceIds.forEach(resolvePlace);
    }, [invoices, resolvePlace]);

    const fetchDetails = useCallback(
        async (folio) => {
            if (!folio || detailsByFolio[folio]) return;
            setDetailsLoading((prev) => ({ ...prev, [folio]: true }));
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
                const payload = await response.json();
                const headers = Array.isArray(payload?.[0]) ? payload[0] : [];
                const details = Array.isArray(payload?.[1]) ? payload[1] : [];
                const header = headers.find((h) => String(h.folio) === String(folio)) || headers[0];
                const idventa = header?.idventa ?? header?.idVenta;
                const filteredDetails = idventa
                    ? details.filter((d) => String(d.idventa ?? d.idVenta) === String(idventa))
                    : details;
                setDetailsByFolio((prev) => ({ ...prev, [folio]: filteredDetails || [] }));
            } catch (err) {
                console.error('Error fetching folio details:', err);
                setDetailsByFolio((prev) => ({ ...prev, [folio]: [] }));
            } finally {
                setDetailsLoading((prev) => ({ ...prev, [folio]: false }));
            }
        },
        [detailsByFolio]
    );

    const handleFinalize = useCallback(
        async (invoice) => {
            const targetId = invoice.id ?? invoice.folio;
            if (!targetId || finalizingId) return;
            setFinalizingId(targetId);
            try {
                const response = await fetch(buildApiUrl('/finalizeInvoice'), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json, text/plain, */*',
                    },
                    body: JSON.stringify({
                        idfactura: invoice.id ?? null,
                        folio: invoice.folio ?? null,
                    }),
                });
                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
                setInvoices((prev) =>
                    prev.map((inv) =>
                        (inv.id ?? inv.folio) === targetId
                            ? { ...inv, status: 'finalizada', emitida: 'F' }
                            : inv
                    )
                );
            } catch (err) {
                console.error('Error finalizing invoice:', err);
                setError(err.message);
            } finally {
                setFinalizingId(null);
            }
        },
        [finalizingId]
    );

    const filtered = useMemo(() => {
        const term = filter.trim().toLowerCase();
        if (!term) return invoices;
        return invoices.filter((inv) =>
            [
                inv.folio,
                inv.nombre,
                inv.email,
                inv.telefono,
                inv.rfc,
                inv.domicilio,
            ]
                .join(' ')
                .toLowerCase()
                .includes(term)
        );
    }, [filter, invoices]);

    const pending = filtered.filter((inv) => inv.status === 'pendiente');
    const finished = filtered.filter((inv) => inv.status === 'finalizada');
    const finishedLimited = finished.slice(0, 100);

    const renderRow = (invoice, idx) => {
        const key = invoice.id ?? invoice.folio ?? `inv-${idx}`;
        const isExpanded = expanded === invoice.id || expanded === invoice.folio;
        const address = invoice.domicilio ? (placeCache[invoice.domicilio] || invoice.domicilio) : '---';
        const isPending = invoice.status === 'pendiente';
        const detailList = invoice.folio ? detailsByFolio[invoice.folio] : undefined;
        const isDetailLoading = invoice.folio ? detailsLoading[invoice.folio] : false;
        const toUpper = (val) => (typeof val === 'string' ? val.toUpperCase() : val ?? '---');
        const preserve = (val) => val ?? '---';
        return (
            <div
                key={key}
                className="bg-[rgb(var(--color-card))] shadow rounded-xl p-4 border border-[rgb(var(--color-border))] mb-3"
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="font-bold text-lg text-[rgb(var(--color-text))] break-words">
                        {invoice.folio || '---'}
                    </div>
                    <button
                        className="text-xs px-3 py-1 rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] hover:border-[rgb(var(--color-amber))] cursor-pointer"
                        onClick={() => {
                            const target = invoice.id ?? invoice.folio;
                            const nextExpanded = isExpanded ? null : target;
                            setExpanded(nextExpanded);
                            if (!isExpanded && invoice.folio) fetchDetails(invoice.folio);
                        }}
                    >
                        <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-text))]/80">
                            <BiSolidUserCircle className="w-6 h-6" />
                            <span className="break-words truncate w-36">{invoice.nombre}</span>
                        </div>
                    </button>
                </div>
                {isExpanded && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[rgb(var(--color-text))]">
                        <div className="break-words"><span className="font-semibold">Nombre: </span>{toUpper(invoice.nombre)}</div>
                        <div className="break-words"><span className="font-semibold">Correo: </span>{preserve(invoice.email)}</div>
                        <div className="break-words"><span className="font-semibold">Teléfono: </span>{invoice.telefono}</div>
                        <div className="break-words"><span className="font-semibold">RFC: </span>{toUpper(invoice.rfc)}</div>
                        <div className="break-words"><span className="font-semibold">CFDI: </span>{toUpper(invoice.cfdi)}</div>
                        <div className="break-words"><span className="font-semibold">Régimen: </span>{toUpper(invoice.regimen)}</div>
                        <div className="break-words whitespace-pre-wrap"><span className="font-semibold">Domicilio: </span>{toUpper(address)}</div>
                        {invoice.createdAt && (
                            <div className="break-words"><span className="font-semibold">Fecha: </span>{invoice.createdAt}</div>
                        )}
                        {isPending && (
                            <div className="sm:col-span-2 flex justify-end">
                                <button
                                    className="text-md px-3 py-2 rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-amber))] disabled:opacity-60 cursor-pointer text-[rgb(var(--color-text))]"
                                    disabled={!!finalizingId}
                                    onClick={() => handleFinalize(invoice)}
                                >
                                    {finalizingId === (invoice.id ?? invoice.folio) ? 'Guardando...' : 'Finalizar factura'}
                                </button>
                            </div>
                        )}
                        <div className="sm:col-span-2 mt-2">
                            <div className="text-sm font-semibold text-[rgb(var(--color-text))] mb-2">Productos comprados</div>
                            {isDetailLoading && <p className="text-xs text-[rgb(var(--color-text))]">Cargando productos...</p>}
                            {!isDetailLoading && detailList && detailList.length === 0 && (
                                <p className="text-xs text-[rgb(var(--color-text))]/80">Sin detalles para este folio.</p>
                            )}
                            {!isDetailLoading && Array.isArray(detailList) && detailList.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs text-left text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] rounded-lg">
                                        <thead className="bg-[rgb(var(--color-card))]">
                                            <tr>
                                                <th className="py-2 px-3">No. parte</th>
                                                <th className="py-2 px-3">Descripción</th>
                                                <th className="py-2 px-3">Cantidad</th>
                                                <th className="py-2 px-3">Precio</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailList.map((d, i) => (
                                                <tr key={`${invoice.folio}-det-${i}`} className="bg-[rgb(var(--color-card-white))] border-t border-[rgb(var(--color-border))]">
                                                    <td className="py-2 px-3 break-words">{toUpper(d.num_parte ?? d.numParte)}</td>
                                                    <td className="py-2 px-3 break-words">
                                                        {toUpper(d.concepto_comodin ?? d.descripcion ?? d.descripcion_producto)}
                                                    </td>
                                                    <td className="py-2 px-3">{d.cantidad ?? d.cant ?? d.cant_detalle ?? '---'}</td>
                                                    <td className="py-2 px-3">$ {d.precio_venta ?? d.precio ?? d.precio_detalle ?? '---'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-gradient-to-b min-h-screen from-[rgb(var(--color-bg))] via-[rgb(var(--color-card))] to-[rgb(var(--color-gray))] backdrop-blur-md pt-28">
            <Title
                title="Facturación web"
                icon={FaUsersViewfinder}
                back="Volver al panel"
                path="/productivity"
            />

            <div className="mx-auto max-w-6xl px-4 lg:px-0 mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-text))] bg-[rgb(var(--color-card))] rounded-full px-3 py-1 shadow">
                            <GoClockFill className="text-amber-500" />
                            <span>Pendientes: {pending.length}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[rgb(var(--color-card))] rounded-full px-3 py-1 shadow border border-[rgb(var(--color-border))]">
                        <FaSearch className="text-[rgb(var(--color-text))]/70" />
                        <input
                            type="text"
                            placeholder="Buscar por folio, correo, nombre..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-transparent outline-none text-sm text-[rgb(var(--color-text))] w-60"
                        />
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[rgb(var(--color-card))] rounded-xl p-4 shadow">
                        <div className="flex items-center gap-2 text-[rgb(var(--color-text))] font-semibold mb-3">
                            <GoClockFill className="text-amber-500" /> Pendientes
                        </div>
                        {isLoading && <p className="text-sm text-[rgb(var(--color-text))]">Cargando...</p>}
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        {!isLoading && !error && pending.length === 0 && (
                            <p className="text-sm text-[rgb(var(--color-text))]">Sin facturas pendientes.</p>
                        )}
                        {!isLoading && !error && pending.map(renderRow)}
                    </div>

                    <div className="bg-[rgb(var(--color-card))] rounded-xl p-4 shadow">
                        <div className="flex items-center gap-2 text-[rgb(var(--color-text))] font-semibold mb-3">
                            <IoMdCloudDone className="text-green-600" /> Finalizadas
                        </div>
                        {isLoading && <p className="text-sm text-[rgb(var(--color-text))]">Cargando...</p>}
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        {!isLoading && !error && finishedLimited.length === 0 && (
                            <p className="text-sm text-[rgb(var(--color-text))]">Sin facturas finalizadas.</p>
                        )}
                        {!isLoading && !error && finishedLimited.map(renderRow)}
                        {!isLoading && !error && finished.length > finishedLimited.length && (
                            <p className="text-xs text-[rgb(var(--color-text))]/70 mt-2">Mostrando solo las primeras 100 finalizadas.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
