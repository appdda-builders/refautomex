'use client';

import { useContext, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthContext } from '@/app/lib/auth-tracker';
import { IoHome } from "react-icons/io5";

import Home from '@/app/components/productivity/home';
import Content from '@/app/components/principal/account/content';
import Settings from '@/app/components/productivity/settings';
import History from '@/app/components/principal/account/order-history';

export default function Refautomex() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useContext(AuthContext);

    const lang = searchParams.get('lang') || 'es';
    const load = searchParams.get('load') || 'home';

    useEffect(() => {
        if (isAuthenticated === false) {
            router.replace(`/section/account?load=log-in&lang=${lang}`);
        }
    }, [isAuthenticated, lang, router]);

    const component = useMemo(() => {
        switch (load) {
        case 'home':
            return <Content />;
        case 'history':
            return <History />;
        case 'memberships':
            return <Home />;
        case 'settings':
            return <Settings />;
        default:
            return <Content />;
        }
    }, [load]);

    if (isAuthenticated === false) return null;

    return (
        <>
        {component}
        {load !== 'home' && (
            <div
            onClick={() => router.push(`/section/refautomex?lang=${lang}`)}
            className="absolute top-32 left-5 sm:left-10 rounded-full justify-center items-center flex bg-[rgb(var(--color-card-white))] text-[rgb(var(--color-text))] shadow-md animate-out w-12 h-12 cursor-pointer"
            title="Inicio"
            >
            <IoHome className='w-8 h-8' />
            </div>
        )}
        </>
    );
}
