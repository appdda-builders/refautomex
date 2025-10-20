import React, { useState, useEffect, useRef } from 'react';
import { MdDelete, MdAutorenew } from "react-icons/md";
import { IoText } from 'react-icons/io5';
import Select from 'react-select';

const customStyles = {
    control: (provided, state) => ({
        ...provided,
        minHeight: '24px',
        height: '24px',
        fontSize: '12px',
        backgroundColor: 'white',
        borderColor: 'gray',
        boxShadow: 'none',
        '&:hover': {
            borderColor: 'blue',
        },
    }),
    valueContainer: (provided) => ({
        ...provided,
        height: '24px',
        padding: '0 6px',
        color: 'white',
    }),
    input: (provided) => ({
        ...provided,
        margin: '0px',
        color: 'black',
    }),
    indicatorsContainer: (provided) => ({
        ...provided,
        height: '24px',
        color: 'white',
    }),
    dropdownIndicator: (provided) => ({
        ...provided,
        padding: '0px',
        color: 'white',
    }),
    clearIndicator: (provided) => ({
        ...provided,
        padding: '0px',
        color: 'white',
    }),
    singleValue: (provided) => ({
        ...provided,
        fontSize: '12px',
        color: 'black',
    }),
    menu: (provided) => ({
        ...provided,
        zIndex: 9999,
    }),
    className: 'block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
};

