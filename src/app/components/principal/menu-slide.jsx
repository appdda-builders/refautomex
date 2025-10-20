import { Popover, Transition, Dialog } from '@headlessui/react'
import { motion } from 'framer-motion';
import { FaBarsStaggered } from "react-icons/fa6";
import { IoBagHandleOutline } from "react-icons/io5";
import { PiUser } from "react-icons/pi";
import { useState, useEffect } from 'react';
import { getStorageValue } from "@/app/lib/storage-values";
import { XMarkIcon } from '@heroicons/react/20/solid';
import RefautomexLogo from '@/app/components/refautomex-logo';
import Link from 'next/link'

export default function MenuSlide({menuItems, callsToAction, selectedLanguage, pathPage, cartItemCount }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [imgError, setImgError] = useState(false);
    const cognitoUserSession = getStorageValue('CognitoUserSession');
    const username = cognitoUserSession?.idToken.payload["cognito:username"];
    const userData = getStorageValue(`user_${username}`);
    const id = userData?.idusuario;

    const itemVariants = {
        hidden: { x: -10, opacity: 0 },
        visible: { x: 0, opacity: 1 },
    };

    useEffect(() => {
        const imageUrl = `${multimediaSrc}usr/${id}.jpg`;
        setProfileImageUrl(imageUrl);
        const image = new Image();
        image.src = imageUrl;
        image.onload = () => setImgError(false);
        image.onerror = () => setImgError(true);
    }, [id, multimediaSrc]);

    return (
    <Popover className="relative focus:ring-0">
        <Popover.Button onClick={() => setMobileMenuOpen(true)} className="p-2 m-2 text-sm font-semibold leading-6 text-gray-900 rounded-full shadow-xl bg-gray-300 hover:bg-slate-100 dark:bg-stone-800 dark:hover:bg-stone-600 dark:text-slate-50 focus:ring-0">
            <FaBarsStaggered size={20} />
            {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-0.5 bg-red-500 border-2 border-red-800 animate-up text-white text-xs font-semibold rounded-full h-7 w-7 flex items-center justify-center shadow-lg">
                    {cartItemCount}
                </span>
            )}
        </Popover.Button>
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
                        <div className="flex flex-col h-full bg-gradient-to-bl from-white to-stone-300 dark:from-slate-950 dark:to-stone-600 shadow-xl overflow-y-auto">
                            <div className="px-5 pt-5 ">
                                <Dialog.Title className="text-xl font-semibold text-gray-900 flex justify-center">
                                    <RefautomexLogo classAttr="h-14 w-auto" />
                                </Dialog.Title>
                            </div>
                            <div className="flex flex-col flex-1 mt-5">
                                <div className="grid grid-cols-2 divide-x divide-gray-900/5 ">
                                    {callsToAction.map((action) => (
                                        <Link passHref key={action.key} 
                                                href={{ pathname: action.href, query: { lang: selectedLanguage } }}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`
                                                group relative flex items-center justify-center gap-x-6 my-0.5 p-2 dark:bg-stone-800 bg-zinc-200 hover:bg-slate-200 dark:hover:bg-stone-600
                                                ${pathPage === action.link ? 'gradient-text' : 'text-slate-800 dark:text-stone-300'}
                                            `}>
                                            
                                            <div className={`relative text-sm font-bold leading-6 m-1 ${userData?.idusuario && action.icon === PiUser ? '' : 'p-2.5'} mt-1 flex flex-none items-center justify-center rounded-full shadow bg-gray-100 dark:bg-slate-700 group-hover:bg-white dark:group-hover:bg-stone-700`}>
                                                
                                                {userData?.idusuario && action.icon === PiUser ? (
                                                    <div className="flex h-10 w-10 items-center justify-center bg-slate-50 dark:bg-stone-900 border border-slate-300 dark:border-stone-600 hover:bg-slate-100 hover:border-amber-300 dark:hover:border-amber-400 animate-out shadow-lg rounded-full overflow-hidden">
                                                        <img src={profileImageUrl} onError={() => setImgError(true)} className="w-full h-full object-cover bg-gray-50"/>
                                                    </div>
                                                ) : (
                                                    <action.icon className={`h-6 w-6 text-slate-700 dark:text-slate-50"
                                                        ${pathPage === action.link ? 'text-yellow-500' : 'text-slate-800 dark:text-stone-300'}
                                                        `}
                                                        aria-hidden="true"
                                                        />
                                                )}

                                                {cartItemCount > 0 && action.icon === IoBagHandleOutline && (
                                                    <span className="absolute -top-2 -left-2 bg-red-500 border-2 border-red-800 animate-up text-white text-xs font-semibold rounded-full h-7 w-7 flex items-center justify-center shadow-lg">
                                                        {cartItemCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className='text-md my-2'>{action.name}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <nav className="flex-1 space-y-2 px-4 pt-3 border-t border-gray-200">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.key}
                                        href={{ pathname: item.link, query: { lang: selectedLanguage } }}
                                        passHref
                                    >
                                        <motion.div
                                            variants={itemVariants}
                                            className={`
                                                group relative flex gap-x-6 rounded-full my-0.5 p-2 hover:bg-slate-200 shadow dark:shadow-slate-300/10 dark:hover:bg-stone-600
                                                ${pathPage === item.link ? 'gradient-text' : 'text-slate-800 dark:text-stone-300'}
                                            `}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <div className="mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full shadow bg-gray-100 dark:bg-slate-700 group-hover:bg-white dark:group-hover:bg-stone-700">
                                                <item.icon className={`h-6 w-6 text-slate-700 dark:text-slate-50"
                                                ${pathPage === item.link ? 'text-yellow-500' : 'text-slate-800 dark:text-stone-300'}
                                                `}
                                                aria-hidden="true"
                                                />
                                            </div>
                                            <div>
                                                <p className='text-md my-2'>{item.name}</p>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                                </nav>
                            </div>
                        </div>
                        </Transition.Child>
                    </Dialog.Panel>
                    </div>
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                        type="button"
                        className="rounded-md text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6 text-red-500 dark:text-red-100" aria-hidden="true" />
                    </button>
                    </div>
                </Dialog>
            </Transition>
    </Popover>
    )
}


