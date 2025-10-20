import { useState, useEffect } from 'react';
import { Dialog, Transition, Popover } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { FaUsersViewfinder, FaBoxesPacking } from 'react-icons/fa6';
import { AiOutlineDashboard, AiOutlineLogout, AiOutlineFileText } from 'react-icons/ai';
import { HiClipboardDocumentList, HiMiniCog6Tooth } from "react-icons/hi2";
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { getStorageValue, setStorageValue } from "@/app/lib/storage-values";
import { userPool } from '@/app/lib/cognito-manager';
import { GiAutoRepair } from 'react-icons/gi';
import { MdSell } from "react-icons/md";
import { BiSolidUserCircle } from 'react-icons/bi';
import RefautomexLogo from '@/app/components/refautomex-logo';
import ShiftModeButton from '../principal/shiftmode-button';
import React from 'react';
import Link from 'next/link';

const MenuItems = ({ items, closeMenu }) => {
    const [openedSection, setOpenedSection] = useState(null);

    const toggleSection = (sectionName) => {
        setOpenedSection(prevOpenedSection => (
            prevOpenedSection === sectionName ? null : sectionName
        ));
    };

    return (
        <>
            {items.map((item) => (
            <div key={item.name} className='px-3 cursor-pointer bg-slate-300 dark:bg-stone-700'>
                {item.href ? (
                <Link href={item.href} className="flex items-center text-gray-800 dark:text-gray-50 py-2">
                    {item.icon && <item.icon className="mr-3" />}
                    {item.name}
                </Link>
                ) : (
                <div
                    onClick={() => toggleSection(item.name)} 
                    className="flex items-center text-gray-800 dark:text-gray-50 py-2"
                >
                    {openedSection === item.name ? <IoIosArrowUp className='mr-4'/> : <IoIosArrowDown className='mr-4'/>}
                    {item.icon && <item.icon className="mr-3" />}
                    {item.name}
                </div>
                )}
                {item.subNav && openedSection === item.name && (
                <div className="p-3 transition duration-300 ease-in-out">
                    {item.subNav.map(subItem => (
                    <Link key={subItem.name} href={subItem.href} onClick={closeMenu} className="block text-gray-700 rounded-md py-1 dark:text-gray-200 my-1 pl-2 bg-gray-100 dark:bg-stone-800">
                        {subItem.name}
                    </Link>
                    ))}
                </div>
                )}
            </div>
            ))}
        </>
    );
};

