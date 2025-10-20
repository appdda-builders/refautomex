import axios from 'axios';
import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import Spinner from '@/app/components/principal/spinner';
import { CgMoreO } from 'react-icons/cg';
import { FaDeleteLeft, FaStar } from "react-icons/fa6";
import { LuListRestart, LuListPlus } from "react-icons/lu";
import { IoBagAdd, IoBagRemove, IoCloseCircle } from "react-icons/io5";
import { TiInfo } from "react-icons/ti";

function filterProductsByCategory(products, searchTerm, searchType) {
    const searchWords = searchTerm.toLowerCase().split(/\s+/);

    let result = {
        dataProducts: [],
        type: ''
    };

    switch (searchType) {
        case 'descripcion':
            result.dataProducts = products.filter(product =>
                searchWords.every(word => product.descripcion.toLowerCase().includes(word))
            ).sort((a, b) => a.descripcion.localeCompare(b.descripcion));
            result.type = 'descripcion';
            break;
        case 'num_parte':
            result.dataProducts = products.filter(product =>
                searchWords.every(word => product.num_parte.toLowerCase().includes(word))
            ).sort((a, b) => {
                const numA = parseInt(a.num_parte);
                const numB = parseInt(b.num_parte);
                return numA - numB;
            });
            result.type = 'num_parte';
            break;
        case 'localizacion':
            result.dataProducts = products.filter(product =>
                searchWords.every(word => product.localizacion.toLowerCase().includes(word))
            ).sort((a, b) => {
                return a.localizacion.localeCompare(b.localizacion);
            });
            result.type = 'localizacion';
            break;
        default:
            result.type = 'Sin resultados';
    }

    result.dataProducts = result.dataProducts.map(product => {
        const rutas = JSON.parse(product.rutas || '[]');
        return {
            ...product,
            rutas,
            ruta: rutas.length > 0 ? rutas[0] : 'productos/no-img.png'
        };
    });

    return result;
}

