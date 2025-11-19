'use client';
import { buildApiUrl } from '@/app/lib/refautomex-api';
import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import Spinner from '@/app/components/principal/spinner';
import { FaDeleteLeft, FaStar } from "react-icons/fa6";
import { LuListPlus } from "react-icons/lu";
import { TiInfo } from "react-icons/ti";
import { IoClose } from "react-icons/io5";

const parseProductRoutes = (raw) => {
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === 'string' && raw.trim()) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
            return [];
        }
    }
    return [];
};

const resolveProductImage = (ruta, multimediaSrc = '') => {
    if (!ruta) return `${multimediaSrc}productos/no-img.png`;
    return ruta.startsWith('http') ? ruta : `${multimediaSrc}${ruta}`;
};

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightText = (text, searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return text;
    const words = searchTerm.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return text;
    const normalizedWords = words.map(word => word.toLowerCase());
    const regex = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'gi');
    const segments = text.split(regex);

    return segments.map((segment, index) => {
        if (!segment) return null;
        const isMatch = normalizedWords.includes(segment.toLowerCase());
        if (isMatch) {
            return (
                <span
                    key={`${segment}-${index}`}
                    className="bg-[rgb(var(--color-refautomex))]/30 text-[rgb(var(--color-text))] px-0.5 rounded-sm"
                >
                    {segment}
                </span>
            );
        }
        return <span key={`${segment}-${index}-plain`}>{segment}</span>;
    });
};

const prioritizeMatches = (data, accessor, prioritizedWord, type) => {
    if (!prioritizedWord) {
        return [...data];
    }

    const normalizedWord = prioritizedWord.toLowerCase();

    return [...data].sort((a, b) => {
        const textA = accessor(a).toLowerCase();
        const textB = accessor(b).toLowerCase();

        const startsA = textA.startsWith(normalizedWord) ? 0 : 1;
        const startsB = textB.startsWith(normalizedWord) ? 0 : 1;

        if (startsA !== startsB) {
            return startsA - startsB;
        }

        if (type === 'num_parte') {
            const numA = parseInt(a.num_parte, 10);
            const numB = parseInt(b.num_parte, 10);
            if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
                return numA - numB;
            }
        }

        return accessor(a).localeCompare(accessor(b), undefined, { numeric: true, sensitivity: 'base' });
    });
};

function filterProductsByCategory(products, searchTerm, searchType) {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const searchWords = normalizedSearch ? normalizedSearch.split(/\s+/).filter(Boolean) : [];
    const prioritizedWord = searchWords[0] || '';

    let result = {
        dataProducts: [],
        type: ''
    };

    switch (searchType) {
        case 'Descripcion':
            result.dataProducts = products.filter(product =>
                searchWords.length === 0 ||
                searchWords.every(word => product.descripcion.toLowerCase().includes(word))
            );
            result.type = 'descripcion';
            break;
        case 'Parte':
            result.dataProducts = products.filter(product =>
                searchWords.length === 0 ||
                searchWords.every(word => product.num_parte.toLowerCase().includes(word))
            );
            result.type = 'num_parte';
            break;
        case 'Localizacion':
            result.dataProducts = products.filter(product =>
                searchWords.length === 0 ||
                searchWords.every(word => product.localizacion.toLowerCase().includes(word))
            );
            result.type = 'localizacion';
            break;
        default:
            result.dataProducts = products.filter(product =>
                searchWords.length === 0 ||
                searchWords.every(word => product.descripcion.toLowerCase().includes(word))
            );
            result.type = 'descripcion';
            break;
    }

    const accessorByType = {
        descripcion: (product) => product.descripcion || '',
        num_parte: (product) => product.num_parte || '',
        localizacion: (product) => product.localizacion || ''
    };

    const accessor = accessorByType[result.type] || ((product) => product.descripcion || '');
    result.dataProducts = prioritizeMatches(result.dataProducts, accessor, prioritizedWord, result.type);

    result.dataProducts = result.dataProducts.map(product => {
        const rutas = parseProductRoutes(product.rutas);
        const primaryImage = rutas.length > 0 ? rutas[0] : '';
        return {
            ...product,
            rutas,
            ruta: primaryImage,
            imageSrc: resolveProductImage(primaryImage, process.env.NEXT_PUBLIC_S3 || '')
        };
    });

    return result;
}

