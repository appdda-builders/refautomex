'use client';

import { MdWeb } from "react-icons/md";
import { AiOutlineLogout } from "react-icons/ai";
import { FaUserCog } from "react-icons/fa";
import Spinner from "@/app/components/principal/spinner";
import { useContext, useEffect } from "react";
import { userPool } from '@/app/lib/cognito-manager';
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from '@/app/lib/auth-tracker';
import { getStorageValue, setStorageValue } from "@/app/lib/storage-values";
import { useTranslation } from 'react-i18next';

export default function Refautomex({ loading, websiteData }) {
    const { t } = useTranslation();
    const { isAuthenticated } = useContext(AuthContext);
    const router = useRouter();
    const searchParams = useSearchParams();
    const lang = searchParams.get('lang') || 'es';

    const cognitoUserSession = getStorageValue('CognitoUserSession');
    const username = cognitoUserSession?.idToken?.payload?.["cognito:username"];
    const userData = getStorageValue(`user_${username}`);
    const name = userData?.nombre;

    useEffect(() => {
        if (isAuthenticated === false) {
        router.replace(`/section/account?load=log-in&lang=${lang}`);
        }
    }, [isAuthenticated, lang, router]);

    const items = [
        {
        name: 'Historial de Pedidos',
        description: 'Productos comprados desde tu cuenta y relación de entregas',
        icon: MdWeb,
        path: `/section/refautomex?load=history&lang=${lang}`,
        },
        {
        name: 'Configuración de la cuenta',
        description: 'Datos personales, información de la cuenta y domicilio registrado.',
        icon: FaUserCog,
        path: `/section/refautomex?load=settings&lang=${lang}`,
        },
    ];

    if (isAuthenticated === false) return <Spinner />;

    return (
        <div className="bg-gradient-to-t sm:h-screen min-h-[750px] from-[rgb(var(--color-galaxy))]/50 via-[rgb(var(--color-card))] to-[rgb(var(--color-bg))] backdrop-blur-md py-28">
        {loading ? (
            <Spinner />
        ) : (
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
                <p className="mt-10 text-3xl font-bold sm:text-4xl text-[rgb(var(--color-amber))]">
                {t('account.welcome')}
                </p>
                <p className="mt-6 text-lg leading-8 text-[rgb(var(--color-text))]">
                {name ? `${t('account.services')} ${name}` : 'Cargando...'}
                </p>
            </div>

            <div className="mx-auto mt-4 max-w-2xl lg:max-w-4xl">
                <dl className="grid max-w-3xl grid-cols-1 gap-x-6 gap-y-5 lg:max-w-none lg:grid-cols-3 lg:gap-y-8">
                {items.map((item) => (
                    <div
                    key={item.name}
                    className="relative p-4 shadow-md rounded-xl animate-out bg-[rgb(var(--color-bg))] shadow shadow-[rgb(var(--color-galaxy))] cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => router.push(item.path)}
                    >
                    <dt className="text-2xl font-base leading-7 text-[rgb(var(--color-amber))] pl-16 pb-3">
                        <div className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--color-bg))] shadow shadow-[rgb(var(--color-galaxy))]">
                        <item.icon className="h-7 w-7" aria-hidden="true" />
                        </div>
                        {item.name}
                    </dt>
                    <dd className="mt-2 pl-5 leading-5 text-[rgb(var(--color-gray-base))] text-sm italic">
                        {item.description}
                    </dd>
                    </div>
                ))}

                <div
                    key="salir"
                    className="relative p-4 shadow-md rounded-xl animate-out bg-[rgb(var(--color-card))] shadow shadow-[rgb(var(--color-galaxy))] cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => {
                    try {
                        setStorageValue('CognitoUserSession', null);
                        userPool.getCurrentUser()?.signOut();
                        router.replace('/');
                    } catch (err) {
                        console.log('No existe cuenta activa', err);
                    }
                    }}
                >
                    <dt className="text-2xl font-base leading-7 text-red-500 pl-16 pb-3">
                    <div className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--color-bg))] shadow shadow-[rgb(var(--color-error))]">
                        <AiOutlineLogout className="h-7 w-7" aria-hidden="true" />
                    </div>
                    Salir de la cuenta
                    </dt>
                    <dd className="mt-2 pl-5 leading-5 text-[rgb(var(--color-text))] text-sm italic">
                    Cerrar cuenta en este dispositivo
                    </dd>
                </div>
                </dl>
            </div>
            </div>
        )}
        </div>
    );
}