export default function TableSales({ items, buttonConfigs, completeConfigs, onRemoveProduct, onUpdateProduct, handleMouseEnter, handleMouseLeave, onShowTextArea, visibleTooltip, discount, folio, onDiscountChange, onTogglePedido, setItems, handleAddNote, notes }) {
    const [quantities, setQuantities] = useState(() =>
        items.reduce((acc, item) => ({ ...acc, [item.refaccion]: item.cantidad || 1 }), {})
    );
    const [prices, setPrices] = useState(() =>
        items.reduce((acc, item) => ({ ...acc, [item.refaccion]: item.precio }), {})
    );
    const [aIvas, setAIvas] = useState(() =>
        items.reduce((acc, item) => ({
            ...acc,
            [item.refaccion]: (item.precio / 1.16).toFixed(2)
        }), {})
    );

    const [warnings, setWarnings] = useState({});

    const prevItemsRef = useRef(items);
    const prevQuantitiesRef = useRef(quantities);
    const prevPricesRef = useRef(prices);

    useEffect(() => {
        const hasItemsChanged = JSON.stringify(prevItemsRef.current) !== JSON.stringify(items);
        const hasQuantitiesChanged = JSON.stringify(prevQuantitiesRef.current) !== JSON.stringify(quantities);
        const hasPricesChanged = JSON.stringify(prevPricesRef.current) !== JSON.stringify(prices);

        if (hasItemsChanged || hasQuantitiesChanged || hasPricesChanged) {
            const newItems = items.map((item) => {
                const price = parseFloat(prices[item.refaccion]) || parseFloat(item.precio);
                const calculatedAIva = (price / 1.16).toFixed(2);
                const monto = (quantities[item.refaccion] || 1) * price;

                return {
                    ...item,
                    monto: monto,
                    aIva: aIvas[item.refaccion] !== undefined ? aIvas[item.refaccion] : calculatedAIva
                };
            });

            onUpdateProduct(newItems);
            prevItemsRef.current = items;
            prevQuantitiesRef.current = quantities;
            prevPricesRef.current = prices;
        }
    }, [items, quantities, prices, aIvas, onUpdateProduct]);

    const handleQuantityChange = (product, selectedOption) => {
        const newQuantity = selectedOption.value;
        setQuantities(prevQuantities => ({ ...prevQuantities, [product.refaccion]: newQuantity }));
        setItems(prevItems =>
            prevItems.map(item =>
                item.refaccion === product.refaccion ? { ...item, cantidad: newQuantity } : item
            )
        );
    };

    const handlePriceChange = (product, event) => {
        const newPrice = parseFloat(event.target.value);

        if (isNaN(newPrice) || newPrice <= 0) {
            setPrices(prevPrices => ({ ...prevPrices, [product.refaccion]: "" }));
            setWarnings(prevWarnings => ({
                ...prevWarnings,
                [product.refaccion]: "El precio no puede ser cero o vacío"
            }));
        } else {
            setPrices(prevPrices => ({ ...prevPrices, [product.refaccion]: newPrice }));
            const calculatedAIva = (newPrice / 1.16).toFixed(2);

            setAIvas(prevAIvas => ({ ...prevAIvas, [product.refaccion]: calculatedAIva }));
            const newMonto = (quantities[product.refaccion] || 1) * newPrice;

            setItems(prevItems =>
                prevItems.map(item =>
                    item.refaccion === product.refaccion
                        ? { ...item, precio: newPrice, monto: newMonto }
                        : item
                )
            );

            setWarnings(prevWarnings => ({
                ...prevWarnings,
                [product.refaccion]: newPrice < product.precio
                    ? "El precio es menor al permitido por el producto"
                    : (newMonto <= 0 ? "El monto es cero o menor" : "")
            }));
        }
    };


    const handlePriceBlur = (product) => {
        if (prices[product.refaccion] === "" || prices[product.refaccion] < product.precio) {
            setPrices(prevPrices => ({ ...prevPrices, [product.refaccion]: product.precio }));
            setAIvas(prevAIvas => ({ ...prevAIvas, [product.refaccion]: (product.precio / 1.16).toFixed(2) }));
            setWarnings(prevWarnings => ({
                ...prevWarnings,
                [product.refaccion]: ""
            }));
        }
    };

    const handlePriceFocus = (product) => {
        setPrices(prevPrices => ({ ...prevPrices, [product.refaccion]: "" }));
    };

    const handleAivaChange = (product, event) => {
        const newAiva = parseFloat(event.target.value);
        if (!isNaN(newAiva) && newAiva > 0) {
            setAIvas(prevAIvas => ({ ...prevAIvas, [product.refaccion]: newAiva }));
            const newPrice = (newAiva * 1.16).toFixed(2);
            setPrices(prevPrices => ({ ...prevPrices, [product.refaccion]: newPrice }));
            const newMonto = (quantities[product.refaccion] || 1) * newPrice;
            setItems(prevItems =>
                prevItems.map(item =>
                    item.refaccion === product.refaccion ? { ...item, monto: newMonto } : item
                )
            );
            setWarnings(prevWarnings => ({
                ...prevWarnings,
                [product.refaccion]: newMonto <= 0 ? "El monto no puede ser cero" : ""
            }));
        } else {
            setWarnings(prevWarnings => ({
                ...prevWarnings,
                [product.refaccion]: "El AIVA debe ser mayor a cero"
            }));
        }
    };

    const handleAivaBlur = (product) => {
        const currentAiva = parseFloat(aIvas[product.refaccion]);
        if (isNaN(currentAiva) || currentAiva === "") {
            const defaultAIva = (product.precio / 1.16).toFixed(2);
            setAIvas(prevAIvas => ({ ...prevAIvas, [product.refaccion]: defaultAIva }));
        } else {
            const newPrice = (currentAiva * 1.16).toFixed(2);
            setPrices(prevPrices => ({ ...prevPrices, [product.refaccion]: newPrice }));
        }
    };
    const handleAivaFocus = (product) => {
        setAIvas(prevAIvas => ({ ...prevAIvas, [product.refaccion]: "" }));
    };

    const handleDescriptionChange = (product, index, newDescription) => {
        setItems(prevItems =>
            prevItems.map((itm, i) => i === index ? { ...itm, descripcion: newDescription } : itm)
        );

        setWarnings(prevWarnings => ({
            ...prevWarnings,
            [product.refaccion]: newDescription.trim() === "" ? "La descripción no puede estar vacía" : ""
        }));
    };

    const handleDescriptionFocus = (product) => {
        setWarnings(prevWarnings => ({
            ...prevWarnings,
            [product.refaccion]: ""
        }));
    };

    const handleRemoveClick = (product) => {
        onRemoveProduct(product.refaccion);
        setQuantities(prevQuantities => {
            const newQuantities = { ...prevQuantities };
            delete newQuantities[product.refaccion];
            return newQuantities;
        });
        setPrices(prevPrices => {
            const newPrices = { ...prevPrices };
            delete newPrices[product.refaccion];
            return newPrices;
        });
        setAIvas(prevAIvas => {
            const newAIvas = { ...prevAIvas };
            delete newAIvas[product.refaccion];
            return newAIvas;
        });
        setWarnings(prevWarnings => {
            const newWarnings = { ...prevWarnings };
            delete newWarnings[product.refaccion];
            return newWarnings;
        });
    };

    const quantityOptions = Array.from({ length: 300 }, (_, i) => ({ value: i + 1, label: (i + 1).toString() }));
    const discountOptions = [
        { value: 0, label: '0%' },
        { value: 5, label: '5%' },
        { value: 8, label: '8%' },
        { value: 10, label: '10%' }
    ];

    const subtotal = items.reduce((acc, item) => acc + (quantities[item.refaccion] || 1) * (parseFloat(prices[item.refaccion]) || parseFloat(item.precio)), 0);
    const discountAmount = subtotal * discount / 100;
    const totalWithDiscount = subtotal - discountAmount;

    return (
        <div className="h-[683px] bg-gray-100 dark:bg-stone-800 rounded-2xl my-5 flex shadow relative">
            <div className='flex flex-col px-1 bg-gray-300 dark:bg-stone-900 rounded-l-2xl pt-5 relative'>
                {!folio ? (
                    buttonConfigs.map(({ icon: Icon, label, id, event, btnconf }) => (
                        <div
                            key={id}
                            className={btnconf}
                            onMouseEnter={() => handleMouseEnter(id)}
                            onMouseLeave={() => handleMouseLeave(id)}
                            onClick={event}
                        >
                            <Icon />
                            {visibleTooltip[id] && (
                                <div className="tooltip-content absolute left-full ml-3 top-1/2 transform -translate-y-1/2 opacity-90 dark:bg-gray-900 bg-gray-300 shadow dark:text-white text-black text-xs rounded px-2 py-1 z-10"
                                    style={{ width: 'max-content', maxWidth: '16rem' }}>
                                    {label}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    completeConfigs.map(({ icon: Icon, label, id, event, btnconf }) => (
                        <div
                            key={id}
                            className={btnconf}
                            onMouseEnter={() => handleMouseEnter(id)}
                            onMouseLeave={() => handleMouseLeave(id)}
                            onClick={event}
                        >
                            <Icon />
                            {visibleTooltip[id] && (
                                <div className="tooltip-content absolute left-full ml-3 top-1/2 transform -translate-y-1/2 opacity-90 dark:bg-gray-900 bg-gray-300 shadow dark:text-white text-black text-xs rounded px-2 py-1 z-10"
                                    style={{ width: 'max-content', maxWidth: '16rem' }}>
                                    {label}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            <div className="flex flex-col overflow-x-scroll pt-5 lg:mx-1">
                <table className="w-[845px] xl:w-[900px] text-sm text-left text-gray-500 dark:text-gray-400 shadow-sm">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="p-3">REFACCIÓN</th>
                            <th className="p-3">CANTIDAD</th>
                            <th className="p-3">DESCRIPCIÓN</th>
                            <th className="p-3">A.IVA</th>
                            <th className="p-3">PRECIO</th>
                            <th className="p-3">MONTO</th>
                            <th className="p-3">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const price = parseFloat(prices[item.refaccion]) || parseFloat(item.precio);
                            const aiva = parseFloat(aIvas[item.refaccion]) || (price / 1.16).toFixed(2);
                            const monto = (quantities[item.refaccion] || 1) * price;
                            return (
                                <tr
                                    className={`${item.isPedido ? 'bg-blue-200 dark:bg-blue-950' : item.existencia === 0 ? 'bg-red-200 dark:dark:bg-red-950' : 'bg-white dark:bg-gray-800'} border-b dark:border-gray-700 relative`}
                                    key={index}
                                >
                                    <td className="p-4">
                                        <div className='italic text-xs flex flex-col justify-center items-center'>
                                            <div className='text-base'>
                                            {item.refaccion}
                                            </div>
                                            <div>
                                            <input
                                                type="checkbox"
                                                className='h-3 w-3 rounded border-gray-300 text-amber-600 focus:ring-amber-600 mr-2 -ml-3'
                                                checked={item.isPedido || false}
                                                onChange={() => onTogglePedido(item.refaccion)}
                                                disabled={!!folio}
                                            />
                                            pedir
                                            </div>
                                        </div>
                                        {warnings[item.refaccion] && (
                                            <div className="absolute left-1/3 bottom-[1px] z-10 text-xs text-yellow-500 dark:text-yellow-300 bg-white dark:bg-slate-900 shadow p-[1.2px] rounded-md font-bold animate-out">
                                                {warnings[item.refaccion]}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4">
                                        <Select
                                            value={quantityOptions.find(option => option.value === (quantities[item.refaccion] || 1))}
                                            onChange={(selectedOption) => handleQuantityChange(item, selectedOption)}
                                            options={quantityOptions}
                                            styles={customStyles}
                                            isDisabled={!!folio}
                                        />
                                    </td>
                                    <td className="p-4">
                                        {item.isEditable ? (
                                            <input
                                            type="text"
                                            value={item.descripcion}
                                            onChange={(e) => handleDescriptionChange(item, index, e.target.value)}
                                            onFocus={() => handleDescriptionFocus(item)}
                                            disabled={!!folio}
                                            placeholder='Descripción'
                                            className={`w-full px-2 py-1 border rounded text-xs focus:ring-blue-500 focus:border-blue-500 uppercase
                                                ${item.descripcion.trim() === "" ? "border-red-400 bg-red-100 dark:border-red-200 dark:bg-red-300" : "border-gray-300 bg-gray-50"}
                                                dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
                                            />
                                        ) : (
                                            <span>{item.descripcion}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                    {item.isSeminew ? (
                                        <input
                                            type="number"
                                            value={aIvas[item.refaccion] !== undefined ? aIvas[item.refaccion] : item.aIva}
                                            onChange={(event) => handleAivaChange(item, event)}
                                            onBlur={() => handleAivaBlur(item)}
                                            onFocus={() => handleAivaFocus(item)}
                                            disabled={!!folio}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        />
                                    ) : (
                                        <span>{aiva}</span>
                                    )}
                                    </td>
                                    <td className="p-4 relative">
                                        {item.isSeminew ? (
                                            <span>{price}</span>
                                        ) : (
                                            <input
                                                type="number"
                                                value={prices[item.refaccion] !== undefined ? prices[item.refaccion] : item.precio}
                                                onChange={(event) => handlePriceChange(item, event)}
                                                onBlur={() => handlePriceBlur(item)}
                                                onFocus={() => handlePriceFocus(item)}
                                                className={`block w-full px-2 text-gray-900 border border-gray-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500 ${prices[item.refaccion] === "" ? "bg-red-200 dark:bg-red-100" : "bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"}`}
                                                disabled={!!folio}
                                            />
                                        )}
                                    </td>
                                    <td className="p-4">{monto.toFixed(2)}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleRemoveClick(item)}
                                            className="bg-red-500 text-white rounded-full p-2 hover:bg-red-700"
                                            disabled={!!folio}
                                        >
                                            <MdDelete />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {onShowTextArea === 'block' && (
                            <tr className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 relative">
                                <td className='gray-circle-button absolute translate-x-1/2 translate-y-1/2 left-4 -top-2'>
                                    <IoText className="text-2xl text-blue-200" />
                                    <span></span>
                                </td>
                                <td colSpan="6" className="p-4">
                                <textarea
                                    id="nota"
                                    name="nota"
                                    value={notes}
                                    onChange={(e) => handleAddNote(e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-blue-500 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 uppercase"
                                    placeholder="Pagado por entregar (¿Que?)"
                                    rows="3"
                                    maxLength="80"
                                    disabled={!!folio}
                                />
                                </td>
                            </tr>
                        )}
                        <tr className="bg-slate-200 border-b dark:bg-gray-900 dark:border-gray-500">
                            <td className="py-4 px-3 font-bold">DESCUENTO:</td>
                            <td className="py-4 px-1 font-bold text-md text-slate-500 dark:text-stone-300" colSpan="5">
                                {discountAmount.toFixed(2)} MXN
                            </td>
                            <td className="py-4 px-1">
                                <Select
                                    value={discountOptions.find(option => option.value === discount)}
                                    onChange={onDiscountChange}
                                    options={discountOptions}
                                    styles={customStyles}
                                    isDisabled={true} // {!!folio} Deshabilitar cuando hay folio
                                />
                            </td>
                        </tr>
                        <tr className="bg-slate-200 border-b dark:bg-gray-900 dark:border-gray-500">
                            <td className="py-4 px-3 font-bold">SUBTOTAL:</td>
                            <td className="py-4 px-1 font-bold text-md text-slate-500 dark:text-stone-300" colSpan="6">
                                {subtotal.toFixed(2)} MXN
                            </td>
                        </tr>

                        <tr className="bg-slate-200 border-b dark:bg-gray-900 dark:border-gray-500">
                            <td className="py-4 px-3 font-bold">TOTAL:</td>
                            <td className="py-4 px-1 font-bold text-xl text-green-600 dark:text-green-400" colSpan="6">
                                {totalWithDiscount.toFixed(2)} MXN
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