const createTooltip = (icon, label, id, visibleTooltip, setVisibleTooltip) => {
    const show = () => setVisibleTooltip(id);
    const hide = () => setVisibleTooltip(null);
    const tooltip = visibleTooltip === id ? (
        <div
            className="absolute right-full -bottom-8 -left-4 opacity-90 bg-[rgb(var(--color-card))] shadow text-[rgb(var(--color-text))] text-xs rounded px-2 py-1 z-10"
            style={{ width: 'max-content', maxWidth: '16rem' }}
        >
            {label}
        </div>
    ) : null;

    return { show, hide, tooltip };
};

const FindProducts = forwardRef(({ onAddProduct, onRemoveProduct, addedItems, isWarehouse, isCapture, isMissing, folio }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const [images, setImages] = useState([]);
    const [error, setError] = useState(null);
    const [showCards, setShowCards] = useState(true);
    const [searchType, setSearchType] = useState('descripcion');
    const [visibleTooltip, setVisibleTooltip] = useState(null);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [stockAlerts, setStockAlerts] = useState({});
    const deleteTooltip = createTooltip(FaDeleteLeft, 'Eliminar', 'delete', visibleTooltip, setVisibleTooltip);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const searchTypes = ['Descripcion', 'Parte', 'Localizacion'];

    const handleTypeClick = () => {
        const currentTypeIndex = searchTypes.indexOf(searchType);
        const nextTypeIndex = (currentTypeIndex + 1) % searchTypes.length;
        setSearchType(searchTypes[nextTypeIndex]);
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(buildApiUrl('/getAllProducts'), {
                cache: 'no-store',
                headers: {
                    Accept: 'application/json, text/plain, */*',
                },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const payload = await response.json();
            setProducts(payload?.[0] ?? []);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Exponer `fetchProducts` para que pueda ser llamado desde el componente padre
    useImperativeHandle(ref, () => ({
        refreshProducts: fetchProducts,
    }));

    useEffect(() => {
        if (!products || products.length === 0) {
            fetchProducts();
        }
    }, []);

    useEffect(() => {
        const result = filterProductsByCategory(products, searchTerm, searchType);
        setFilteredProducts(result.dataProducts);
    }, [searchTerm, products, searchType]);

    const handleAddClick = (product) => {
        if (folio) return;

        if (!isWarehouse && !isCapture && product.existencia === 0) {
            setStockAlerts((prev) => ({ ...prev, [product.num_parte]: true }));
        }

        onAddProduct({
            idsucursal: product.idsucursal,
            sucursal: product.sucursal,
            refaccion: product.num_parte,
            descripcion: product.descripcion,
            precio: product.precio,
            cantidad: 1,
            costo: product.costo,
            localizacion: product.localizacion,
            existencia: product.existencia,
            monto: product.precio,
            aIva: (product.precio / 1.16).toFixed(2),
            isPedido: false,
            utilidad: product.utilidad,
            ultimo: product.ultimo,
            marca: product.marca,
            idmarca: product.idmarca,
            mod_ini: product.mod_ini,
            mod_fin: product.mod_fin,
            rutas: product.rutas,
        });
    };


    const handleRemoveClick = (product) => {
        if (folio) return;
        onRemoveProduct(product.num_parte);
    };

    const dismissStockAlert = (numParte, event) => {
        event?.stopPropagation();
        setStockAlerts((prev) => {
            const next = { ...prev };
            delete next[numParte];
            return next;
        });
    };

    const handleAddAllClick = () => {
        const newProducts = filteredProducts.filter(product => !isProductAdded(product));
        newProducts.forEach(product => {
            onAddProduct({
                idsucursal: product.idsucursal,
                sucursal: product.sucursal,
                refaccion: product.num_parte,
                descripcion: product.descripcion,
                precio: product.precio,
                cantidad: 1,
                costo: product.costo,
                localizacion: product.localizacion,
                existencia: product.existencia,
                monto: product.precio,
                aIva: (product.precio / 1.16).toFixed(2),
                isPedido: false,
                utilidad: product.utilidad,
                ultimo: product.ultimo,
                marca: product.marca,
                idmarca: product.idmarca,
                mod_ini: product.mod_ini,
                mod_fin: product.mod_fin,
                rutas: product.rutas,
            });
        });
    };

    const isProductAdded = (product) => addedItems.some(item => item.refaccion === product.num_parte);

    return (
        <div className="relative w-full max-w-[480px] lg:max-w-[520px] mx-auto overflow-x-hidden">
            <div className="flex justify-between items-center px-3 mt-6 text-xs text-[rgb(var(--color-text))]">
                <span className="font-semibold uppercase tracking-wide">
                    Resultados: {filteredProducts.length}
                </span>
                {searchTerm && (
                    <span className="italic text-[rgb(var(--color-refautomex))]">
                        Buscando: {searchTerm.toUpperCase()}
                    </span>
                )}
            </div>
            <div className='flex justify-center items-start m-0.5 mt-4 w-full'>
                <input
                    type="text"
                    name="client-search"
                    placeholder='Buscar productos'
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="uppercase w-[300px] block border-0 rounded-full py-1.5 p-3 -mt-1 text-[rgb(var(--color-text))] shadow shadow-[rgb(var(--color-galaxy))] placeholder:text-[rgb(var(--color-text))] bg-[rgb(var(--color-bg))] sm:text-sm sm:leading-6"
                />
                <div
                    onMouseEnter={deleteTooltip.show}
                    onMouseLeave={deleteTooltip.hide}
                    onClick={() => setSearchTerm('')}
                    className='mx-2 -mt-1 mb-1 text-sm font-bold leading-6 p-2 shadow rounded-full cursor-pointer relative bg-[rgb(var(--color-card))]'>
                    <FaDeleteLeft size={20}
                        className='text-md xl:text-lg leading-6 text-[rgb(var(--color-error))]'
                    />
                    {deleteTooltip.tooltip}
                </div>
                {isWarehouse && searchTerm.trim() && (
                    <button
                        onClick={handleAddAllClick}
                        className="ml-2 h-10 w-10 rounded-full bg-violet-700 text-white flex items-center justify-center shadow-lg mt-0.5"
                        title="Agregar todos los resultados visibles"
                    >
                        <LuListPlus className="text-lg" />
                    </button>
                )}
            </div>
            <div className='bg-[rgb(var(--color-card))] flex justify-center px-3 cursor-pointer' onClick={handleTypeClick}>
                <span className='px-2 my-0.5 rounded-full bg-[rgb(var(--color-bg))] shadow shadow-[rgb(var(--color-galaxy))] animate-out italic'>POR: {searchType.toUpperCase()}</span>
            </div>
            <div className='flex justify-center overflow-y-auto h-[570px] w-full max-w-[520px] mx-auto'>
            {isLoading ? (
                <Spinner />
            ) : (
                showCards && (
                    <div className="relative min-h-[30rem] w-full grow [container-type:inline-size] max-lg:mx-auto max-lg:max-w-sm">
                        <div className="absolute left-1/2 top-6 z-10 flex items-center space-x-1 bg-[rgb(var(--color-slate))] p-1 rounded-full transform -translate-x-1/2">
                            <FaStar className="w-3 h-3 text-amber-400 animate-bounce"/>
                            <p className="text-xs font-medium text-gray-300">Refacciones</p>
                        </div>
                        <div className="absolute inset-x-2 sm:inset-x-1 xl:inset-x-10 bottom-0 top-3 rounded-t-[12cqw] overflow-x-hidden overflow-y-auto border-x-[1cqw] border-t-[1cqw] shadow shadow-[rgb(var(--color-galaxy))] border-[rgb(var(--color-slate))] bg-[rgb(var(--color-gray))] pt-5 ">
                            <div className="p-1 mt-5">
                                <div className="pb-3 pt-1 sm:pl-2 px-1 flex flex-col items-center justify-center">
                                    {filteredProducts
                                        .filter(product => !isMissing || product.existencia === 0)
                                        .slice(0, 25)
                                        .map((product) => {
                                        const imageUrl = resolveProductImage(product.ruta, multimediaSrc);
                                        const isAdded = isProductAdded(product);
                                        return (
                                            <div
                                                key={product.num_parte}
                                                onClick={() =>
                                                    isAdded ? handleRemoveClick(product) : handleAddClick(product)
                                                }
                                                className={`flex items-center gap-2 w-full relative rounded-xl cursor-pointer md:-mx-3 mb-3 shadow shadow-[rgb(var(--color-galaxy))] p-3 transition-all duration-200 ${
                                                    isAdded
                                                    ? 'bg-[rgb(var(--color-gray))] ring-2 ring-[rgb(var(--color-gray-base))]'
                                                    : 'bg-[rgb(var(--color-bg))]'
                                                }`}
                                                >
                                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-xl bg-white shadow shadow-[rgb(var(--color-galaxy))]">
                                                    <img
                                                    src={imageUrl}
                                                    alt={product.num_parte}
                                                    className="w-full h-full object-contain object-center"
                                                    />
                                                </div>
                                                <div className="flex flex-col flex-1 gap-2">
                                                    <div className="flex flex-col flex-1">
                                                        <div className="text-sm sm:text-base text-[rgb(var(--color-text))] min-h-[4.5rem] max-h-[4.5rem] overflow-y-auto">
                                                            {highlightText(product.descripcion, searchTerm)}
                                                        </div>
                                                        <div className="flex flex-row justify-between text-left my-2">
                                                            <p className="sm:text-sm font-bold text-[rgb(var(--color-refautomex))] bg-[rgb(var(--color-gray))]/20 rounded-full px-2 shadow shadow-[rgb(var(--color-galaxy))]">
                                                                {highlightText(product.num_parte, searchTerm)}
                                                            </p>
                                                            <p className="sm:text-sm font-bold text-[rgb(var(--color-refautomex))] bg-[rgb(var(--color-gray))]/20 rounded-full px-2 shadow shadow-[rgb(var(--color-galaxy))] truncate">
                                                                {highlightText(product.localizacion, searchTerm)}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-row justify-between h-full">
                                                            <p className="text-lg font-bold text-[rgb(var(--color-success))] mt-1">
                                                                ${' '}
                                                                {(Number(product.precio)).toFixed(2)} MXN
                                                            </p>
                                                            <span
                                                                className={`${
                                                                product.existencia === 0 ? 'bg-[rgb(var(--color-error-base))]' : 'bg-[rgb(var(--color-galaxy))]'
                                                                } text-[rgb(var(--color-text))] text-sm rounded-full h-8 w-8 flex items-center justify-center shadow shadow-[rgb(var(--color-galaxy))]`}
                                                            >
                                                                {product.existencia}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {stockAlerts[product.num_parte] && product.existencia === 0 && (
                                                    <div className="absolute left-4 right-4 bottom-2 rounded-full bg-amber-400/90 text-[rgb(var(--color-card))] text-xs font-semibold flex items-center justify-center gap-1 py-1 shadow-lg shadow-amber-500/40">
                                                        <TiInfo className="text-base" />
                                                        <span>Sin existencia</span>
                                                        <button
                                                        type="button"
                                                        onClick={(e) => dismissStockAlert(product.num_parte, e)}
                                                        className="ml-2 text-[rgb(var(--color-card))] hover:text-white"
                                                        aria-label="Cerrar alerta"
                                                        >
                                                        <IoClose className="text-base" />
                                                        </button>
                                                    </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}
            </div>
        </div>
    );
});

export default FindProducts;
