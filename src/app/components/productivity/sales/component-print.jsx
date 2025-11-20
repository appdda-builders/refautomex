import React from 'react';
import { MdPhone } from "react-icons/md";
import { BsWhatsapp } from "react-icons/bs";

const ComponentToPrint = React.forwardRef(({ items, subtotal, discount, total, currentDate, employee, folio, notes }, ref) => {
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const logoUrl = `${multimediaSrc}refautomex_n.svg`;

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
                <p>¡Síguenos en redes sociales!</p>
            </div>
            <div className="mb-1 flex justify-between">
                <p className="px-0.5 flex flex-row text-[10px]">
                    <MdPhone className="mx-1 mt-1 text-[10px]" /> 55 5390 3179
                </p>
                <p className="px-0.5 flex flex-row text-[10px]">
                    <MdPhone className="mx-1 mt-1 text-[10px]" /> 55 5390 4594
                </p>
            </div>
            <div className="mb-4 flex justify-between">
                <p className="px-0.5 flex flex-row text-[10px]">
                    <BsWhatsapp className="mx-1 mt-1 text-[10px]" /> 56 3955 7232
                </p>
                <p className="px-0.5 flex flex-row text-[10px]">
                    <BsWhatsapp className="mx-1 mt-1 text-[10px]" /> 55 3858 8632
                </p>
            </div>

            <div className="mb-2">
                <p className="uppercase font-semibold">{currentDate}</p>
                <p className=''>Agente: {employee}</p>
            </div>

            <p className="font-semibold">PRODUCTOS:</p>
            <p className={`${notes ? 'font-extrabold border-2 p-1 shadow text-xs uppercase' : ''}`}>{notes}</p>
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
                        {items.map((item, index) => {
                            const hasAiva = item.aIva !== undefined && item.aIva !== null && item.aIva !== '';
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
                                            {item.descripcion.toUpperCase()}
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
                                                    MON: $ {item.monto.toFixed(2)}
                                                </td>
                                            </>
                                        ) : (
                                            <td className="p-0.5 text-[9px] text-left font-bold" colSpan={2}>
                                                MON: $ {item.monto.toFixed(2)}
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

            <div className="my-2">
                <p className='text-xs text-justify'>Refacciones Automotrices de México.
                Jilotepec 389 Colonia la Romana Tlalnepantla de baz, México. C.P. 54030</p>
            </div>

            <p className="text-xs text-justify">Si requieres factura, visita:</p>
            <a href="https://refautomex.com" className="text-stone-800 font-bold text-xs text-justify mb-2">
                https://refautomex.com
            </a>
            <p className="text-xs text-justify mt-2">
                Cuentas con 15 días naturales. Si necesitas ayuda, contáctanos y con gusto te ayudaremos. NO SE FACTURARÁ EXTEMPORANEAMENTE.
            </p>
            <p className="font-bold mt-4 text-center text-sm">¡GRACIAS POR TU PREFERENCIA!</p>
        </div>
    );
});

export default ComponentToPrint;
