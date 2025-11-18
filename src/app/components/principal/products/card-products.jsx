'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, Variants } from 'framer-motion';
import { IoMdCloseCircle } from 'react-icons/io';
import { CgMoreO } from 'react-icons/cg';
import { MdOutlineViewInAr, MdDelete } from 'react-icons/md';
import { FaCircleMinus, FaCirclePlus } from 'react-icons/fa6';
import Spinner from '@/app/components/principal/spinner';
import ProductOverview from '@/app/components/principal/products/product-overview';
import { useCart } from '@/app/lib/shopping-context';
import { buildApiUrl } from '@/app/lib/refautomex-api';
import '@/app/translations/i18next-translation';

// ---- UI & UX constants (ported from Pulsety style) ----------------------

const PAGE_SIZE = 16;

const gridVariants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.015, duration: 0.4 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9, rotate: -1 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: {
      delay: i * 0.0005,
      duration: 0.05,
      ease: [0.25, 0.8, 0.5, 1],
      type: 'spring',
      stiffness: 500,
      damping: 8,
    },
  }),
};

const PREFERRED_ORDER = ['motor', 'direction', 'collision', 'electrical', 'brakes', 'accessories'];
const MIN_QTY = 1;
const MAX_QTY = 20;

function normalizeGrupo(grupo) {
  return (grupo || '').toLowerCase().trim();
}

function displayGrupo(grupo) {
  const g = normalizeGrupo(grupo);
  return g.charAt(0).toUpperCase() + g.slice(1);
}

const coerceQuantity = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return MIN_QTY;
  return Math.min(Math.max(num, MIN_QTY), MAX_QTY);
};

