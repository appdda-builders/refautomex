import React, { useEffect, useState, useRef} from 'react';
import { useReactToPrint } from 'react-to-print';
import { MdDelete, MdEditSquare } from "react-icons/md";
import Select from 'react-select';
import { LuListRestart } from "react-icons/lu";
import { CiBoxList } from "react-icons/ci";
import axios from 'axios';
import { buildApiUrl } from '@/app/lib/refautomex-api';

export default function TableDescription({ items, buttonConfigs, onRemoveProduct, onUpdateProduct, handleMouseEnter, handleMouseLeave, visibleTooltip, onEditClick }) {
    const [QuantityOptions, setQuantityOptions] = useState([]);
    const listRef = useRef();

    const handleQuantityChange = (product, selectedOption) => {
        const newQuantity = selectedOption.value;
        onUpdateProduct(
            items.map(item =>
                item.refaccion === product.refaccion
                    ? { ...item, existencia: newQuantity }
                    : item
            )
        );
    };

    const handleListPrint = useReactToPrint({
        content: () => listRef.current,
        onAfterPrint: () => {
            // Opcional: alguna acción después de imprimir
            console.log('Etiquetas impresas');
        }
    });

    const handleLocationChange = (product, event) => {
        const newLocation = event.target.value;
        onUpdateProduct(items.map(item => item.refaccion === product.refaccion ? { ...item, localizacion: newLocation } : item));
    };

    const handleDescriptionChange = (product, event) => {
        const newDescription = event.target.value;
        onUpdateProduct(items.map(item => item.refaccion === product.refaccion ? { ...item, descripcion: newDescription } : item));
    };

    const handleRemoveClick = (product) => {
        onRemoveProduct(product.refaccion);
    };

    const handleClearTable = () => {
        items.forEach(item => onRemoveProduct(item.refaccion));
    };

    useEffect(() => {
        const fetchQuantity = async () => {
            try {
                const response = await axios.get(buildApiUrl('/getQuantity'));
                const formattedQuantityOptions = response.data.map(cantidad => ({
                    value: cantidad.idCantidad,
                    label: cantidad.cantidad
                }));
                setQuantityOptions(formattedQuantityOptions);
            } catch (error) {
                console.error('Error fetching Quantity:', error);
            }
        };

        fetchQuantity();
    }, []);

    return (
        <div className="h-[690px] bg-[rgb(var(--color-card))] rounded-2xl my-5 flex shadow relative">
            <div className='flex flex-col px-1 bg-[rgb(var(--color-card-white))] rounded-l-2xl pt-5 relative'>
                {buttonConfigs.map(({ icon: Icon, label, id, event, btnconf }) => (
                    <div
                        key={id}
                        className={btnconf}
                        onMouseEnter={() => handleMouseEnter(id)}
                        onMouseLeave={() => handleMouseLeave(id)}
                        onClick={event}
                    >
                        <Icon />
                        {visibleTooltip[id] && (
                            <div className="tooltip-content absolute left-full ml-3 top-1/2 transform -translate-y-1/2 opacity-90 bg-[rgb(var(--color-card))] shadow text-[rgb(var(--color-text))] text-xs rounded px-2 py-1 z-10"
                                style={{ width: 'max-content', maxWidth: '16rem' }}>
                                {label}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex flex-col overflow-x-scroll w-full">
                <table ref={listRef} className="w-full text-sm text-left text-[rgb(var(--color-text))] shadow-sm">
                    <thead className="text-xs text-[rgb(var(--color-text))] uppercase bg-[rgb(var(--color-card))]">
                        <tr>
                            <th className="p-1">REFACCIÓN</th>
                            <th className="p-1">DESCRIPCIÓN</th>
                            <th className="p-1">LOCALIZACIÓN</th>
                            <th className="p-1">EXISTENCIA</th>
                            <th className='p-1 flex flex-row'>
                            <button
                                onClick={handleListPrint}
                                className="bg-gray-700 text-white rounded-full p-1.5 m-0.5 self-center flex items-center"
                            >
                                <CiBoxList className="text-lg" />
                            </button>
                            <button
                                onClick={handleClearTable}
                                className="bg-red-700 text-white rounded-full p-1.5 m-0.5 self-center flex items-center"
                            >
                                <LuListRestart className="text-lg" />
                            </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            return (
                                <tr
                                    className={`${item.isPedido ? 'bg-blue-200' : item.existencia === 0 ? 'bg-[rgb(var(--color-error-base))]' : 'bg-[rgb(var(--color-card-white))]'} border-b border-[rgb(var(--color-border))] relative`}
                                    key={index}
                                >
                                    <td className="p-2">
                                        <div className='italic text-xs flex flex-col justify-center items-start'>
                                            <div className='text-base w-32'>
                                            <button
                                                onClick={() => onEditClick(item)}
                                                className="bg-amber-400 mr-1 text-white rounded-full p-1 hover:bg-yellow-600"
                                            >
                                                <MdEditSquare />
                                            </button>
                                            {item.refaccion}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.descripcion}
                                            onChange={(event) => handleDescriptionChange(item, event)}
                                            className="block w-96 md:w-96 p-1 text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] rounded-lg bg-[rgb(var(--color-card))] text-xs focus:ring-blue-500 focus:border-blue-500 placeholder:text-[rgb(var(--color-text))] placeholder:opacity-60 uppercase"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.localizacion}
                                            onChange={(event) => handleLocationChange(item, event)}
                                            className="block p-1 text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] rounded-lg bg-[rgb(var(--color-card))] text-xs focus:ring-blue-500 focus:border-blue-500 placeholder:text-[rgb(var(--color-text))] placeholder:opacity-60"
                                        />
                                    </td>
                                    <td className="py-2">
                                        <Select
                                            id="existencia"
                                            name="existencia"
                                            value={QuantityOptions.find(option => option.value === item.existencia)}
                                            onChange={(selectedOption) => handleQuantityChange(item, selectedOption)}
                                            options={QuantityOptions}
                                            classNamePrefix="react-select"
                                            className='m-0 p-0 w-20'
                                        />
                                    </td>
                                    <td className="p-2">
                                        <button
                                            onClick={() => handleRemoveClick(item)}
                                            className="bg-red-500 mx-2 text-white rounded-full p-2 hover:bg-red-700"
                                        >
                                            <MdDelete />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        <tr className="bg-[rgb(var(--color-card))] border-b border-[rgb(var(--color-border))]">
                            <td className="py-2 font-bold text-xl text-amber-500" colSpan="7">
                                <div className='flex justify-center items-center'>
                                    <span className='px-2 text-[rgb(var(--color-text))] italic'>
                                        PRODUCTOS
                                    </span>
                                    <span className="px-2 bg-amber-500 text-white font-semibold rounded-full h-10 w-10 text-md flex items-center justify-center shadow-lg">
                                        {items.length}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
