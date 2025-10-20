'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import { getStorageValue } from "@/app/lib/storage-values";
import { Popover } from '@headlessui/react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { PiUser } from "react-icons/pi";
import { IoBagHandleOutline } from "react-icons/io5";
import { AuthContext } from '@/app/lib/auth-tracker';
import { useCart } from '@/app/lib/shopping-context';
import { CiShop, CiShoppingCart, CiStar, CiMail } from "react-icons/ci";
import { PiBooksThin } from "react-icons/pi";
import { useTranslation } from 'react-i18next';

import RefautomexLogo from '@/app/components/refautomex-logo';
import ShiftModeButton from '@/app/components/principal/shiftmode-button';
import LangModeButton from '@/app/components/principal/langmode-button';
import WhatsAppButton from '@/app/components/principal/whatsapp-button';
import Link from 'next/link';
import MenuSlide from './menu-slide';
import NavbarPanel from '@/app/components/productivity/navbar-panel';

const MenuItems = ({ items, selectedLanguage, pathPage }) => {
    return (
        <>
            {items.map((item) => (
                <Link
                    key={item.key}
                    href={`${item.link}?lang=${selectedLanguage}`}
                    className={`
                        text-sm leading-6 xl:pr-1 flex rounded-3xl justify-center items-center bg-zinc-100/30 dark:bg-slate-300/10 relative
                        ${pathPage === item.link ? 'gradient-text' : 'text-slate-800 dark:text-stone-300 text-shadow shadow dark:shadow-slate-100/30'}
                    `}
                >
                    <div className="text-sm font-bold leading-6 p-2 shadow bg-slate-100 dark:bg-stone-700 hover:bg-zinc-50 dark:hover:bg-stone-600 rounded-full">
                        <item.icon
                            size={20}
                            className={`
                                leading-6
                                ${pathPage === item.link ? 'text-yellow-500' : 'text-slate-800 dark:text-stone-300'}
                            `}
                        />
                    </div>
                    <div className='ml-1 mr-3 text-md xl:text-lg 2xl:text-lg'>{item.name}</div>
                </Link>
            ))}
        </>
    );
};

