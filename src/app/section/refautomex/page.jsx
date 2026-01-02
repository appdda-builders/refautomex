'use client';

import { useContext, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthContext } from '@/app/lib/auth-tracker';

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
        </>
    );
}
