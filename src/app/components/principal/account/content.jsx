import { MdWeb } from "react-icons/md";
import { AiOutlineLogout } from "react-icons/ai"
import { FaUserCog } from "react-icons/fa";
import Spinner from "@/app/components/principal/spinner";
import { useContext } from "react";
import { userPool } from '@/app/lib/cognito-manager';
import { useRouter } from "next/router";
import { AuthContext } from '@/app/lib/auth-tracker';
import { getStorageValue, setStorageValue } from "@/app/lib/storage-values";
import { useTranslation } from 'react-i18next';

export default function Refautomex({loading, websiteData}){
    const { t } = useTranslation();
    const { isAuthenticated } = useContext(AuthContext);
    const cognitoUserSession = getStorageValue('CognitoUserSession');
    const username = cognitoUserSession?.idToken.payload["cognito:username"];
    const userData = getStorageValue(`user_${username}`);
    const name = userData?.nombre;
    const router = useRouter();
    const items = [
        {
            name: 'Historial de Pedidos',
            description: 'Productos comprados desde tu cuenta y relación de entregas',
            icon: MdWeb,
            path: '/section/refautomex?load=history'
        },
        /*
        {
            name: 'Membresías y Beneficios',
            description: 'Agrega servicios o productos en tu cuenta para mejorar tu productividad',
            icon: HiViewGridAdd,
            path: '/section/refautomex?load=memberships'
        },
        */
        {
            name: 'Configuración de la cuenta',
            description: 'Datos personales, Información de la cuenta y domicilio registrado.',
            icon: FaUserCog,
            path: '/section/refautomex?load=settings'
        },
    ]
    if (!isAuthenticated) {
        router.push('/section/account');
    }
    return (
        <div className="bg-gradient-to-b sm:h-screen min-h-[750px] from-white via-gray-50 to-yellow-200 dark:from-stone-950 dark:via-slate-950 dark:to-blue-950 backdrop-blur-md py-28">
            {loading ?
            (
                <Spinner/>
            ) : (
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <p className="mt-10 text-3xl font-bold tracking-tight color-yankees-purple sm:text-4xl dark:text-white">
                            {t('account.welcome')}
                        </p>
                        <p className="mt-6 text-lg leading-8 text-gray-500 dark:text-gray-200">
                            {name ? t('account.services') + name : 'Cargando...'}
                        </p>
                    </div>
                    <div className="mx-auto mt-4 max-w-2xl lg:max-w-4xl">
                        <dl className="grid max-w-3xl grid-cols-1 gap-x-6 gap-y-5 lg:max-w-none lg:grid-cols-3 lg:gap-y-8">
                            {items.map((item) => (
                            <div key={item.name} className="relative p-4 shadow-md rounded-xl animate-out bg-slate-50 dark:bg-stone-800" onClick={() => router.push(item.path)}>
                                <dt className="text-2xl font-base leading-7 text-amber-400 dark:text-amber-300 pl-16 pb-3">
                                    <div className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-blue-950 shadow-md">
                                        <item.icon className="h-7 w-7" aria-hidden="true" />
                                    </div>
                                    {item.name}
                                </dt>
                                <dd className="mt-2 pl-5 leading-5 text-gray-500 dark:text-slate-50 text-sm italic">{item.description}</dd>
                            </div>
                            ))}
                            <div key='salir' className='relative p-4 shadow-md rounded-xl animate-out bg-slate-50 dark:bg-stone-800'
                            onClick={() => {
                                try {
                                    setStorageValue('CognitoUserSession', null);
                                    userPool.getCurrentUser().signOut();
                                    window.location.href = '/';
                                } catch (err) {
                                    console.log('No existe cuenta activa', err)
                                }
                            }}
                            >
                            <dt className="text-2xl font-base leading-7 text-red-500 dark:text-red-300 pl-16 pb-3">
                                <div className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-blue-950 shadow-md">
                                    <AiOutlineLogout className="h-7 w-7" aria-hidden="true" />
                                </div>
                                Salir de la cuenta
                            </dt>
                            <dd className="mt-2 pl-5 leading-5 text-gray-500 dark:text-slate-50 text-sm italic">Cerrar cuenta en este dispositivo</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            )}
        </div>
    )
    
}