export default function NavbarPanel(){
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const cognitoUserSession = getStorageValue('CognitoUserSession');
    const username = cognitoUserSession?.idToken.payload["cognito:username"];
    const userData = getStorageValue(`user_${username}`);
    const name = userData?.nombre;
    const id = userData?.idusuario;

    const navItems = [
        { name: 'Ventas',
            icon: MdSell,
            subNav: [
                { name: 'Tickets a clientes', href: '/productivity?load=tickets' },
                { name: 'Devoluciones', href: '/productivity?load=devolution' },
                { name: 'Historial de ventas', href: '/productivity?load=history' }
            ],
        },
        { name: 'Almacén',
            icon: FaBoxesPacking,
            subNav: [
                { name: 'Gestión de Almacén', href: '/productivity?load=warehouse' },
                { name: 'Faltantes', href: '/productivity?load=missing' }
            ],
        },
        { name: 'Compras',
            icon: HiClipboardDocumentList,
            subNav: [
                { name: 'Capturación de productos', href: '/productivity?load=capture' },
                { name: 'Gestión de proveedores', href: '/productivity?load=providers' },
            ],
        },
        { name: 'Servicios',
            icon: FaUsersViewfinder,
            subNav: [
                { name: 'Facturación Web', href: '/productivity?load=invoice' },
                { name: 'Gestión de cuentas activas', href: '/productivity?load=personal' }
            ],
        },
        { name: 'Pedidos',
            icon: GiAutoRepair,
            subNav: [
                { name: 'En sucursal', href: '/productivity?load=site' },
                { name: 'A domicilio', href: '/productivity?load=delivery' }
            ],
        },
        { name: 'Home', icon: AiOutlineDashboard, href: '/productivity?load=home' },
        { name: 'Configuración', icon: HiMiniCog6Tooth, href: '/productivity?load=user-settings' },
    ];

    useEffect(() => {
        const imageUrl = `${multimediaSrc}usr/${id}.jpg`;
        setProfileImageUrl(imageUrl);
        const image = new Image();
        image.src = imageUrl;
        image.onload = () => setImgError(false);
        image.onerror = () => setImgError(true);
    }, [id, multimediaSrc]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY; //cuantos pixeles (ya llevo) muevo en y
            const threshold = 25; // cuando se hace el cambio fade navbar
            setIsScrolled(scrollTop > threshold);
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    if (userData && userData?.empleado === 0) {
        return null;
    }

    return (
        <header className={`fixed flex justify-center min-h-[95px] p-0.5 my-2 lg:my-4 opacity-95 w-full z-20 ${isScrolled ? 'bg-slate-100 dark:bg-zinc-800 shadow' : 'bg-gray-100 dark:bg-stone-800 shadow-md'} `}>
            <nav className="flex w-full items-center justify-between max-w-7xl mx-5 transition duration-100 ease-in-out" aria-label="Global">

                <div className='flex w-full items-center justify-between '>
                    <div className='flex flex-row items-center justify-center md:mx-3 md:mt-0'>
                        <Link href={{ pathname: "/productivity" }} className="flex lg:flex-1">
                            <RefautomexLogo classAttr={'h-16 2xl:h-20'} />
                        </Link>
                        <div>
                            <ShiftModeButton/>
                        </div>
                    </div>
                    <div className='flex justify-between sm:justify-end items-center mr-2.5'>
                        <Link href={{ pathname: "/productivity", query: { load: 'user-settings' } }} className='mx-3 text-md xl:text-lg leading-6 xl:pr-1 flex rounded-3xl justify-center items-center shadow dark:shadow-slate-100/10 dark:text-white bg-white dark:bg-slate-300/10 cursor-pointer animate-out'>
                            {userData?.idusuario ? (
                                <div className="flex h-9 w-9 2xl:h-11 2xl:w-11 items-center justify-center bg-slate-50 dark:bg-stone-900 border border-slate-300 dark:border-stone-600 hover:bg-slate-100 hover:border-amber-300 dark:hover:border-amber-400 animate-out shadow-lg rounded-full overflow-hidden">
                                    <img src={profileImageUrl} onError={() => setImgError(true)} className="w-full h-full object-cover bg-gray-50"/>
                                </div>
                            ) : (
                                <BiSolidUserCircle className="w-8 h-8 rounded-full shadow-xl border border-indigo-100 my-auto animate-out" />
                            )}
                            <div className='ml-1.5 mr-2 text-sm xl:text-xl italic hidden sm:block'>
                                {name}
                            </div>
                        </Link>
                        <button
                            type="button"
                            className="my-auto md:mt-0 items-center rounded-full p-1.5 dark:text-gray-100 text-zinc-700 bg-stone-300 dark:bg-stone-950 shadow shadow-slate-300/10 animate-out"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <span className="sr-only">main menu</span>
                            <Bars3Icon className="h-6 w-6 2xl:h-8 2xl:w-8" aria-hidden="true" />
                        </button>
                    </div>

                </div>
            </nav>
            <Transition
                show={mobileMenuOpen}
                enter="transition ease-out duration-200 transform"
                enterFrom="opacity-0 translate-x-full"
                enterTo="opacity-100 translate-x-0"
                leave="transition ease-in duration-150 transform"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 translate-x-full"
                >
                <Dialog as="div" className="fixed inset-0 overflow-hidden z-40" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
                    <div className="absolute inset-0 overflow-hidden">
                    <Dialog.Panel className="fixed inset-y-0 right-0 pl-10 max-w-full flex sm:pl-16">
                        <Transition.Child
                        as="div"
                        className="w-screen max-w-md"
                        enter="transform transition ease-in-out duration-500 sm:duration-700"
                        enterFrom="translate-x-full"
                        enterTo="translate-x-0"
                        leave="transform transition ease-in-out duration-500 sm:duration-700"
                        leaveFrom="translate-x-0"
                        leaveTo="translate-x-full"
                        >
                        <div className="flex flex-col h-full dark:bg-stone-800 bg-slate-200 shadow-xl overflow-y-auto">
                            <div className="px-5 pt-5 pb-3 border-b dark:border-gray-200 border-gray-500">
                                <Dialog.Title className="text-xl font-semibold text-gray-900">
                                    <RefautomexLogo classAttr={'h-16'} />
                                </Dialog.Title>
                            </div>
                            <div className="flex flex-col flex-1 mt-5">
                                <nav className="flex-1 space-y-2">
                                <MenuItems
                                    items={navItems}
                                    closeMenu={() => setMobileMenuOpen(false)}
                                />
                                <div key='salir' className='px-3 bg-slate-300 dark:bg-stone-700 cursor-pointer'
                                    onClick={() => {
                                        try {
                                            setStorageValue('CognitoUserSession', null);
                                            userPool.getCurrentUser().signOut();
                                            window.location.href = '/productivity';
                                        } catch (err) {
                                            console.log('No existe cuenta activa', err)
                                        }
                                    }}
                                >
                                    <button className="flex items-center text-gray-800 dark:text-gray-50 py-2">
                                        <AiOutlineLogout className='mr-3'/>
                                        Salir
                                    </button>
                                </div>
                                </nav>
                            </div>
                        </div>
                        </Transition.Child>
                    </Dialog.Panel>
                    </div>
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                        type="button"
                        className="rounded-md dark:text-gray-100 dark:hover:text-gray-500 text-gray-500 hover:text-gray-950"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    </div>
                </Dialog>
            </Transition>
        </header>
    )
}