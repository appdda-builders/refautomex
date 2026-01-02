'use client';

import React, { useEffect, useState } from 'react';
import { MdPhone } from "react-icons/md";
import { BsWhatsapp } from "react-icons/bs";
import { buildApiUrl } from '@/app/lib/refautomex-api';

const formatPhone = (value) => {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    const base = `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
    return digits.length > 10 ? `${base} ${digits.slice(10)}` : base;
};

const normalizeBranchesPayload = (payload) => {
    if (Array.isArray(payload?.[0])) return payload[0];
    if (Array.isArray(payload)) return payload;
    return [];
};

const extractBranchId = (branch) =>
    branch?.idsucursal ?? branch?.idSucursal ?? branch?.id ?? null;

const mapBranchData = (branch) => ({
    id: extractBranchId(branch),
    name: branch?.sucursal || '',
    address: branch?.direccion || '',
    phone1: branch?.telefono_uno || '',
    phone2: branch?.telefono_dos || '',
    whatsapp1: branch?.whats_uno || '',
    whatsapp2: branch?.whats_dos || '',
});

const branchCache = new Map();
const branchInFlight = new Map();

const fetchBranchData = async (branchId, signal) => {
    if (!branchId) return null;
    const response = await fetch(buildApiUrl('/getSucursal'), {
        cache: 'no-store',
        headers: { Accept: 'application/json, text/plain, */*' },
        signal,
    });
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    const payload = await response.json();
    const branches = normalizeBranchesPayload(payload);
    const matched = branches.find(
        (branch) => String(extractBranchId(branch)) === String(branchId)
    );
    return matched ? mapBranchData(matched) : null;
};

export const prefetchBranchData = async (branchId) => {
    if (!branchId) return null;
    const key = String(branchId);
    if (branchCache.has(key)) return branchCache.get(key);
    if (branchInFlight.has(key)) return branchInFlight.get(key);
    const promise = fetchBranchData(branchId)
        .then((data) => {
            branchCache.set(key, data);
            branchInFlight.delete(key);
            return data;
        })
        .catch((error) => {
            branchInFlight.delete(key);
            throw error;
        });
    branchInFlight.set(key, promise);
    return promise;
};

const ComponentToPrint = React.forwardRef(({
    items,
    subtotal,
    discount,
    total,
    currentDate,
    employee,
    folio,
    notes,
    branchName,
    phones,
    whatsapps,
    address,
    websiteUrl,
    socialMessage,
    branchId,
    refreshKey = 0,
    useDefaults = true,
}, ref) => {
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const logoUrl = `${multimediaSrc}refautomex_n.svg`;
    const [branchData, setBranchData] = useState(() => {
        if (!branchId) return null;
        return branchCache.get(String(branchId)) || null;
    });
    const safeItems = Array.isArray(items) ? items : [];
    const fallbackPhones = useDefaults ? DEFAULT_PHONES : [];
    const fallbackWhatsapps = useDefaults ? DEFAULT_WHATSAPPS : [];
    const resolvedPhones = Array.isArray(phones) && phones.some(Boolean)
        ? phones
        : [branchData?.phone1, branchData?.phone2].filter(Boolean);
    const resolvedWhatsapps = Array.isArray(whatsapps) && whatsapps.some(Boolean)
        ? whatsapps
        : [branchData?.whatsapp1, branchData?.whatsapp2].filter(Boolean);
    const safePhones = (resolvedPhones.length ? resolvedPhones : fallbackPhones)
        .filter(Boolean)
        .slice(0, 2)
        .map(formatPhone)
        .filter(Boolean);
    const safeWhatsapps = (resolvedWhatsapps.length ? resolvedWhatsapps : fallbackWhatsapps)
        .filter(Boolean)
        .slice(0, 2)
        .map(formatPhone)
        .filter(Boolean);
    const safeAddress = address || branchData?.address || (useDefaults ? DEFAULT_ADDRESS : '');
    const safeWebsite = websiteUrl || (useDefaults ? DEFAULT_WEBSITE : '');
    const safeSocial = socialMessage || (useDefaults ? DEFAULT_SOCIAL : '');
    const safeBranchName = branchName || branchData?.name || '';

    useEffect(() => {
        if (!branchId) {
            setBranchData(null);
            return;
        }

        const key = String(branchId);
        const cached = branchCache.get(key);
        const forceRefresh = refreshKey > 0;
        if (cached && !forceRefresh) {
            setBranchData(cached);
            return;
        }

        const controller = new AbortController();
        fetchBranchData(branchId, controller.signal)
            .then((data) => {
                branchCache.set(key, data);
                setBranchData(data);
            })
            .catch((error) => {
                if (error.name === 'AbortError') return;
                setBranchData(null);
            });

        return () => controller.abort();
    }, [branchId, refreshKey]);

    return (
        <div ref={ref} className="bg-white p-4 pb-32 max-w-[235px] mx-auto text-sm text-gray-700 print:max-w-[250px] print:text-black">
            <style>
                {`
                @media print {
                    * {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        font-smooth: always;
                    }
                    img {
                        max-width: 100%;
                        max-height: auto;
                    }
                    .print-hidden {
                        display: none !important;
                    }
                    .bg-white {
                        background-color: white !important;
                    }
                }
                `}
            </style>
            <div className="flex justify-center items-center m-4">
                <img src={logoUrl} alt="Refautomex Logo" className="h-12" />
            </div>

            <div className="mb-2 text-center text-sm">
                <p className='font-bold'>Folio: {folio}</p>
                {safeBranchName && (
                    <p className="text-xs uppercase font-semibold tracking-wide">{safeBranchName}</p>
                )}
                {safeSocial && <p>{safeSocial}</p>}
            </div>
            {safePhones.length > 0 && (
                <div className="mb-1 grid grid-cols-2 gap-x-2">
                    {safePhones.map((phone, index) => (
                        <p key={`phone-${index}`} className="px-0.5 flex flex-row text-[10px]">
                            <MdPhone className="mx-1 mt-1 text-[10px]" /> {phone}
                        </p>
                    ))}
                </div>
            )}
            {safeWhatsapps.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-x-2">
                    {safeWhatsapps.map((phone, index) => (
                        <p key={`whatsapp-${index}`} className="px-0.5 flex flex-row text-[10px]">
                            <BsWhatsapp className="mx-1 mt-1 text-[10px]" /> {phone}
                        </p>
                    ))}
                </div>
            )}

            <div className="mb-2">
                <p className="uppercase font-semibold">{currentDate}</p>
                <p className=''>Agente: {employee}</p>
            </div>

            <p className="font-semibold">PRODUCTOS:</p>
            {notes && (
                <p className="font-extrabold border-2 p-1 shadow text-xs uppercase">{notes}</p>
            )}
            <div className="my-2 border-t border-b border-slate-300">
                <table className="table-fixed w-full text-xs text-left px-0.5">
                    <thead>
                        <tr>
                            <th className="w-1/6 p-0.5 border-b text-left text-[9px]">CANT</th>
                            <th className="w-2/6 p-0.5 border-b text-[9px]">PART</th>
                            <th className="w-3/6 p-0.5 border-b text-[9px]">DESC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeItems.map((item, index) => {
                            const hasAiva = item.aIva !== undefined && item.aIva !== null && item.aIva !== '';
                            const description = String(item.descripcion || '');
                            return (
                                <React.Fragment key={index}>
                                    {/* Primera fila: Cantidad, Descripción y Parte */}
                                    <tr>
                                        <td className='p-0.5 text-[9px] text-left'>
                                            {item.cantidad}
                                        </td>
                                        <td className='p-0.5 text-[9px] uppercase'>
                                            {item.refaccion}
                                        </td>
                                        <td colSpan={3} className="p-0.5 text-[9px] truncate uppercase">
                                            {description.toUpperCase()}
                                        </td>
                                    </tr>
                                    {/* Segunda fila: AIVA (opcional) y Monto */}
                                    <tr>
                                        <td></td>
                                        {hasAiva ? (
                                            <>
                                                <td className="p-0.5 text-[9px] text-left font-semibold">
                                                    AIVA: $ {item.aIva}
                                                </td>
                                                <td className="p-0.5 text-[9px] text-left font-bold">
                                                    MON: $ {Number(item.monto || 0).toFixed(2)}
                                                </td>
                                            </>
                                        ) : (
                                            <td className="p-0.5 text-[9px] text-left font-bold" colSpan={2}>
                                                MON: $ {Number(item.monto || 0).toFixed(2)}
                                            </td>
                                        )}
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="pt-2">
                {discount < 0 && (
                    <>
                        <p className="text-right text-xs font-semibold">({discount}%) Descuento: {(subtotal * discount / 100).toFixed(2)} MXN</p>
                        <p className="text-right text-xs font-semibold">Subtotal: {subtotal.toFixed(2)} MXN</p>
                    </>
                )}
                <span className="text-left font-bold">Total: <span className='text-xl'>{total.toFixed(2)} MXN</span></span>
            </div>

            {safeAddress && (
                <div className='my-2 text-xs text-justify'>
                    Refacciones Automotrices de México propiedad de FRARISA con domicilio para {safeBranchName} en:
                    <span className="text-xs text-justify mx-1">
                        {safeAddress}
                    </span>
                    <br /><br />
                    ¡ SÍGENOS EN REDES SOCIALES !
                    <br /><br />
                    Si requieres factura, dejanos tus datos desde nuestro sitio web.
                    <br />
                    <span className="text-xs text-justify font-bold">
                    https://refautomex.com
                    </span>
                </div>
            )}

            {safeWebsite && (
                <>
                    <p className="text-xs text-justify">Si requieres factura, visita:</p>
                    <a href={safeWebsite} className="text-stone-800 font-bold text-xs text-justify mb-2">
                        {safeWebsite}
                    </a>
                </>
            )}
            <p className="text-xs text-justify mt-2">
                Cuentas con 15 días naturales. Si necesitas ayuda, contáctanos y con gusto te ayudaremos. NO SE FACTURARÁ EXTEMPORANEAMENTE.
            </p>
            <p className="font-bold mt-4 text-center text-sm">¡GRACIAS POR TU PREFERENCIA!</p>
        </div>
    );
});

export default ComponentToPrint;