const createTooltip = (icon, label, id, visibleTooltip, setVisibleTooltip) => {
    const show = () => setVisibleTooltip(id);
    const hide = () => setVisibleTooltip(null);
    const tooltip = visibleTooltip === id ? (
        <div
            className="absolute right-full -bottom-8 -left-4 opacity-90 dark:bg-gray-900 bg-gray-300 shadow dark:text-white text-black text-xs rounded px-2 py-1 z-10"
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
    const [alertProduct, setAlertProduct] = useState(null);
    const [showCards, setShowCards] = useState(true);
    const [searchType, setSearchType] = useState('descripcion');
    const [visibleTooltip, setVisibleTooltip] = useState(null);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const deleteTooltip = createTooltip(FaDeleteLeft, 'Eliminar', 'delete', visibleTooltip, setVisibleTooltip);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const searchTypes = ['descripcion', 'num_parte', 'localizacion'];

    const handleTypeClick = () => {
        const currentTypeIndex = searchTypes.indexOf(searchType);
        const nextTypeIndex = (currentTypeIndex + 1) % searchTypes.length;
        setSearchType(searchTypes[nextTypeIndex]);
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/dataManage?type=getAllProducts`);
            setProducts(response.data[0]);
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
            setAlertProduct(product.num_parte);
        } else {
            setAlertProduct(null);
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
        <div className="relative">
            <div className='flex flex-1 justify-center items-start m-0.5 mt-10 w-auto'>
                <input
                    type="text"
                    name="client-search"
                    placeholder='Buscar productos'
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="uppercase w-[300px] block border-0 rounded-2xl py-1.5 p-3 -mt-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
                <div
                    onMouseEnter={deleteTooltip.show}
                    onMouseLeave={deleteTooltip.hide}
                    onClick={() => setSearchTerm('')}
                    className='mx-2 -mt-1 mb-1 text-sm font-bold leading-6 p-2 shadow rounded-full cursor-pointer relative bg-stone-100 dark:bg-stone-800 hover:bg-zinc-200 dark:hover:bg-stone-600'>
                    <FaDeleteLeft size={20}
                        className='text-md xl:text-lg leading-6 text-slate-800 dark:text-stone-300 hover:text-red-500 dark:hover:text-red-300'
                    />
                    {deleteTooltip.tooltip}
                </div>
                <div className='absolute -top-11 md:right-0 -mt-1 mb-1 flex rounded-3xl '>
                    <span className='italic font-sans mx-1 my-auto text-sm dark:text-white'>
                        {searchTerm.length === 0 ? 'TODOS' : searchTerm.toUpperCase()}
                    </span>
                    <span className="bg-amber-500 text-white dark:text-stone-800 font-semibold rounded-full h-10 w-10 text-md flex items-center justify-center shadow-lg">
                        {filteredProducts.length}
                    </span>
                </div>
                {isWarehouse && searchTerm && (
                    <div className='absolute -top-11 right-0 md:left-0 -mt-1 mb-1 flex gap-2'>
                        <button
                            onClick={handleAddAllClick}
                            className="bg-violet-700 text-white rounded-full p-3 self-center flex items-center gap-1"
                        >
                            <LuListPlus className="text-lg" />
                        </button>
                    </div>
                )}
            </div>
            <div className='bg-yellow-200 flex flex-1 sm:justify-center px-3 cursor-pointer' onClick={handleTypeClick}>
                <span className='px-2 my-0.5 shadow-md rounded-md bg-amber-300 animate-out'>{searchType.toUpperCase()}</span>
            </div>
            <div className='flex flex-1 justify-center overflow-y-auto h-[570px] w-auto'>
            {isLoading ? (
                <Spinner />
            ) : (
                showCards && (
                    <div className="relative min-h-[30rem] w-full grow [container-type:inline-size] max-lg:mx-auto max-lg:max-w-sm">
                        <div className="absolute left-1/2 top-10 z-10 flex items-center space-x-1 bg-gray-800 dark:bg-slate-30 p-1 rounded-full transform -translate-x-1/2">
                            <FaStar className="w-3 h-3 text-amber-400 animate-bounce"/>
                            <p className="text-xs font-medium text-gray-300">Refacciones</p>
                        </div>
                        <div className="absolute inset-x-5 sm:inset-x-1 xl:inset-x-10 bottom-0 top-3 rounded-t-[12cqw] overflow-x-hidden overflow-y-auto border-x-[3cqw] border-t-[3cqw] border-slate-800 bg-gray-100 pt-5 dark:bg-white shadow-2xl">
                            <div className="flex flex-col items-center justify-center py-2 px-4 mt-5">
                                <div className="pb-3 pt-2 sm:pl-2 px-3 ">
                                    {filteredProducts
                                        .filter(product => !isMissing || product.existencia === 0)
                                        .slice(0, 25)
                                        .map((product) => {
                                        const imageUrl = product.ruta ? `${multimediaSrc}${product.ruta}` : `${multimediaSrc}productos/no-img.png`;
                                        return (
                                            <div key={product.num_parte} className="group w-[250px] lg:w-[300px] pb-4 relative bg-slate-100 rounded-3xl cursor-pointer p-0.5 md:-mx-3 mb-3 border border-stone-200 shadow">
                                                {alertProduct === product.num_parte && (
                                                    <div className="flex items-center bg-yellow-500 text-white text-sm font-bold mx-3 py-0.5 my-1 rounded-2xl" role="alert">
                                                        <TiInfo className="text-2xl mx-2" />
                                                        <p>Sin existencia {product.num_parte}</p>
                                                        <button onClick={() => setAlertProduct(null)} 
                                                        className="text-sm font-semibold underline absolute bg-gray-200 animate-out rounded-full -right-3 -top-1">
                                                            <IoCloseCircle className="text-2xl text-red-400" />
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="aspect-w-1 aspect-h-1 h-auto w-full overflow-hidden rounded-3xl shadow-xl bg-gray-200 border border-slate-100 z-0">
                                                    <img
                                                    src={imageUrl}
                                                    onClick={() => isProductAdded(product) ? handleRemoveClick(product) : handleAddClick(product)}
                                                    className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity duration-300"
                                                    />
                                                    <div className='flex flex-1 relative z-10'>
                                                        {isProductAdded(product) ? (
                                                            <div onClick={() => handleRemoveClick(product)} className="absolute right-9 cursor-pointer text-sm font-bold leading-6 p-2 shadow bg-stone-100 hover:bg-zinc-200 rounded-full m-1">
                                                                <IoBagRemove className='text-red-600 ' />
                                                            </div>
                                                        ) : (
                                                            <div onClick={() => handleAddClick(product)} className="absolute right-9 cursor-pointer text-sm font-bold leading-6 p-2 shadow bg-stone-100 hover:bg-zinc-200 rounded-full m-1">
                                                                <IoBagAdd className='text-amber-500 ' />
                                                            </div>
                                                        )}
                                                        <div className="absolute right-0.5 cursor-pointer text-sm font-bold leading-6 p-2 shadow bg-stone-100 hover:bg-zinc-200 rounded-full m-1">
                                                            <CgMoreO className='text-slate-900 ' />
                                                        </div>
                                                        <div className="absolute -left-1 top-1 text-xl font-semibold text-gray-900 dark:text-stone-100 mt-1 px-4">
                                                            <span className={`${product.existencia === 0 ? 'bg-red-400' : 'bg-amber-500'} text-white text-sm rounded-full h-8 w-8 text-md flex items-center justify-center shadow-lg animate-up`}>
                                                                {product.existencia}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='flex my-3 justify-center items-center'>
                                                    <p className="text-lg font-bold text-amber-500 -mt-1 px-2">{product.num_parte}</p>
                                                    <p className="text-lg font-bold text-amber-500 bg-slate-50 rounded-full shadow -mt-1 px-2">{product.localizacion}</p>
                                                </div>
                                                <h3 className="text-xl text-gray-700 max-w-full h-[85px] overflow-y-scroll px-2 mb-5 font-semibold text-justify">{product.descripcion}</h3>
                                                <p className="absolute bottom-0 right-0 text-2xl font-italic text-green-700 px-4">$ {(Number(product.precio)).toFixed(2)} MXN</p>
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
