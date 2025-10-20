'use client';
import { FaStar } from "react-icons/fa6";
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation';

export default function Spinner() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col justify-center items-center h-screen w-screen bg-white dark:bg-slate-950" > 
            <FaStar className="animate-bounce text-6xl text-yellow-500 h-12 w-12" />
            <div className="text-slate-700 dark:text-slate-50 italic font-semibold text-xl animate-pulse">
                {t('navbar.spinner')}
            </div>
        </div>
    );
}