function useCategories(products) {
  const set = new Set(products.map(p => normalizeGrupo(p.grupo)).filter(Boolean));
  const arr = Array.from(set);
  return arr.sort((a, b) => {
    const ia = PREFERRED_ORDER.indexOf(a);
    const ib = PREFERRED_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export default function CardProducts({ showSearchBar = true }) {
  const multimediaSrc = process.env.NEXT_PUBLIC_S3 || '';
  const { t } = useTranslation();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('Todos');
  const [page, setPage] = useState(1);
  const [hasAnimated, setHasAnimated] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [prodOverview, setProdOverview] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const { cart, addToCart, removeFromCart } = useCart();

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(buildApiUrl('/getProducts'), {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const payload = await response.json();
        if (!isMounted) return;
        const raw = payload?.[0] ?? [];
        const parsed = raw.map(p => ({
          ...p,
          rutasParsed: (() => {
            try {
              const arr = JSON.parse(p.rutas || '[]');
              return Array.isArray(arr) ? arr : [];
            } catch {
              return [];
            }
          })(),
        }));
        setProducts(parsed);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Error fetching products:', err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchProducts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [refreshIndex]);

  const categories = useCategories(products);

  const source = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const bySection = selectedSection === 'Todos'
      ? products
      : products.filter(p => normalizeGrupo(p.grupo) === normalizeGrupo(selectedSection));
    return bySection.filter(p => p.descripcion.toLowerCase().includes(term)).sort((a, b) => a.descripcion.localeCompare(b.descripcion));
  }, [products, searchTerm, selectedSection]);

  const totalPages = Math.max(1, Math.ceil(source.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = source.slice(start, start + PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchTerm, selectedSection]);

  const handleOpenOverview = (p) => {
    setProdOverview({ ...p, images: p.rutasParsed });
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setProdOverview(null);
  };
  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', showModal);
    return () => { document.body.classList.remove('overflow-hidden'); };
  }, [showModal]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const detectMobile = () => setIsMobile(window.innerWidth < 640);
    detectMobile();
    window.addEventListener('resize', detectMobile);
    return () => window.removeEventListener('resize', detectMobile);
  }, []);

  useEffect(() => {
    if (!products.length) return;
    setQuantities((prev) => {
      const next = { ...prev };
      let changed = false;
      products.forEach((product) => {
        if (next[product.num_parte] === undefined) {
          next[product.num_parte] = MIN_QTY;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [products]);

  useEffect(() => {
    if (!cart.length) return;
    setQuantities((prev) => {
      const next = { ...prev };
      let changed = false;
      cart.forEach((item) => {
        const qty = item.quantity || MIN_QTY;
        if (next[item.num_parte] !== qty) {
          next[item.num_parte] = qty;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [cart]);

  const handleIncrement = (id) => {
    setQuantities((prev) => {
      const current = coerceQuantity(prev[id]);
      if (current >= MAX_QTY) return prev;
      return { ...prev, [id]: current + 1 };
    });
  };

  const handleDecrement = (id) => {
    setQuantities((prev) => {
      const current = coerceQuantity(prev[id]);
      if (current <= MIN_QTY) return prev;
      return { ...prev, [id]: current - 1 };
    });
  };

  const handleQuantityInputChange = (id, value) => {
    if (value === '') {
      setQuantities((prev) => ({ ...prev, [id]: '' }));
      return;
    }
    const num = Number(value);
    if (!Number.isNaN(num) && num >= MIN_QTY && num <= MAX_QTY) {
      setQuantities((prev) => ({ ...prev, [id]: num }));
    }
  };

  const handleQuantityBlur = (id, value) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: coerceQuantity(value),
    }));
  };

  const handleAddProduct = (product) => {
    const qty = coerceQuantity(quantities[product.num_parte]);
    addToCart(product, qty);
    setQuantities((prev) => ({ ...prev, [product.num_parte]: qty }));
  };

  const handleRemoveProduct = (product) => {
    removeFromCart(product);
    setQuantities((prev) => ({ ...prev, [product.num_parte]: MIN_QTY }));
  };

  if (isLoading) return <Spinner />;
  if (error) {
    return (
      <div className="px-6 py-20 text-center text-[rgb(var(--color-text))] space-y-4">
        <p className="text-lg font-semibold">{t('common.error', { defaultValue: 'An error occurred while loading products.' })}</p>
        {error?.message && (
          <p className="text-sm text-[rgb(var(--color-text))]/70 break-words">
            {error.message}
          </p>
        )}
        <button
          type="button"
          onClick={() => setRefreshIndex((prev) => prev + 1)}
          className="inline-flex items-center rounded-full bg-[rgb(var(--color-text))] px-6 py-2 text-sm font-semibold text-[rgb(var(--color-card))] shadow shadow-[rgb(var(--color-med))]/70 hover:opacity-90 transition"
        >
          {t('common.retry', { defaultValue: 'Reintentar' })}
        </button>
      </div>
    );
  }

  const animationDisabled = isMobile;
  const GridComponent = animationDisabled ? 'div' : motion.div;
  const CardComponent = animationDisabled ? 'div' : motion.div;
  const ImageWrapper = animationDisabled ? 'div' : motion.div;
  const ProductImage = animationDisabled ? 'img' : motion.img;
  const ActionButton = animationDisabled ? 'button' : motion.button;

  return (
    <section className="relative isolate py-24 sm:py-32 bg-[rgb(var(--color-card))]">
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-[rgb(var(--color-card))] via-[rgb(var(--color-gray))] to-[rgb(var(--color-bg))]" />
      <svg aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full stroke-[0.5] stroke-[rgb(var(--color-text))]/10">
        <defs>
          <pattern id="grid-pattern" width={200} height={200} patternUnits="userSpaceOnUse">
            <path d="M100 200V0.5M0.5 0.5H200" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl gradient-text-title py-1">
          {t('products.title', { defaultValue: 'Productos' })}
        </h2>
        <p className="mt-4 text-lg text-[rgb(var(--color-text))]/70 max-w-2xl mx-auto">
          {t('products.subtitle', { defaultValue: 'Explora por categoría o visualiza todo el catálogo.' })}
        </p>

        <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="rounded-full bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-text))]/20 text-[rgb(var(--color-text))] px-5 py-3 focus:ring-2 focus:ring-teal-400 outline-none"
          >
            <option value="Todos">{t('common.all', { defaultValue: 'Todos' })}</option>
            {categories.map((g) => (
              <option key={g} value={g}>{displayGrupo(g)}</option>
            ))}
          </select>

          {showSearchBar && (
            <input
              type="text"
              name="products-search"
              placeholder={t('products.filter', { defaultValue: 'Buscar producto…' })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md rounded-full px-5 py-3 bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] border border-[rgb(var(--color-text))]/20 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-[rgb(var(--color-text))]/50"
            />
          )}
        </div>

        {source.length > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full px-4 py-2 text-sm font-semibold shadow shadow-[rgb(var(--color-med))]/70 text-[rgb(var(--color-text))] disabled:opacity-40"
            >
              {t('common.prev', { defaultValue: 'Anterior' })}
            </button>
            <span className="text-[rgb(var(--color-text))]/70 text-sm">
              {t('common.pageOf', { defaultValue: 'Página {{page}} de {{total}}', page, total: totalPages })}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full px-4 py-2 text-sm font-semibold shadow shadow-[rgb(var(--color-med))]/70 text-[rgb(var(--color-text))] disabled:opacity-40"
            >
              {t('common.next', { defaultValue: 'Siguiente' })}
            </button>
          </div>
        )}

        <GridComponent
          key="product-grid"
          {...(!animationDisabled
            ? {
                initial: hasAnimated ? 'show' : 'hidden',
                animate: 'show',
                onAnimationComplete: () => setHasAnimated(true),
                variants: gridVariants,
              }
            : {})}
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 will-change-transform transform-gpu"
        >
          {pageItems.length === 0 && (
            <p className="col-span-full text-[rgb(var(--color-text))]/70 text-lg">
              {t('products.empty', { defaultValue: 'No se encontraron productos.' })}
            </p>
          )}

          {pageItems.map((product, idx) => {
            const productInCart = cart.find(item => item.num_parte === product.num_parte);
            const productId = product.num_parte;
            const storedValue = quantities[productId];
            const inputValue = productInCart
              ? (productInCart.quantity || MIN_QTY)
              : (storedValue === undefined ? MIN_QTY : storedValue);
            const img = product.rutasParsed?.[0]
              ? `${multimediaSrc}${product.rutasParsed[0]}`
              : `${multimediaSrc}productos/no-img.png`;
            const inCart = Boolean(productInCart);

            return (
              <Fragment key={`${product.grupo}-${product.num_parte}-${idx}`}>
                <CardComponent
                  {...(!animationDisabled ? { custom: idx, variants: cardVariants } : {})}
                  className="group relative flex flex-col justify-between rounded-3xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-[rgb(var(--color-med))]/30 hover:-translate-y-1 hover:scale-[1.02)] bg-[rgb(var(--color-card))]"
                >
                  <ImageWrapper
                    className="relative w-full aspect-4/3 overflow-hidden"
                    {...(!animationDisabled
                      ? {
                          whileHover: { scale: 1.05 },
                          transition: { duration: 0.3 },
                        }
                      : {})}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenOverview(product)}
                      className="absolute top-3 right-3 z-10 flex items-center justify-center h-9 w-9 rounded-full bg-[rgb(var(--color-bg))]/80 shadow text-[rgb(var(--color-text))] hover:scale-105 transition-all"
                      aria-label={t('products.details', { defaultValue: 'Ver detalles' })}
                    >
                      <CgMoreO />
                    </button>
                    <ProductImage
                      src={img}
                      alt={product.descripcion}
                      className="h-full w-full object-cover object-center"
                    />
                  </ImageWrapper>

                  <div className="flex flex-col justify-between flex-1 p-4">
                    <h4 className="text-lg font-semibold linear-text-title text-center line-clamp-2" title={product.descripcion}>
                      {product.descripcion}
                    </h4>
                    <div className="flex items-center justify-center mt-2">
                      <span className="mt-1 text-base sm:text-lg font-semibold text-[rgb(var(--color-text))]">
                        $ {Math.ceil(Number(product.precio)).toFixed(2)} MXN
                      </span>
                    </div>
                    <div className="mt-6 grid grid-cols-2 items-center gap-2 border-t border-[rgb(var(--color-text))]/10 pt-4">
                      <div className={`col-span-1 flex ${inCart ? 'items-start justify-start' : 'items-center justify-center'} gap-2`}>
                        <button
                          type="button"
                          onClick={() => handleDecrement(productId)}
                          className={`${inCart ? 'cursor-not-allowed opacity-0 pointer-events-none' : 'cursor-pointer'} flex items-center justify-center h-6 w-6 rounded-full shadow shadow-[rgb(var(--color-med))]/70 text-[rgb(var(--color-med))] hover:bg-[rgb(var(--color-bg))]/60 transition`}
                          disabled={inCart}
                          aria-label={t('products.decrease', { defaultValue: 'Disminuir' })}
                        >
                          <FaCircleMinus />
                        </button>
                        <input
                          type="number"
                          min={MIN_QTY}
                          max={MAX_QTY}
                          value={inputValue}
                          disabled={inCart}
                          onChange={(e) => handleQuantityInputChange(productId, e.target.value)}
                          onBlur={(e) => handleQuantityBlur(productId, e.target.value)}
                          className="w-14 text-center rounded-md shadow shadow-[rgb(var(--color-med))]/50 bg-transparent text-[rgb(var(--color-text))] focus:outline-none focus:ring-1 focus:ring-teal-400"
                          placeholder={`${MIN_QTY}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleIncrement(productId)}
                          className={`${inCart ? 'cursor-not-allowed opacity-0 pointer-events-none' : 'cursor-pointer'} flex items-center justify-center h-6 w-6 rounded-full shadow shadow-[rgb(var(--color-med))]/70 text-[rgb(var(--color-med))] hover:bg-[rgb(var(--color-bg))]/60 transition`}
                          disabled={inCart}
                          aria-label={t('products.increase', { defaultValue: 'Incrementar' })}
                        >
                          <FaCirclePlus />
                        </button>
                      </div>

                      <div className="col-span-1 flex justify-end">
                        {inCart ? (
                          <ActionButton
                            {...(!animationDisabled
                              ? {
                                  whileTap: { scale: 0.95 },
                                  whileHover: { scale: 1.05 },
                                }
                              : {})}
                            onClick={() => handleRemoveProduct(product)}
                            className="flex items-center gap-2 rounded-full bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-all"
                          >
                            <MdDelete className="text-base" />
                            {t('products.remove', { defaultValue: 'Quitar' })}
                          </ActionButton>
                        ) : (
                          <ActionButton
                            {...(!animationDisabled
                              ? {
                                  whileTap: { scale: 0.95 },
                                  whileHover: { scale: 1.05 },
                                }
                              : {})}
                            onClick={() => handleAddProduct(product)}
                            className="rounded-full cursor-pointer bg-[rgb(var(--color-text))] px-4 py-2 text-sm font-semibold text-[rgb(var(--color-card))] transition-all"
                          >
                            {t('products.add', { defaultValue: 'Agregar' })}
                          </ActionButton>
                        )}
                      </div>
                    </div>
                  </div>
                </CardComponent>
              </Fragment>
            );
          })}
        </GridComponent>

        {source.length > PAGE_SIZE && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-full px-4 py-2 text-sm font-semibold shadow shadow-[rgb(var(--color-med))]/70 text-[rgb(var(--color-text))] disabled:opacity-40">
              {t('common.prev', { defaultValue: 'Anterior' })}
            </button>
            <span className="text-[rgb(var(--color-text))]/70 text-sm">
              {t('common.pageOf', { defaultValue: 'Página {{page}} de {{total}}', page, total: totalPages })}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-full px-4 py-2 text-sm font-semibold shadow shadow-[rgb(var(--color-med))]/70 text-[rgb(var(--color-text))] disabled:opacity-40">
              {t('common.next', { defaultValue: 'Siguiente' })}
            </button>
          </div>
        )}
      </div>

      {showModal && prodOverview && (
        <div className="fixed z-40 inset-0 overflow-y-auto bg-[rgb(var(--color-gray))]/80">
          <div className="flex items-center justify-center min-h-screen">
            <div className="relative max-w-7xl sm:px-10 lg:px-20 bg-gradient-to-tl from-[rgb(var(--color-bg))] via-[rgb(var(--color-bg))] to-[rgb(var(--color-galaxy))] py-12 sm:rounded-xl shadow-xl">
              <div className="absolute -top-5 right-1/2 translate-x-1/2 shadow rounded-full p-3 shadow-[rgb(var(--color-text))]">
                <MdOutlineViewInAr className="h-9 w-9 text-[rgb(var(--color-text))]" />
              </div>
              <button onClick={handleCloseModal} className="absolute top-2 right-2 text-red-500 text-xl z-50">
                <IoMdCloseCircle className="h-7 w-7 animate-out" />
              </button>
              <div className="relative overflow-y-auto w-screen sm:w-auto h-[450px] sm:h-[500px]">
                <ProductOverview prodOverview={prodOverview} />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
