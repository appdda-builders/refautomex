import React, { useState, useRef, useEffect } from 'react';
import Title from '../title';
import { MdSell } from "react-icons/md";
import { IoBagAdd, IoTicket } from 'react-icons/io5';
import FindProducts from './find-products';
import { LiaListAlt } from "react-icons/lia";
import TableSales from './table-sales';
import { useReactToPrint } from 'react-to-print';
import ComponentToPrint from './component-print';
import ClientOrderModal from './client-order-modal';
import PaymentTypeModal from './payment-type-modal';
import RowTypeModal from './row-type-modal';
import { getStorageValue } from "@/app/lib/storage-values";
import axios from 'axios';
import { HiOutlineViewGridAdd } from "react-icons/hi";
import { MdAutorenew } from "react-icons/md";
import ListToPrint from './list-print';

const fetchNewSale = async (sale_data) => {
    try {
        const response = await axios.post('/api/dataManage?type=newSale', sale_data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data.folio;
    } catch (error) {
        alert("Imposible vender, por favor intenta nuevamente más tarde.");
        return null;
    }
};

const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-MX', options);
};

export default function Tickets() {
    const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
    const [visibleTooltip, setVisibleTooltip] = useState({});
    const [items, setItems] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showRowModal, setShowRowModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [paymentType, setPaymentType] = useState(null);
    const [globalIdCounter, setGlobalIdCounter] = useState(1);
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [dateOrder, setDateOrder] = useState('');
    const [clientName, setClientName] = useState('');
    const [employee, setEmployee] = useState('');
    const [folio, setFolio] = useState('');
    const [subtotal, setSubtotal] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [total, setTotal] = useState(0);
    const cognitoUserSession = getStorageValue('CognitoUserSession');
    const componentRef = useRef();
    const listRef = useRef();

    useEffect(() => {
        const username = cognitoUserSession.idToken.payload["cognito:username"];
        const userData = getStorageValue(`user_${username}`);
        setEmployee(userData?.nombre || '');
    }, [cognitoUserSession]);

    useEffect(() => {
        if (paymentType) {
            handleGenerateFolioAndPrint();
        }
        if(folio) {
            setShowPaymentModal(false);
            handlePrint();
        }
    }, [paymentType, folio]);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    const handlelistPrint = useReactToPrint({
        content: () => listRef.current,
    });

    const handleGenerateFolioAndPrint = async () => {
        const username = cognitoUserSession.idToken.payload["cognito:username"];
        const userData = getStorageValue(`user_${username}`);

        const sale_data = {
            fecha_venta: new Date().toISOString().split('T')[0],
            total_venta: total.toFixed(2),
            idusuario: userData?.idusuario || 1,
            status: 'A',
            idmetodo: paymentType,
            telefono: phone,
            email: email,
            fecha_entrega: dateOrder,
            fecha_pedido: new Date().toISOString().split('T')[0],
            nombre_cliente: clientName,
            isOrder: items.some(item => item.isPedido),
            tipo: 'T',
            notas: notes,
            items: items.map(item => ({
                refaccion: item.refaccion,
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                aIva: parseFloat(item.aIva).toFixed(2),
                precio: parseFloat(item.precio).toFixed(2),
                monto: parseFloat(item.monto).toFixed(2),
                existencia: item.existencia,
                isSeminew: item.isSeminew ? 'S' : 'N',
                isEditable: item.isEditable ? true : false,
                isPedido: item.isPedido,
            }))
        };

        try {
            if (!folio) {
                const generatedFolio = await fetchNewSale(sale_data);
                if (generatedFolio) {
                    setFolio(generatedFolio);
                }
            }
        } catch (error) {
            alert("Error generating folio:", error);
        }
    };

    const handlePaymentTypeSubmit = (paymentId) => {
        setPaymentType(paymentId);
        togglePaymentModal();
    };

    const handleRowTypeSubmit = ({ type }) => {
        const isSeminew = type === 'seminuevo';
        const newRow = {
            refaccion: `${isSeminew ? 'SEMI' : 'NEW'}-${globalIdCounter}`,
            descripcion: '',
            aIva: 0,
            precio: 0 ,
            cantidad: 1,
            monto: 0,
            isSeminew: isSeminew,
            isEditable: true,
        };
        setGlobalIdCounter(prev => prev + 1);
        setItems(prevItems => [...prevItems, newRow]);
        toggleRowModal();
    };

    const handleOnlyPrint = () => {
        if (folio) {
            setShowPaymentModal(false);
            handlePrint();
        } else {
            setShowPaymentModal(true);
        }
    };

    const handleClientData = () => {
        setShowModal(true);
    };

    const handleRowData = () => {
        setShowRowModal(true);
    };

    const handleModalSubmit = (formData, hasAccount) => {
        setPhone(formData.telefono);
        setEmail(formData.email);
        setDateOrder(formData.fechaEntrega);
        setClientName(formData.nombreCompleto);
        toggleModal();
        setShowPaymentModal(true);
    };

    const toggleModal = () => {
        setShowModal(!showModal);
    };

    const togglePaymentModal = () => {
        setShowPaymentModal(!showPaymentModal);
    };

    const toggleRowModal = () => {
        setShowRowModal(!showRowModal);
    };

    const handleAddProduct = (product) => {
        setItems(prevItems => {
            const exists = prevItems.some(item => item.refaccion === product.refaccion);
            const updatedItems = exists
                ? prevItems.filter(item => item.refaccion !== product.refaccion)
                : [...prevItems, { ...product, monto: Math.ceil(product.precio * product.cantidad) }];
            updateTotals(updatedItems, discount);
            return updatedItems;
        });
    };

    const handleAddNote = (note) => {
        setNotes(note);
    }

    const handleRemoveProduct = (refaccion) => {
        setItems(prevItems => {
            const updatedItems = prevItems.filter(item => item.refaccion !== refaccion);
            updateTotals(updatedItems, discount);
            return updatedItems;
        });
    };

    const handleUpdateProduct = (updatedItems) => {
        setItems(prevItems => {
            if (JSON.stringify(prevItems) !== JSON.stringify(updatedItems)) {
                updateTotals(updatedItems, discount);
                return updatedItems;
            }
            return prevItems;
        });
    };

    const handleDiscountChange = (selectedOption) => {
        setDiscount(selectedOption.value);
        updateTotals(items, selectedOption.value);
    };

    const updateTotals = (items, discount) => {
        const newSubtotal = items.reduce((acc, item) => acc + item.monto, 0);
        setSubtotal(newSubtotal);
        const discountAmount = newSubtotal * discount / 100;
        const newTotal = newSubtotal - discountAmount;
        setTotal(newTotal);
    };

    const handleMouseEnter = (id) => {
        setVisibleTooltip(prev => ({ ...prev, [id]: true }));
    };

    const handleMouseLeave = (id) => {
        setVisibleTooltip(prev => ({ ...prev, [id]: false }));
    };

    const handleTogglePedido = (refaccion) => {
        setItems(prevItems => {
            const updatedItems = prevItems.map(item =>
                item.refaccion === refaccion ? { ...item, isPedido: !item.isPedido } : item
            );
            updateTotals(updatedItems, discount);
            return updatedItems;
        });
    };

    const hasPedido = items.some(item => item.isPedido);
    const ceroExistencia = items.some(item => item.existencia === 0);
    const ceroMonto = items.some(item => item.monto === 0);
    const ceroTotal = total <= 0;
    const ceroItems = items.length === 0;
    const noDescription = items.some(item => item.descripcion.trim() === '');

    const validaHiddenTicket = hasPedido || ceroExistencia || ceroMonto || ceroTotal || ceroItems || noDescription ? 'hidden' : 'block';
    const validaBlockPedido = hasPedido && !(ceroMonto || ceroTotal || ceroItems || noDescription) ? 'block' : 'hidden';
    const validaTextArea = hasPedido ? 'block' : 'hidden';
    const validaHiddenLista = ceroItems ? 'hidden' : 'block';

    const buttonConfigs = [
        {
            icon: HiOutlineViewGridAdd,
            btnconf: `relative blue-circle-button tooltip-button`,
            label: 'Agregar',
            id: 'addrow',
            path: '',
            event: handleRowData
        },
        {
            icon: LiaListAlt,
            btnconf: `relative blue-circle-button tooltip-button ${validaHiddenLista}`,
            label: 'Listado',
            id: 'list',
            path: '',
            event: handlelistPrint
        },
        {
            icon: IoTicket,
            btnconf: `relative p-3 m-1 rounded-full shadow hover:shadow-xl bg-amber-500 color-cultured cursor-pointer inline-block tooltip-button ${validaHiddenTicket}`,
            label: 'Ticket',
            id: 'print',
            path: '',
            event: handleOnlyPrint
        },
        {
            icon: IoBagAdd,
            btnconf: `relative p-3 m-1 rounded-full shadow hover:shadow-xl bg-amber-500 color-cultured cursor-pointer inline-block tooltip-button ${validaBlockPedido}`,
            label: 'Pedido',
            id: 'add',
            path: '',
            event: handleClientData
        }
    ];

    const completeConfigs = [
        {
            icon: IoTicket,
            btnconf: `relative gray-circle-button tooltip-button`,
            label: 'Reimprimir ticket',
            id: 'print',
            event: handlePrint
        },
        {
            icon: MdAutorenew,
            btnconf: `relative green-circle-button tooltip-button`,
            label: 'Nueva venta',
            id: 'new',
            event: () => window.location.reload()
        }
    ];

    return (
        <div className="bg-gradient-to-b min-h-screen from-white via-gray-100 to-gray-400 dark:from-black dark:via-slate-800 dark:to-stone-700 backdrop-blur-md pt-28">
            <Title
                title='Genera tickets para clientes'
                icon={MdSell}
                back='Volver al panel'
                path='/productivity'
            />
            <div>
                <div className="mx-auto max-w-[1700px] xl:px-8 mt-5 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 mx-auto gap-x-7 gap-y-6 lg:mx-0 px-2">
                        <div className= {`lg:rounded-2xl my-5 pt-2 shadow w-auto overflow-hidden rounded-xl   ${folio ? 'bg-stone-500' : 'bg-gray-200 dark:bg-stone-700' }`}>
                            <FindProducts
                                onAddProduct={handleAddProduct}
                                onRemoveProduct={handleRemoveProduct}
                                addedItems={items}
                                folio={folio}
                            />
                        </div>
                        <div className='grid-cols-1 lg:col-span-2 w-auto 2xl:flex'>
                            <TableSales
                                items={items}
                                buttonConfigs={buttonConfigs}
                                completeConfigs={completeConfigs}
                                onRemoveProduct={handleRemoveProduct}
                                onUpdateProduct={handleUpdateProduct}
                                handleMouseEnter={handleMouseEnter}
                                handleMouseLeave={handleMouseLeave}
                                onShowTextArea={validaTextArea}
                                visibleTooltip={visibleTooltip}
                                discount={discount}
                                folio={folio}
                                handlePrint={handlePrint}
                                onDiscountChange={handleDiscountChange}
                                onTogglePedido={handleTogglePedido}
                                setItems={setItems}
                                handleAddNote={handleAddNote}
                            />
                        </div>
                    </div>
                </div>
                <div className='hidden'>
                    <ComponentToPrint
                        ref={componentRef}
                        items={items}
                        subtotal={subtotal}
                        discount={discount}
                        total={total}
                        currentDate={currentDate}
                        employee={employee}
                        folio={folio}
                        notes={notes}
                    />
                    <ListToPrint
                        ref={listRef}
                        items={items}
                    />
                </div>
                {/* Modales */}
                <ClientOrderModal
                    isOpen={showModal}
                    toggleModal={toggleModal}
                    onSubmit={handleModalSubmit}
                />
                <PaymentTypeModal
                    isOpen={showPaymentModal}
                    toggleModal={togglePaymentModal}
                    onConfirm={handlePaymentTypeSubmit}
                />
                <RowTypeModal
                    isOpen={showRowModal}
                    toggleModal={toggleRowModal}
                    onConfirm={handleRowTypeSubmit}
                />
            </div>
        </div>
    );
}