export default function Navbar() {

    const { t, i18n } = useTranslation();
    const { isAuthenticated } = useContext(AuthContext);
    const { cartItemCount } = useCart();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const [profileImageUrl, setProfileImageUrl] = useState('null');
    const [imgError, setImgError] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('es');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const pathname = usePathname();
    const searchParams = useSearchParams();
    const dropdownRef = useRef(null);
    const cognitoUserSession = getStorageValue('CognitoUserSession');
    const username = cognitoUserSession?.idToken.payload["cognito:username"];
    const userData = getStorageValue(`user_${username}`);
    const id = userData?.idusuario;

    const menuItems = [
        { key: 1, name: t('navbar.about'), link: "/section/about", icon: PiBooksThin },
        { key: 2, name: t('navbar.contact'), link: "/section/contact", icon: CiMail },
        { key: 3, name: t('navbar.promotions'), link: "/section/promotion", icon: CiStar },
        { key: 4, name: t('navbar.products'), link: "/section/products", icon: CiShop },
    ];

    const callsToAction = [
        { key: 5, name: t('navbar.account'), href: '/section/account', icon: PiUser },
        { key: 6, name: t('navbar.shopping'), href: '/section/shopping', icon: CiShoppingCart },
    ];

    useEffect(() => {
        if (id) {
            const imageUrl = `${multimediaSrc}usr/${id}.jpg`;
            setProfileImageUrl(imageUrl);
            const image = new Image();
            image.src = imageUrl;
            image.onload = () => setImgError(false);
            image.onerror = () => setImgError(true);
        }
    }, [id, multimediaSrc]);

    // Manejar cambios de idioma con searchParams
    useEffect(() => {
        const lang = searchParams.get('lang');
        if (lang) {
            setSelectedLanguage(lang);
            // Si estás usando next-i18next, descomenta esto:
            i18n.changeLanguage(lang);
        }
    }, [searchParams]);

    // Manejar clicks fuera del dropdown
    useEffect(() => {
        function handleOutsideClick(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('click', handleOutsideClick);
        }

        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, [isOpen]);

    // Manejar scroll
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const threshold = 25;
            setIsScrolled(scrollTop > threshold);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // No renderizar en ciertas rutas
    if (pathname === '/calidad' && !isAuthenticated) {
        return null;
    }

    if (pathname === '/productivity' && isAuthenticated) {
        return <NavbarPanel />;
    }

    return (
        <header className={`fixed flex justify-center w-full z-20 opacity-90 dark:opacity-90 my-3
                            ${isScrolled ? 'bg-white/90 dark:bg-stone-950/90 shadow-md dark:shadow-slate-300/10' : ' bg-white/95 dark:bg-stone-950/95 shadow-md dark:shadow-slate-300/10'}
                            `}>
            <nav className='flex w-full min-h-[75px] sm:min-h-[80px] xl:max-w-7xl items-center justify-center lg:justify-between px-0.5 sm:px-5 transition duration-100 ease-in-out'
                aria-label="Global">
                <div className="flex flex-1 justify-center items-center md:justify-between">
                    <div className="absolute left-1">
                        <ShiftModeButton/>
                        <LangModeButton/>
                        <WhatsAppButton/>
                    </div>
                    <Link href={`/?lang=${selectedLanguage}`}>
                        <RefautomexLogo classAttr={"max-h-20 md:max-h-24 2xl:max-h-28 w-auto p-2 md:p-4 -my-1 ml-1"} />
                    </Link>
                    <div className="lg:hidden absolute right-1">
                        <MenuSlide
                            menuItems={menuItems}
                            selectedLanguage={selectedLanguage}
                            pathPage={pathname}
                            callsToAction={callsToAction}
                            mobileMenuOpen={mobileMenuOpen}
                            setMobileMenuOpen={setMobileMenuOpen}
                            cartItemCount={cartItemCount}
                        />
                    </div>
                </div>
                <Popover className="hidden lg:flex lg:gap-x-3 lg:justify-end items-center">
                    <MenuItems
                        items={menuItems}
                        selectedLanguage={selectedLanguage}
                        pathPage={pathname}
                    />
                    <div className="hidden lg:flex lg:flex-1 lg:border-l-2 lg:pl-4 lg:border-slate-600 dark:lg:border-stone-300">
                        {callsToAction.map((action) => (
                            <Link
                                key={action.key}
                                href={`${action.href}?lang=${selectedLanguage}`}
                                className={`relative text-sm font-bold leading-6 m-1 ${userData?.idusuario && action.icon === PiUser && !imgError ? '' : 'p-2.5'} shadow bg-slate-100 dark:bg-stone-700 hover:bg-zinc-50 dark:hover:bg-stone-600 rounded-full`}
                            >
                                {userData?.idusuario && action.icon === PiUser && !imgError ? (
                                    <div className="flex h-10 w-10 items-center justify-center bg-slate-50 dark:bg-stone-900 border border-slate-300 dark:border-stone-600 hover:bg-slate-100 hover:border-amber-300 dark:hover:border-amber-400 animate-out shadow-lg rounded-full overflow-hidden">
                                        <img src={profileImageUrl ? profileImageUrl : ''}
                                            onError={() => setImgError(true)}
                                            className="w-full h-full object-cover bg-gray-50"
                                            alt="Profile"
                                        />
                                    </div>
                                ) : (
                                    <action.icon
                                        size={20}
                                        className="text-slate-800 dark:text-stone-300"
                                    />
                                )}
                                {action.icon === IoBagHandleOutline && cartItemCount > 0 && (
                                    <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-semibold rounded-full h-7 w-7 flex items-center justify-center shadow-lg border-2 border-red-800 animate-up">
                                        {cartItemCount}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </Popover>
            </nav>
        </header>
    );
}