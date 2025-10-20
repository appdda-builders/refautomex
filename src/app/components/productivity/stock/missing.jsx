import Title from '../title';
import React, { useState } from 'react';
import { FaBoxesPacking } from 'react-icons/fa6';
import FindProducts from '@/app/components/productivity/sales/find-products';

export default function Missing(){
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const [items, setItems] = useState([]);

    const handleAddProduct = (product) => {
        setItems(prevItems => {
            const exists = prevItems.some(item => item.refaccion === product.refaccion);
            const updatedItems = exists
                ? prevItems.filter(item => item.refaccion !== product.refaccion)
                : [...prevItems, { ...product }];
            return updatedItems;
        });
    };

    const handleRemoveProduct = (refaccion) => {
        setItems(prevItems => {
            const updatedItems = prevItems.filter(item => item.refaccion !== refaccion);
            return updatedItems;
        });
    };

    return(
        <div className="bg-gradient-to-b min-h-screen from-white via-gray-100 to-gray-400 dark:from-black dark:via-slate-800 dark:to-stone-700 backdrop-blur-md pt-28 ">
            <Title 
            title='Faltantes de almacén'
            icon={FaBoxesPacking}
            back='Volver al panel'
            path='/productivity'
            />
            <div className="pb-12">
                <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
                <div className="mt-10 grid gap-4 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2">
                    <div className="relative lg:row-span-2">
                    <div className="absolute inset-px rounded-lg bg-white dark:bg-stone-700 dark:text-stone-100 lg:rounded-l-[2rem]"></div>
                    <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-l-[calc(2rem+1px)]">
                        <FindProducts 
                            onAddProduct={handleAddProduct} 
                            onRemoveProduct={handleRemoveProduct}
                            addedItems={items}
                            isMissing={true}
                        />
                    </div>
                    <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-l-[2rem]"></div>
                    </div>
                    <div className="relative max-lg:row-start-1">
                    <div className="absolute inset-px rounded-lg bg-white dark:bg-stone-700 dark:text-stone-100 max-lg:rounded-t-[2rem]"></div>
                    <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
                        <div className="px-8 py-8 sm:px-10 sm:pt-10">
                            <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white max-lg:text-center">Solicitud de producto</p>
                            <form className='space-y-2 divide-y divide-gray-200'>
                                <input className='form-input block w-full rounded-md border-0 py-2 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset bg-slate-100 ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6' placeholder='Refacción' disabled />
                                <select className='form-select block w-full rounded-md border-0 py-2 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6' placeholder="Cantidad" >
                                    <option>Cantidad</option>
                                </select>
                                <select className='form-select block w-full rounded-md border-0 py-2 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6' placeholder="Proveedor" >
                                    <option>Proveedor</option>
                                </select>
                            </form>
                            <button className='bg-gradient-to-bl hover:bg-gradient-to-tr from-amber-500 via-yellow-400 to-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer'>Solicitar</button>
                        </div>
                    </div>
                    <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-t-[2rem]"></div>
                    </div>
                    <div className="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2">
                    <div className="absolute inset-px rounded-lg bg-white dark:bg-stone-700 dark:text-stone-100"></div>
                    <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                        <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                            <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white max-lg:text-center">
                                Detalle de solicitud
                            </p>
                            <p className='text-red-600'> Delete</p>
                            <label>Conteo de productos solicitados: 1</label>
                            <button className='bg-gradient-to-bl hover:bg-gradient-to-tr from-amber-500 via-yellow-400 to-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer'>Completar</button>
                        </div>
                    </div>
                    <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5"></div>
                    </div>
                    <div className="relative lg:row-span-2">
                    <div className="absolute inset-px rounded-lg bg-white dark:bg-stone-700 dark:text-stone-100 max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]"></div>
                        <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-r-[calc(2rem+1px)]">
                            <div className="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
                                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white max-lg:text-center">
                                    Productos Solicitados por fecha
                                </p>
                            </div>
                            <div className='px-2 overflow-auto'>
                                <table className="w-[845px] text-sm text-left text-gray-500 dark:text-gray-200 shadow-sm">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-500 dark:text-gray-100">
                                        <tr>
                                            <th className='p-1'>Refacción</th>
                                            <th className='p-1'>Cantidad</th>
                                            <th className='p-1'>Proveedor</th>
                                            <th className='p-1'>Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className='border-b dark:border-gray-700 bg-white dark:bg-slate-400 relative'>
                                        <tr>
                                            <td className='p-1'>Refacción</td>
                                            <td className='p-1'>Cantidad</td>
                                            <td className='p-1'>Proveedor</td>
                                            <td className='p-1'>Fecha</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
    )
}
