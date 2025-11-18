import React, { useState, useRef } from 'react';
import Title from '../title';
import FindProducts from '@/app/components/productivity/sales/find-products';
import TableDescription from './table-description';
import { FaExchangeAlt } from 'react-icons/fa';
import { FaBoxesPacking } from 'react-icons/fa6';
import { IoSaveSharp } from 'react-icons/io5';
import { PiStickerFill } from 'react-icons/pi';
import EditRegistry from './edit-registry';
import MigrateModal from './migrate-modal';
import AddRegistry from './add-registry';
import Labels from './labels';
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';
import { buildApiUrl } from '@/app/lib/refautomex-api';

export default function Warehouse() {
    const [items, setItems] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [visibleTooltip, setVisibleTooltip] = useState({});
    const [prodOverview, setProdOverview] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [locationErrors, setLocationErrors] = useState({});
    const findProductsRef = useRef();
    const labelsRef = useRef();

    // Configuración de la impresión
    const handlePrint = useReactToPrint({
        content: () => labelsRef.current,
        onAfterPrint: () => {
            // Opcional: alguna acción después de imprimir
            console.log('Etiquetas impresas');
        }
    });

    const handleMouseEnter = (id) => {
        setVisibleTooltip(prev => ({ ...prev, [id]: true }));
    };

    const handleMouseLeave = (id) => {
        setVisibleTooltip(prev => ({ ...prev, [id]: false }));
    };

    const handleAddProduct = (product) => {
        setItems(prevItems => {
            const exists = prevItems.some(item => item.refaccion === product.refaccion);
            const updatedItems = exists
                ? prevItems.filter(item => item.refaccion !== product.refaccion)
                : [...prevItems, { ...product, modified: true }];
            setHasChanges(true);
            return updatedItems;
        });
    };

    const handleRemoveProduct = (refaccion) => {
        setItems(prevItems => {
            const updatedItems = prevItems.filter(item => item.refaccion !== refaccion);
            setHasChanges(updatedItems.length !== prevItems.length);
            return updatedItems;
        });
    };

    const handleUpdateProduct = (updatedItems) => {
        setItems(prevItems => {
            if (JSON.stringify(prevItems) !== JSON.stringify(updatedItems)) {
                // Marcar todos los items como modificados
                const markedItems = updatedItems.map(item => ({
                    ...item,
                    modified: true
                }));
                setHasChanges(true);
                return markedItems;
            }
            return prevItems;
        });
    };

    const handleMigrateLocation = () => {
        setShowModal(true);
    };

    const toggleModal = () => {
        setShowModal(!showModal);
    };

    const handleModalSubmit = (formData, hasAccount) => {
        setOrigin(formData.telefono);
        setDestination(formData.email);
        toggleModal();
    };

    const handleEditClick = (product) => {
        setProdOverview(product);
        setIsEditing(true);
    };

    const handleAddClick = () => {
        setIsAdding(true);
    }

    const handleClearTable = () => {
        items.forEach(item => handleRemoveProduct(item.refaccion));
    };

    const validateLocation = async (item) => {
        let isValid = true;
        let errorMessage = '';

        // Validar la localización en el servidor
        try {
            const params = {
                localizacion: item.localizacion,
                idsucursal: item.idsucursal,
                num_parte: item.refaccion
            };
            const response = await axios.get(buildApiUrl('/dataManage'), {
                params: {
                    type: 'verifyLocation',
                    params: JSON.stringify(params),
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.exists) {
                errorMessage = response.data.message;
                isValid = false;
                // Actualizar el estado de errores
                setLocationErrors(prev => ({
                    ...prev,
                    [item.refaccion]: errorMessage
                }));
            } else {
                // Limpiar el error si la localización es válida
                setLocationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[item.refaccion];
                    return newErrors;
                });
            }
        } catch (error) {
            console.error('Error verificando localización:', error);
            errorMessage = 'Error al verificar la localización.';
            isValid = false;

            setLocationErrors(prev => ({
                ...prev,
                [item.refaccion]: errorMessage
            }));
        }
        return { isValid, errorMessage };
    };

    // Función para validar todas las localizaciones antes de guardar
    const validateAllLocations = async (itemsToValidate) => {
        let allValid = true;
        const validationResults = [];

        for (const item of itemsToValidate) {
            if (item.localizacion) { // Solo validar si tiene localización
                const result = await validateLocation(item);
                validationResults.push({
                    refaccion: item.refaccion,
                    ...result
                });

                if (!result.isValid) {
                    allValid = false;
                }
            }
        }

        return { allValid, validationResults };
    };

    const handleSaveCompleteTable = async () => {
        if (items.length === 0) {
            alert('No hay productos para guardar');
            return;
        }

        const modifiedItems = items.filter(item => item.modified);
        if (modifiedItems.length === 0) {
            alert('No se han realizado modificaciones en los registros');
            return;
        }

        // Validar todas las localizaciones primero
        const { allValid, validationResults } = await validateAllLocations(modifiedItems);

        if (!allValid) {
            const errorMessages = validationResults
                .filter(result => !result.isValid)
                .map(result => `${result.refaccion}: ${result.errorMessage}`)
                .join('\n');
            alert(`Errores de localización:\n${errorMessages}`);
            return;
        }

        try {
            // Usamos Promise.all para enviar todas las peticiones en paralelo
            await Promise.all(modifiedItems.map(async (item) => {
                const params = {
                    refaccion: item.refaccion,
                    idsucursal: item.idsucursal,
                    existencia: item.existencia,
                    localizacion: item.localizacion,
                    descripcion: item.descripcion
                };

                // Llamada al backend para cada producto modificado
                const response = await axios.patch(buildApiUrl('/patchTableProducts'), params, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                // Podrías verificar la respuesta aquí si es necesario
                if (!response.data) {
                    throw new Error(`Error actualizando el producto ${item.refaccion}`);
                }
            }));

            alert(`Registros Actualizados, por favor recarga la lista`);
        } catch (error) {
            console.error('Error actualizando registros:', error);
            alert('Error al actualizar algunos registros. Por favor, revisa la consola para más detalles.');
        } finally {
            // Resetear el estado de modificación
            setItems(prevItems =>
                prevItems.map(item => ({ ...item, modified: false }))
            );
            setHasChanges(false);
        }
    };

    const handleLabelsStickerPrint = () => {
        if (items.length === 0) {
            alert('No hay productos para rotular');
            return;
        }
        handlePrint();
    };

    const onCancelEdit = () => {
        // Refrescar productos (USANDO FUNCION HEREDADA DE FindProducts)
        findProductsRef.current?.refreshProducts();
        // Limpiar tabla de productos
        handleClearTable();
        // Cancelar la edición
        setIsEditing(false);
        // Cancelar insertar nuevo producto
        setIsAdding(false);
    };

    const buttonConfigs = [
        {
            icon: FaExchangeAlt,
            btnconf:`relative tooltip-button p-3 m-1 rounded-full shadow hover:shadow-xl bg-amber-500 color-cultured cursor-pointer inline-block`,
            label: 'Migrar', id: 'migrate', path: '',
            event: handleMigrateLocation,
        },
        {
            icon: FaBoxesPacking,
            btnconf:'relative tooltip-button p-3 m-1 rounded-full shadow hover:shadow-xl bg-amber-500 color-cultured cursor-pointer inline-block',
            label: 'Alta', id: 'new', path: '',
            event: handleAddClick
        },
        {
            icon: IoSaveSharp,
            btnconf:'relative blue-circle-button tooltip-button',
            label: 'Actualizar lista', id: 'update', path: '',
            event: hasChanges ? handleSaveCompleteTable : () => alert('No hay cambios para guardar')
        },
        {
            icon: PiStickerFill,
            btnconf:`relative blue-circle-button tooltip-button`,
            label: 'Rotular', id: 'list', path: '',
            event: handleLabelsStickerPrint
        }
    ];

    return (
        <div className="bg-gradient-to-b min-h-screen from-[rgb(var(--color-bg))] via-[rgb(var(--color-card))] to-[rgb(var(--color-gray))] backdrop-blur-md pt-28">
            <Title
                title='Gestión de Almacén y productos'
                icon={FaBoxesPacking}
                back='Volver al panel'
                path='/productivity'
            />
            <div className={isEditing || isAdding ? 'hidden' : 'block'}>
            <div className="mx-auto max-w-[1700px] xl:px-8 mt-5 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 mx-auto gap-x-10 gap-y-6 lg:mx-0 px-2 xl:px-0">
                        <div className="bg-[rgb(var(--color-card-white))] lg:rounded-2xl my-5 py-2 shadow w-auto overflow-hidden rounded-xl ">
                            <FindProducts
                                ref={findProductsRef}
                                onAddProduct={handleAddProduct}
                                onRemoveProduct={handleRemoveProduct}
                                addedItems={items}
                                isWarehouse={true}
                            />
                        </div>
                        <div className='grid-cols-1 lg:col-span-2 w-auto'>
                            <TableDescription
                                items={items}
                                buttonConfigs={buttonConfigs}
                                onRemoveProduct={handleRemoveProduct}
                                onUpdateProduct={handleUpdateProduct}
                                handleMouseEnter={handleMouseEnter}
                                handleMouseLeave={handleMouseLeave}
                                visibleTooltip={visibleTooltip}
                                onEditClick={handleEditClick}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className={isEditing ? 'block' : 'hidden'}>
                <EditRegistry prodOverview={prodOverview} onCancelEdit={onCancelEdit} setProdOverview={setProdOverview}/>
            </div>
            <div className={isAdding ? 'block' : 'hidden'}>
                <AddRegistry onCancelEdit={onCancelEdit} />
            </div>
            {/* Modales */}
            <MigrateModal
                isOpen={showModal}
                toggleModal={toggleModal}
                onSubmit={handleModalSubmit}
            />
            {/* Componente oculto para impresión */}
            <div className="hidden">
                <div ref={labelsRef}>
                    <Labels products={items} />
                </div>
            </div>
        </div>
    );
}
