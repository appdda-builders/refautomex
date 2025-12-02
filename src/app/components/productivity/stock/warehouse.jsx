import React, { useContext, useState, useRef } from 'react';
import Title from '../title';
import FindProducts from '@/app/components/productivity/sales/find-products';
import TableDescription from './table-description';
import { FaExchangeAlt } from 'react-icons/fa';
import { FaBoxesPacking } from 'react-icons/fa6';
import { IoSaveSharp } from 'react-icons/io5';
import { PiStickerFill } from 'react-icons/pi';
import EditRegister from './edit-register';
import MigrateModal from './migrate-modal';
import AddRegister from './add-register';
import Labels from './labels';
import { useReactToPrint } from 'react-to-print';
import { buildApiUrl } from '@/app/lib/refautomex-api';
import { AuthContext } from '@/app/lib/auth-tracker';

export default function Warehouse() {
    const { userData } = useContext(AuthContext);
    const userBranchId = userData?.idsucursal || null;
    const [items, setItems] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [visibleTooltip, setVisibleTooltip] = useState({});
    const [prodOverview, setProdOverview] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [locationErrors, setLocationErrors] = useState({});
    const [saveStatus, setSaveStatus] = useState({ type: null, message: '' });
    const [isSaving, setIsSaving] = useState(false);
    const findProductsRef = useRef();
    const labelsRef = useRef(null);

    // Configuración de la impresión
    const handlePrint = useReactToPrint({
        contentRef: labelsRef,
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
            setHasChanges(updatedItems.some(item => item.modified));
            return updatedItems;
        });
    };

    const handleRemoveProduct = (refaccion) => {
        setItems(prevItems => {
            const updatedItems = prevItems.filter(item => item.refaccion !== refaccion);
            setHasChanges(updatedItems.some(item => item.modified));
            return updatedItems;
        });
    };

    const handleUpdateProduct = (refaccion, changes) => {
        setItems(prevItems => {
            let didModify = false;
            const updatedItems = prevItems.map(item => {
                if (item.refaccion !== refaccion) {
                    return item;
                }
                const nextItem = { ...item, ...changes };
                const itemChanged = Object.keys(changes).some(
                    key => item[key] !== nextItem[key]
                );
                if (itemChanged) {
                    didModify = true;
                    return { ...nextItem, modified: true };
                }
                return item;
            });
            const hasModifiedItems = updatedItems.some(item => item.modified);
            setHasChanges(hasModifiedItems || didModify);
            return updatedItems;
        });
    };

    const handleMigrateLocation = () => {
        setShowModal(true);
    };

    const toggleModal = () => {
        setShowModal(!showModal);
    };

    const handleModalSubmit = async (migrationSelection) => {
        if (!migrationSelection?.source || !migrationSelection?.target) {
            return {
                ok: false,
                message: 'Información de migración incompleta.',
            };
        }

        if (!userBranchId) {
            const message = 'No se pudo determinar la sucursal del usuario.';
            updateSaveStatus('error', message);
            return {
                ok: false,
                message,
            };
        }

        try {
            const response = await fetch(buildApiUrl('/patchMigrate'), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source: migrationSelection.source,
                    target: migrationSelection.target,
                    idsucursal: userBranchId
                }),
            });

            const data = await response.json().catch(() => ({}));
            const message = data?.message || (response.ok ? 'Matriz migrada correctamente.' : 'Error al migrar matriz.');

            if (!response.ok) {
                updateSaveStatus('error', message);
                return {
                    ok: false,
                    message,
                };
            }

            updateSaveStatus('success', message);
            findProductsRef.current?.refreshProducts?.();

            return {
                ok: true,
                message,
            };
        } catch (error) {
            console.error('Error al migrar matrices:', error);
            const message = error?.message || 'Error al migrar matriz. Intenta de nuevo.';
            updateSaveStatus('error', message);
            return {
                ok: false,
                message,
            };
        }
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

        try {
            const params = new URLSearchParams({
                localizacion: item.localizacion,
                idsucursal: item.idsucursal,
                num_parte: item.refaccion
            });
            const endpoint = `${buildApiUrl('/verifyLocation')}?${params.toString()}`;
            const response = await fetch(endpoint, {
                cache: 'no-store',
                headers: { Accept: 'application/json, text/plain, */*' },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.exists) {
                errorMessage = data.message;
                isValid = false;
                setLocationErrors(prev => ({
                    ...prev,
                    [item.refaccion]: errorMessage
                }));
            } else {
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

    const validateAllLocations = async (itemsToValidate) => {
        let allValid = true;
        const validationResults = [];

        for (const item of itemsToValidate) {
            if (item.localizacion) {
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

    const updateSaveStatus = (type, message) => setSaveStatus({ type, message });

    const handleSaveClick = () => {
        if (isSaving) {
            return;
        }
        if (!hasChanges) {
            updateSaveStatus('error', 'No hay cambios para guardar.');
            return;
        }
        handleSaveCompleteTable();
    };

    const handleSaveCompleteTable = async () => {
        if (items.length === 0) {
            updateSaveStatus('error', 'No hay productos para guardar.');
            return;
        }
        setSaveStatus({ type: null, message: '' });

        const modifiedItems = items.filter(item => item.modified);
        if (modifiedItems.length === 0) {
            updateSaveStatus('error', 'No se han realizado modificaciones en los registros.');
            return;
        }

        // Validar todas las localizaciones primero
        const { allValid, validationResults } = await validateAllLocations(modifiedItems);

        if (!allValid) {
            const errorMessages = validationResults
                .filter(result => !result.isValid)
                .map(result => `${result.refaccion}: ${result.errorMessage}`)
                .join(' | ');
            updateSaveStatus('error', errorMessages || 'Error al validar localizaciones.');
            return;
        }

        setIsSaving(true);

        let saveSuccessful = false;
        try {
            // Usamos Promise.all para enviar todas las peticiones en paralelo
            await Promise.all(modifiedItems.map(async (item) => {
                const params = {
                    refaccion: item.refaccion,
                    idsucursal: item.idsucursal,
                    existencia: item.existencia,
                    localizacion: item.localizacion,
                    descripcion: item.descripcion,
                    costo: item.costo,
                    precio: item.precio,
                    aiva: item.aIva
                };

                const response = await fetch(buildApiUrl('/patchTableProducts'), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json, text/plain, */*',
                    },
                    body: JSON.stringify(params),
                });

                if (!response.ok) {
                    throw new Error(`Error actualizando el producto ${item.refaccion}`);
                }
            }));

            updateSaveStatus('success', 'Se guardó correctamente.');
            findProductsRef.current?.refreshProducts?.();
            saveSuccessful = true;
        } catch (error) {
            console.error('Error actualizando registros:', error);
            updateSaveStatus('error', 'Error al guardar listado.');
        } finally {
            if (saveSuccessful) {
                setItems(prevItems =>
                    prevItems.map(item => item.modified ? { ...item, modified: false } : item)
                );
                setHasChanges(false);
            }
            setIsSaving(false);
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
            label: isSaving ? 'Guardando' : 'Actualizar lista', id: 'update', path: '',
            event: handleSaveClick,
            disabled: isSaving
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
                    {saveStatus.message && (
                        <div
                            className={`text-sm font-semibold mb-2 ${saveStatus.type === 'error' ? 'text-red-600' : 'text-green-600'}`}
                        >
                            {saveStatus.message}
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-3 mx-auto gap-x-10 gap-y-6 lg:mx-0 px-2 xl:px-0">
                        <div className="bg-[rgb(var(--color-card))] lg:rounded-2xl my-5 py-2 shadow shadow-[rgb(var(--color-galaxy))] w-auto overflow-hidden rounded-xl ">
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
                <EditRegister
                    prodOverview={prodOverview}
                    onCancelEdit={onCancelEdit}
                    setProdOverview={setProdOverview}
                    onRefreshProducts={() => findProductsRef.current?.refreshProducts?.()}
                />
            </div>
            <div className={isAdding ? 'block' : 'hidden'}>
                <AddRegister
                    onCancelEdit={onCancelEdit}
                    onRefreshProducts={() => findProductsRef.current?.refreshProducts?.()}
                />
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
