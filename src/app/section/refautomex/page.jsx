'use client';
import { useRouter } from 'next/router';
import { AuthContext } from '@/lib/auth-tracker';
import { useContext } from 'react';
import { IoHome } from "react-icons/io5";
import MetaHead from '@/app/components/meta-head';
import Home from '@/app/components/productivity/home';
import Content from '@/app/components/principal/account/content';
import Settings from '@/app/components/productivity/settings';
import History from '@/app/components/principal/account/order-history';

/*
Client account for the Refautomex section.
*/
export default function Refautomex() {
    const router = useRouter();
    const load = router.query.load;
    const { isAuthenticated } = useContext(AuthContext);
    let component;
    let metaTitle;

    switch (load) {
        case 'home':
            component = <Content />;
            metaTitle = 'Refautomex';
            break;
        case 'history':
            component = <History />;
            metaTitle = 'History';
            break;
        case 'memberships':
            component = <Home />;
            metaTitle = 'Memberships';
            break;
        case 'settings':
            component = <Settings />;
            metaTitle = 'Settings';
            break;
        default:
            component = <Content />;
            break;
    }

    if (!isAuthenticated) {
        router.push('/section/account');
        return null;
    } else {
        return (
            <>
                <MetaHead title={metaTitle} />
                {component}
                {load !== 'home' && load !== undefined && (
                    <div 
                        onClick={() => router.push('/section/refautomex')} 
                        className="absolute top-32 left-5 sm:left-10 rounded-full justify-center items-center flex bg-stone-300 text-slate-800 shadow-md dark:bg-stone-700 dark:text-white animate-out w-12 h-12 cursor-pointer"
                    >
                        <IoHome className='w-8 h-8' />
                    </div>
                )}
            </>
        );
    }
}

