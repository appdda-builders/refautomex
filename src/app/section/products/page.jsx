'use client';
import MetaHead from "@/app/components/meta-head";
import CardProducts from "@/app/components/principal/products/card-products";
import Title from "@/app/components/principal/title";
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation';

export default function Products() {
    const { t } = useTranslation();
    return(
        <section className="bg-stone-200 dark:bg-stone-800 py-0.5">
            <MetaHead title={t('navbar.products')}/>
            <div className="mt-48 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                <Title title={t('products.intro')} desc={t('products.title')} />
            </div>
            <CardProducts />
        </section>
    )
}