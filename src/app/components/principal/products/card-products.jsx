import { useState, useEffect } from 'react';
import { TbLayoutBottombarCollapse, TbLayoutNavbarCollapse } from "react-icons/tb";
import { useTranslation } from 'react-i18next';
import { IoBagAdd, IoBagRemove } from 'react-icons/io5';
import { IoMdCloseCircle } from 'react-icons/io';
import { CgMoreO } from 'react-icons/cg';
import { useCart } from '@/app/lib/shopping-context';
import { MdOutlineViewInAr } from "react-icons/md";
import '@/app/translations/i18next-translation';
import ProductOverview from '@/app/components/principal/products/product-overview';
import Spinner from '@/app/components/principal/spinner';
import axios from 'axios';

function filterProductsByCategory(products, grupo, searchTerm) {
  const lowerCaseGrupo = grupo.toLowerCase();

  const dataProducts = products
    .filter(product =>
      product.grupo.toLowerCase() === lowerCaseGrupo &&
      product.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map(product => {
      const rutas = JSON.parse(product.rutas || '[]'); 
      return {
        ...product,
        rutas, 
        ruta: rutas.length > 0 ? rutas[0] : 'productos/no-img.png' 
      };
    })
    .sort((a, b) => a.descripcion.localeCompare(b.descripcion));

  return dataProducts;
}



function ProductSection({t, products, cart, filterProductsByCategory, grupo, title, searchTerm, setProdOverview, setShowModal, addToCart, removeFromCart }) {
  const multimediaSrc = process.env.NEXT_PUBLIC_S3;
  const [showCards, setShowCards] = useState(true); 
  const filteredProducts = filterProductsByCategory(products, grupo, searchTerm);

  const toggleCardsVisibility = () => {
    setShowCards(!showCards);
  };

  return (
    <div>
      <div className='flex flex-1 my-2'>
        <div className={`
              flex rounded-full justify-center items-center shadow-lg pr-1 my-2 bg-gray-100 dark:bg-slate-900 dark:shadow-slate-300/10 cursor-pointer
          `}
          onClick={toggleCardsVisibility}
          >
            <div className="text-sm font-bold leading-6 p-2 shadow bg-stone-100 dark:bg-stone-700 hover:bg-zinc-200 dark:hover:bg-stone-600 rounded-full">
                {showCards ? 
                (
                  <TbLayoutBottombarCollapse className='w-6 h-6 text-gray-600 dark:text-gray-400 m-1' />
                ):(
                  <TbLayoutNavbarCollapse className='w-6 h-6 text-stone-950 dark:text-gray-100 m-1'/>
                )} 
            </div>
            <span className='gradient-text text-2xl sm:text-3xl font-semibold p-1'>{title}</span>
        </div>
      </div>
      
      {showCards && (
        <div className="flex overflow-x-auto gap-x-4 sm:gap-x-6 pb-5 pt-5 pl-2">
        {filteredProducts.map((product) => {
          const productInCart = cart.find(item => item.num_parte === product.num_parte);
          const imageUrl = product.rutas && product.rutas.length > 0 
            ? `${multimediaSrc}${product.rutas[0]}` 
            : `${multimediaSrc}productos/no-img.png`;
          
          return (
            <div key={product.num_parte} className="group min-w-[185px] w-[185px] sm:min-w-[220px] sm:w-[220px] relative bg-slate-100 dark:bg-stone-800 rounded-3xl cursor-pointer p-0.5">
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-3xl shadow-xl bg-gray-200 z-0">
                <img src={imageUrl} 
                onClick={(e) => {
                  e.stopPropagation();
                  productInCart ? removeFromCart(product) : addToCart(product);
                }} 
                className="h-full w-full object-cover object-center group-hover:opacity-75" />
                <div className='flex flex-1 relative'>
                  {productInCart ? (
                      <div 
                        onClick={() => removeFromCart(product)}
                        className="absolute right-10 cursor-pointer text-sm font-bold leading-6 p-2 shadow bg-stone-100 dark:bg-stone-700 hover:bg-zinc-200 dark:hover:bg-stone-600 rounded-full m-1">
                        <IoBagRemove 
                          className='h-5 w-5 text-red-500 dark:text-red-300'
                        />
                      </div>
                    ) : (
                      <div 
                        onClick={() => addToCart(product)}
                        className="absolute right-10 cursor-pointer text-sm font-bold leading-6 p-2 shadow bg-stone-100 dark:bg-stone-700 hover:bg-zinc-200 dark:hover:bg-stone-600 rounded-full m-1">
                        <IoBagAdd
                          className='h-5 w-5 text-amber-500 dark:text-amber-300'
                        />
                      </div>
                    )}
                  <div onClick={() => {
                    setProdOverview({ ...product, images: product.rutas });
                    setShowModal(true);
                  }} className="absolute right-0.5 cursor-pointer text-sm font-bold leading-6 p-2 shadow bg-stone-100 dark:bg-stone-700 hover:bg-zinc-200 dark:hover:bg-stone-600 rounded-full m-1">
                    <CgMoreO className='h-5 w-5 text-slate-900 dark:text-stone-300' />
                  </div>
                </div>
              </div>
              <h3 className="mt-4 text-sm text-gray-700 dark:text-gray-200 max-w-[215px] h-[56px] italic overflow-y-auto px-2">{product.descripcion}</h3>
              <p className="md:text-2xl text-lg font-semibold text-gray-900 dark:text-stone-100 mt-1 px-2">$ {Math.ceil(Number(product.precio)).toFixed(2)} MXN</p>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
  
export default function CardProducts() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true); 
  const [prodOverview, setProdOverview] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const { cart, addToCart, removeFromCart } = useCart();

  const { t } = useTranslation();

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setProdOverview(null);
  };

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showModal]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/dataManage?type=getProducts');
        setProducts(response.data[0]);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (isLoading) {
    return <Spinner/>;
  }

  return (
    <section className='my-20 pb-10'>
      <div className="text-center">
          <h1 className="dark:text-white bg-amber-300 dark:bg-yellow-400 py-4 animate-up mt-4 text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
            {t('products.commingSoon')}
          </h1>
          <p className="dark:text-stone-200 mt-6 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8">
            {t('products.improve')}
          </p>
        </div>
    </section>
    /*
    <section>
      <div className='bg-slate-50 dark:bg-stone-900 p-1.5 fixed w-full top-0 pt-24 md:pt-28 2xl:pt-32 justify-start items-center z-10 shadow'>
        <div className='flex flex-1 justify-center items-center'>
          <input
            type="text"
            name="client-search"
            placeholder={t('products.filter')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="uppercase w-[300px] block border-0 rounded-2xl py-2 p-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>
      <div className="bg-white dark:bg-stone-950 pt-2">
        <div className="mx-auto w-full px-4 sm:px-6 pb-4 xl:max-w-7xl lg:px-8">
          <ProductSection t={t} products={products} cart={cart} filterProductsByCategory={filterProductsByCategory} grupo="accessories" title={t('products.categorySix')} searchTerm={searchTerm} setProdOverview={setProdOverview} setShowModal={setShowModal} addToCart={addToCart} removeFromCart={removeFromCart}/>
          <ProductSection t={t} products={products} cart={cart} filterProductsByCategory={filterProductsByCategory} grupo="motor" title={t('products.categoryOne')} searchTerm={searchTerm} setProdOverview={setProdOverview} setShowModal={setShowModal} addToCart={addToCart} removeFromCart={removeFromCart}/>
          <ProductSection t={t} products={products} cart={cart} filterProductsByCategory={filterProductsByCategory} grupo="direction" title={t('products.categoryTwo')} searchTerm={searchTerm} setProdOverview={setProdOverview} setShowModal={setShowModal} addToCart={addToCart} removeFromCart={removeFromCart}/>
          <ProductSection t={t} products={products} cart={cart} filterProductsByCategory={filterProductsByCategory} grupo="collision" title={t('products.categoryThree')} searchTerm={searchTerm} setProdOverview={setProdOverview} setShowModal={setShowModal} addToCart={addToCart} removeFromCart={removeFromCart}/>
          <ProductSection t={t} products={products} cart={cart} filterProductsByCategory={filterProductsByCategory} grupo="electrical" title={t('products.categoryFour')} searchTerm={searchTerm} setProdOverview={setProdOverview} setShowModal={setShowModal} addToCart={addToCart} removeFromCart={removeFromCart}/>
          <ProductSection t={t} products={products} cart={cart} filterProductsByCategory={filterProductsByCategory} grupo="brakes" title={t('products.categoryFive')} searchTerm={searchTerm} setProdOverview={setProdOverview} setShowModal={setShowModal} addToCart={addToCart} removeFromCart={removeFromCart}/>
        </div>
      </div>
      {showModal && prodOverview && (
        <div className="fixed z-40 inset-0 overflow-y-auto bg-stone-700 opacity-80">
            <div className="flex items-center justify-center min-h-screen">
                <div className='relative max-w-7xl sm:px-10 lg:px-20 bg-gradient-to-tl from-stone-100 via-slate-200 to-slate-300 dark:from-slate-700 dark:via-slate-800 dark:to-slate-950 py-12 sm:rounded-xl shadow-xl'>
                    <div className='absolute -top-5 right-1/2 translate-x-1/2 shadow bg-white dark:bg-black rounded-full p-3 dark:shadow-slate-300/40'>
                      <MdOutlineViewInAr className='h-9 w-9 text-amber-500 dark:text-amber-400'/>
                    </div>
                    <button onClick={handleCloseModal} className="absolute top-2 right-2 text-red-500 dark:text-red-400 text-xl z-50">
                      <IoMdCloseCircle className='h-7 w-7 animate-out' />
                    </button>
                    <div className="relative overflow-y-auto w-screen sm:w-auto h-[450px] sm:h-[500px]">
                      <ProductOverview prodOverview={prodOverview} />
                    </div>
                </div>
            </div>
        </div>
      )}
    </section>
    */
  );
}
