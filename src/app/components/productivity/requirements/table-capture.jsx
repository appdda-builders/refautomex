import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { MdDelete } from "react-icons/md";
import { IoText } from 'react-icons/io5';
import { RiCoinsFill } from "react-icons/ri";
import { MdDeleteSweep } from "react-icons/md";
import { FaUnlock, FaLock } from "react-icons/fa";
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
    className: 'block w-full p-2 text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] rounded-lg bg-[rgb(var(--color-card))] text-xs focus:ring-blue-500 focus:border-blue-500 placeholder:text-[rgb(var(--color-text))] placeholder:opacity-60'
};

const TableCapture = forwardRef(({
    items,
    setItems,
    onRemoveProduct,
    onUpdateProduct,
    onShowTextArea,
    folio
}, ref) => {

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
    const [error, setError] = useState('');
    const [discountRows, setDiscountRows] = useState({});


    // Exponer funciones al padre
    useImperativeHandle(ref, () => ({
        handleDiscountRow
    }));

    const handleQuantityChange = (product, selectedOption) => {
        const newQuantity = selectedOption.value;
        setQuantities(prevQuantities => ({ ...prevQuantities, [product.refaccion]: newQuantity }));
        setItems(prevItems =>
            prevItems.map(item =>
                item.refaccion === product.refaccion ? { ...item, cantidad: newQuantity } : item
            )
        );
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

    const handleDiscountRow = (productRef, discountValue = 0, isGeneral = false) => {
        const numericDiscount = Number(discountValue);

        if (isNaN(numericDiscount) || numericDiscount < 0 || numericDiscount > 1) {
            setError('El descuento debe ser entre 0.0 y 1.0');
            return;
        }
        if (isGeneral) {

            const hasSpace = items.every(item =>
                (discountRows[item.refaccion]?.length || 0) < 3
            );

            const unconfirmedWarnings = {};
            let anyHasUnconfirmed = false;

            items.forEach(item => {
                const ref = item.refaccion;
                if ((discountRows[ref] || []).some(d => !d.confirmed)) {
                    unconfirmedWarnings[ref] = 'Confirma el descuento actual antes de agregar otro.';
                    anyHasUnconfirmed = true;
                }
            });

            if (anyHasUnconfirmed) {
                setWarnings(prev => ({ ...prev, ...unconfirmedWarnings }));
                return;
            }


            if (!hasSpace) {
                setWarnings(prev => ({
                    ...prev,
                    [productRef]: 'Uno o más productos ya tienen 3 descuento'
                }));
                return;
            }

            const newDiscountRows = { ...discountRows };

            const updatedItems = items.map(item => {
                const ref = item.refaccion;
                const originalPrice = item.precioInicial || item.precio;
                const currentDiscounts = (newDiscountRows[ref] || []).filter(d => d.confirmed);
                const newDiscount = {
                    id: Date.now() + Math.random(),
                    value: numericDiscount,
                    isGeneral: true,
                    confirmed: true
                };
                const allDiscounts = [...currentDiscounts, newDiscount];

                // Calcular descuentos compuestos
                let cumulativePrice = originalPrice;
                const discountHistory = allDiscounts.map(d => {
                    const previous = cumulativePrice;
                    const discountedAmount = previous * d.value;
                    cumulativePrice = previous - discountedAmount;
                    return {
                        value: d.value,
                        previous,
                        discountedAmount
                    };
                });

                const newMonto = (quantities[ref] || 1) * cumulativePrice;

                // Actualizar filas de descuento
                newDiscountRows[ref] = [...(newDiscountRows[ref] || []), newDiscount];

                return {
                    ...item,
                    precio: cumulativePrice,
                    monto: newMonto,
                    discountHistory
                };
            });

            setDiscountRows(newDiscountRows);
            setItems(updatedItems);

        } else {
            // Descuento específico
            setDiscountRows(prev => {
                const current = prev[productRef] || [];
                const hasUnconfirmed = current.some(d => !d.confirmed);

                if (current.length >= 3) {
                    setError('Máximo 3 descuentos por producto');
                    return prev;
                }
                if (hasUnconfirmed) {
                    setError('Confirma el descuento actual antes de agregar otro');
                    return prev;
                }

                return {
                    ...prev,
                    [productRef]: [
                        ...current,
                        {
                            id: Date.now() + Math.random(),
                            value: numericDiscount,
                            isGeneral: false,
                            confirmed: false
                        }
                    ]
                };
            });
        }
        setError('');
        setWarnings(prev => {
            const newWarnings = { ...prev };
            delete newWarnings[productRef]; // or delete all keys inside loop for general
            return newWarnings;
        });
    };

const confirmDiscount = (productRef, discountId) => {
    setDiscountRows(prev => {
        const discountList = prev[productRef] || [];
        const target = discountList.find(d => d.id === discountId);

        if (!target || target.value <= 0) {
            setError("No se puede confirmar un descuento con valor 0 o vacío.");
            return prev;
        }

        return {
            ...prev,
            [productRef]: discountList.map(d =>
                d.id === discountId ? { ...d, confirmed: true } : d
            )
        };
    });
};


    const updateAllPrices = () => {
        setItems(prevItems => prevItems.map(item => {
            const originalPrice = item.precioInicial || item.precio;
            const confirmedDiscounts = (discountRows[item.refaccion] || []).filter(d => d.confirmed);
            let cumulativePrice = originalPrice;
            const discountHistory = confirmedDiscounts.map(d => {
                const previous = cumulativePrice;
                const discountedAmount = previous * d.value;
                cumulativePrice = previous - discountedAmount;
                return {
                    value: d.value,
                    previous,
                    discountedAmount
                };
            });

            const newMonto = (quantities[item.refaccion] || 1) * cumulativePrice;

            return {
                ...item,
                precio: cumulativePrice,
                monto: newMonto,
                discountHistory
            };
        }));
    };


    const handleRemoveLastDiscountRow = (productRef) => {
        setDiscountRows(prev => {
            const discounts = prev[productRef] || [];
            const confirmedDiscounts = discounts.filter(d => d.confirmed);
            const updated = discounts.slice(0, -1);
            const product = items.find(i => i.refaccion === productRef);
            const originalPrice = product.precioInicial || product.precio;
            const newPrice = confirmedDiscounts.slice(0, -1).reduce(
                (price, discount) => price * (1 - discount.value),
                originalPrice
            );

            if (discounts.length === 0) return prev;
            setItems(prevItems => prevItems.map(item =>
                item.refaccion === productRef ? {
                    ...item,
                    precio: newPrice,
                    precioInicial: originalPrice // Mantener referencia original
                } : item
            ));

            return { ...prev, [productRef]: updated };
        });
    };

    const handleDiscountChange = (productRef, discountId, value) => {
        let numericValue = Number(value);

        if (value !== "" && (isNaN(numericValue) || numericValue < 0.0001 || numericValue > 1)) {
            setError("El descuento debe estar entre 0.0001 y 1.0");
            return;
        }

        setDiscountRows(prev => {
            const updatedDiscounts = prev[productRef].map(d =>
                d.id === discountId ? { ...d, value: numericValue, confirmed: false } : d
            );

            const product = items.find(i => i.refaccion === productRef);
            const originalPrice = product.precioInicial;

            let cumulativePrice = originalPrice;
            const discountHistory = updatedDiscounts
                .filter(d => d.confirmed || d.id === discountId) // incluir actual en edición
                .map(d => {
                    const previous = cumulativePrice;
                    const discountedAmount = previous * d.value;
                    cumulativePrice = previous - discountedAmount;
                    return {
                        value: d.value,
                        previous,
                        discountedAmount
                    };
                });
    
            const newPrice = cumulativePrice;
            const newMonto = (quantities[productRef] || 1) * newPrice;
    
            setItems(prevItems => prevItems.map(item =>
                item.refaccion === productRef ? {
                    ...item,
                    precio: newPrice,
                    monto: newMonto,
                    precioInicial: originalPrice,
                    discountHistory
                } : item
            ));
    
            return {
                ...prev,
                [productRef]: updatedDiscounts
            };
        });
    };


    const quantityOptions = Array.from({ length: 300 }, (_, i) => ({ value: i + 1, label: (i + 1).toString() }));

    const neto = items.reduce((acc, item) => {
        const originalPrice = item.precioInicial || item.precio;
        return acc + (quantities[item.refaccion] || 1) * originalPrice;
    }, 0);

    const totalDiscount = items.reduce((acc, item) => {
        const ref = item.refaccion;
        const productDiscounts = (discountRows && discountRows[ref]) || [];
    
        const confirmedDiscounts = productDiscounts.filter(d => d.confirmed);
        const originalPrice = item.precioInicial || item.precio;
        let cumulativePrice = originalPrice;
    
        confirmedDiscounts.forEach(discount => {
            cumulativePrice *= 1 - discount.value;
        });
    
        const cantidad = quantities[ref] || 1;
        const montoSinDescuento = originalPrice * cantidad;
        const montoConDescuento = cumulativePrice * cantidad;
    
        const totalDescontado = montoSinDescuento - montoConDescuento;
    
        return acc + totalDescontado;
    }, 0);
    

    const subtotal = neto;
    const totalWithDiscount = subtotal - totalDiscount;

    return (
        <div className="h-[690px] bg-[rgb(var(--color-card))] rounded-2xl my-5 flex shadow relative justify-center">
            <div className="flex flex-col overflow-x-scroll pt-5 lg:mx-1">
                <table className="w-[845px] text-sm text-left text-[rgb(var(--color-text))] shadow-sm">
                    <thead className="text-xs text-[rgb(var(--color-text))] uppercase bg-[rgb(var(--color-card-white))]">
                        <tr>
                            <th className="p-3">REFACCIÓN</th>
                            <th className="p-3">DESCRIPCIÓN</th>
                            <th className="p-3">EXISTENCIA</th>
                            <th className="p-3">NUEVA CANTIDAD</th>
                            <th className="p-3">COSTO</th>
                            <th className="p-3">PRECIO DE VENTA</th>
                            <th className="p-3">DESCUENTO</th>
                            <th className="p-3">IMPORTE</th>
                            <th className="p-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const specificDiscounts = (discountRows && discountRows[item.refaccion]) || [];
                            const price = parseFloat(prices[item.refaccion]) || parseFloat(item.precio);
                            const aiva = parseFloat(aIvas[item.refaccion]) || (price / 1.16).toFixed(2);
                            const monto = (quantities[item.refaccion] || 1) * price;
                            return (
                                <>
                                    <tr
                                        className='bg-[rgb(var(--color-card-white))] border-b border-[rgb(var(--color-border))] relative'
                                        key={index}
                                    >
                                        {item.appliedDiscount !== null && (
                                        <>
                                        <td className="p-4">
                                            <div className='italic text-xs flex flex-col justify-center items-center'>
                                                <div className='text-base'>
                                                {item.refaccion}
                                                </div>
                                            </div>
                                            {warnings[item.refaccion] && (
                                                <div className="absolute left-1/3 bottom-[1px] z-10 text-xs text-[rgb(var(--color-amber))] bg-[rgb(var(--color-bg))] shadow p-[1.2px] rounded-md font-bold animate-out">
                                                    {warnings[item.refaccion]}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span>{item.descripcion}</span>
                                            {error && (
                                                <div className="absolute left-1/3 bottom-[1px] z-10 text-xs text-[rgb(var(--color-error))] bg-[rgb(var(--color-bg))] shadow p-[1.2px] rounded-md font-bold animate-out">
                                                    {error}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4">
                                        <td className="py-4 flex justify-center">
                                            <Select
                                                value={{ value: item.existencia, label: item.existencia.toString() }}
                                                isDisabled={true}
                                                styles={customStyles}
                                                className="pointer-events-none"
                                            />
                                        </td>
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
                                        <td className="p-2">
                                            <span>{aiva}</span>
                                        </td>
                                        <td className="p-1 relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={prices[item.refaccion] || item.precio}
                                            onChange={(e) => {
                                                const newPrice = parseFloat(e.target.value);
                                                if (!isNaN(newPrice)) {
                                                setPrices(prev => ({ ...prev, [item.refaccion]: newPrice }));
                                                setItems(prevItems => prevItems.map(prod =>
                                                    prod.refaccion === item.refaccion
                                                    ? {
                                                        ...prod,
                                                        precio: newPrice,
                                                        monto: newPrice * (quantities[item.refaccion] || 1),
                                                        precioInicial: prod.precioInicial ?? prod.precio
                                                        }
                                                    : prod
                                                ));
                                                }
                                            }}
                                            className="block w-full p-1 text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card))] text-xs focus:ring-blue-500 focus:border-blue-500 placeholder:text-[rgb(var(--color-text))] placeholder:opacity-60"
                                            disabled={!!folio}
                                        />

                                        </td>
                                        <td className='p-2'>
                                            <div
                                                className='flex flex-col justify-center items-center cursor-pointer'
                                                onClick={() => handleDiscountRow(item.refaccion)}
                                            >
                                                <div className='bg-yellow-500 rounded-full shadow h-5 w-5 flex items-center justify-center'>
                                                    <RiCoinsFill />
                                                </div>
                                                <span className='bg-[rgb(var(--color-card))] rounded-md mt-2 p-1'>Descuento</span>
                                            </div>
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
                                        </>
                                        )}
                                    </tr>
                                    {specificDiscounts.map((discountRow, discountIndex) => {
                                        const isLastRow = discountIndex === specificDiscounts.length - 1;
                                        const discountHistory = item.discountHistory || [];
                                        const entry = discountHistory[discountIndex]; // vincular con el mismo índice

                                        return (
                                            <tr key={discountRow.id} className="bg-[rgb(var(--color-card))] border-b border-[rgb(var(--color-border))]">
                                                <td colSpan="2" className="p-4 text-right font-bold">
                                                    Descuento Decimal:
                                                    <br />(0.0 - 1)
                                                </td>
                                                <td colSpan="2" className="p-4">
                                                    <input
                                                        type="number"
                                                        step="0.0001"
                                                        min="0.0001"
                                                        max="1"
                                                        value={discountRow.value}
                                                        disabled={discountRow.confirmed || discountRow.isGeneral}
                                                        className={`block w-full p-1 text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] rounded-md text-xs focus:ring-blue-500 focus:border-blue-500 placeholder:text-[rgb(var(--color-text))] placeholder:opacity-60 bg-[rgb(var(--color-card))] no-spin ${
                                                            discountRow.isGeneral ? 'bg-[rgb(var(--color-gray))] cursor-not-allowed' : 'bg-[rgb(var(--color-card))]'
                                                        }`}
                                                        onChange={(e) => handleDiscountChange(item.refaccion, discountRow.id, e.target.value)}
                                                    />
                                                    {!discountRow.confirmed && !discountRow.isGeneral ? (
                                                        <div className="flex justify-center items-center my-1">
                                                            <button
                                                                onClick={() => confirmDiscount(item.refaccion, discountRow.id)}
                                                                className='text-xs text-[rgb(var(--color-amber))] bg-[rgb(var(--color-bg))] shadow p-1 rounded-md font-bold animate-out cursor-pointer'
                                                            >
                                                                <FaUnlock />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-center items-center my-1">
                                                            <div className='text-xs text-[rgb(var(--color-text))] bg-[rgb(var(--color-card))] shadow p-1 rounded-md font-bold'>
                                                                <FaLock />
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td colSpan="2" className="p-2 text-right">
                                                    <div className="flex flex-col">
                                                        Porcentaje:
                                                        <span>{(discountRow.value * 100).toFixed(2)}%</span>
                                                    </div>
                                                </td>
                                                <td colSpan="2" className="p-2 text-right">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-[rgb(var(--color-text))]">
                                                            Anterior: {entry?.previous?.toFixed(2) || "0.00"} MXN
                                                        </span>
                                                        <span className="text-xs font-bold text-[rgb(var(--color-amber))]">
                                                            Descontado: {entry?.discountedAmount?.toFixed(2) || "0.00"} MXN
                                                        </span>
                                                    </div>
                                                </td>
                                                {isLastRow && (
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => handleRemoveLastDiscountRow(item.refaccion)}
                                                            className="bg-red-500 text-white rounded-full p-2 hover:bg-red-700"
                                                        >
                                                            <MdDeleteSweep />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </>
                            );
                        })}
                        {onShowTextArea === 'block' && (
                            <tr className="bg-[rgb(var(--color-card))] border-b border-[rgb(var(--color-border))] relative">
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
                                    className="w-full px-2 py-1 border border-[rgb(var(--color-border))] rounded text-xs text-blue-500 focus:ring-blue-500 focus:border-blue-500 bg-[rgb(var(--color-card))] uppercase text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text))] placeholder:opacity-60"
                                    placeholder="Pagado por entregar (¿Que?)"
                                    rows="3"
                                    maxLength="80"
                                    disabled={!!folio}
                                />
                                </td>
                            </tr>
                        )}
                        <tr className="bg-[rgb(var(--color-card-white))] border-b border-[rgb(var(--color-border))]">
                            <td className="py-4 px-3 font-bold">NETO:</td>
                            <td className="py-4 px-1 font-bold text-md text-[rgb(var(--color-text))]"
                                colSpan="8">
                                {neto.toFixed(2)} MXN
                            </td>
                        </tr>
                        <tr className="bg-[rgb(var(--color-card-white))] border-b border-[rgb(var(--color-border))]">
                            <td className="py-4 px-3 font-bold">DESCUENTO TOTAL:</td>
                            <td className="py-4 px-1 font-bold text-md text-[rgb(var(--color-text))]"
                                colSpan="8">
                                {totalDiscount.toFixed(2)} MXN
                            </td>
                        </tr>
                        <tr className="bg-[rgb(var(--color-card-white))] border-b border-[rgb(var(--color-border))]">
                            <td className="py-4 px-3 font-bold">SUBTOTAL:</td>
                            <td className="py-4 px-1 font-bold text-md text-[rgb(var(--color-text))]"
                                colSpan="8">
                                {subtotal.toFixed(2)} MXN
                            </td>
                        </tr>

                        <tr className="bg-[rgb(var(--color-card-white))] border-b border-[rgb(var(--color-border))]">
                            <td className="py-4 px-3 font-bold">TOTAL:</td>
                            <td className="py-4 px-1 font-bold text-xl text-green-600"
                                colSpan="8">
                                {totalWithDiscount.toFixed(2)} MXN
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
});

export default TableCapture;
