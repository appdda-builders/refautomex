import React from 'react';
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation';

export default function PopTwoSections ({tracking, title, sectionOne, sectionTwo, imageSrc}) {
    const { t } = useTranslation();

    return (
        <div className="container mx-auto p-4 leading-6 text-justify">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-10 px-2">
                <div className="lg:col-span-2">
                    <h2 className="text-md hover:opacity-80 cursor-pointer text-amber-500 dark:text-amber-300 font-semibold tracking-wide uppercase">{t(tracking)}</h2>
                    <h3 className="text-4xl italic text-gray-900 dark:text-slate-50 mt-3">{t(title)}</h3>
                </div>
                <div className="lg:col-span-1">
                    <p className="text-gray-600 dark:text-stone-300 mt-4">
                        {t(sectionOne)}
                    </p>
                </div>
                <div className="lg:col-span-1">
                    <p className="text-gray-600 dark:text-stone-300 mt-4">
                        {t(sectionTwo)}
                    </p>
                </div>
                <div className="lg:col-span-2">
                    <div className="h-[350px] md:h-[500px] w-full bg-cover bg-center rounded-lg shadow-lg overflow-hidden mt-6 lg:mt-0">
                        <img src={imageSrc} alt="Workflow" className="w-full h-full object-cover sm:animate-out" />
                    </div>
                </div>
            </div>
        </div>
    );
};