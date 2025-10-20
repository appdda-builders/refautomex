'use client';
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { AuthContext } from '@/app/lib/auth-tracker';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useContext } from 'react';
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { userPool } from "@/app/lib/cognito-manager";
import { setStorageValue } from "@/app/lib/storage-values";
import RefautomexLogo from "@/app/components/refautomex-logo";
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation';
import { IoMdLogIn } from "react-icons/io";
import { AiFillEye } from 'react-icons/ai';
import { IoIosCloseCircle } from "react-icons/io";
import Link from 'next/link';
//import { Auth } from 'aws-amplify';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [alertSuccess, setSuccessMessage] = useState(null);
    const [alertConfirmation, setConfirmationMessage] = useState(null);
    const [indicationMessage, setIndicationMessage] = useState(null);
    const [isLoading, setLoading] = useState(false);
    const { isAuthenticated } = useContext(AuthContext);
    const [selectedLanguage, setSelectedLanguage] = useState('es');
    const { i18n, t } = useTranslation();
    const urlParams = new URLSearchParams(window.location.search);
    const userStatus = urlParams.get('user_status');

    const signIn = async (provider) => {

        try {
            if (Auth.signInWithRedirect) {
                await Auth.signInWithRedirect({ provider });
            } else {
                console.error("signInWithRedirect no está disponible en esta versión de Amplify.");
            }
        } catch (err) {
            console.error("Error en signInWithRedirect:", err);
        }
    };


    useEffect(() => {
        if (userStatus && userStatus.includes('new')) {
            setSuccessMessage('Se ha enviado un correo de confirmación a tu correo.');
            setIndicationMessage('Por favor, verifica tu bandeja de entrada y sigue las instrucciones para validar tu cuenta.');
        } else if (userStatus && userStatus.includes('password-reset')) {
            setSuccessMessage('Se ha restablecido su contraseña con éxito.');
        } else if (userStatus && userStatus.includes('error')) {
            setAlertMessage('Por favor, inténtalo de nuevo más tarde.');
        }
    }, []);

    useEffect(() => {
        const handleRouteChange = () => {
            const lang = router.query.lang;
            if (lang) {
                i18n.changeLanguage(lang);
                setSelectedLanguage(lang);
            }
        };
        router.events.on('routeChangeComplete', handleRouteChange);

        handleRouteChange();
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [router.query.lang, i18n, router.events]);

    const onSubmit = (event) => {
        event.preventDefault();
        setLoading(true);

        const authenticationDetails = new AuthenticationDetails({
            Username: email,
            Password: password
        });

        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: userPool
        });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                setStorageValue('CognitoUserSession', result);
                window.location.href = '/section/refautomex';
            },
            onFailure: function (err) {
                if (err.code === 'UserNotConfirmedException') {
                    setAlertMessage('Tu cuenta no ha sido confirmada.');
                    setConfirmationMessage('Por favor confirma tu correo para ingresar a tu cuenta. ¿No recibiste correo?');
                } else {
                    setAlertMessage('Correo electrónico o contraseña inválidos.');
                }
                setLoading(false);
            }
        });
    };

    const resendConfirmationCode = () => {
        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: userPool
        });

        cognitoUser.resendConfirmationCode((err, result) => {
            if (err) {
                setAlertMessage(err.message || JSON.stringify(err));
                return;
            }
            setSuccessMessage('Se ha reenviado el correo de confirmación.');
            setIndicationMessage('Por favor, verifica tu bandeja de entrada y sigue las instrucciones para validar tu cuenta.');
        });
    };

    const closeAlert = () => {
        setAlertMessage(null);
        setSuccessMessage(null);
    };

    if (isAuthenticated) {
        router.push('/section/refautomex');
    }

    return (
        <div className="relative mx-auto w-full md:w-[500px] bg-slate-200 dark:bg-slate-700 opacity-40 dark:opacity-50 md:rounded-xl shadow-md dark:shadow-slate-300/10 p-6">
            {alertMessage && (
                <div className="rounded-xl my-1 shadow bg-gradient-to-br from-orange-500 to-amber-200 dark:from-indigo-950 dark:to-indigo-800 text-center py-4 lg:px-4">
                    <div className="px-4 md:px-2 p-1 bg-transparent items-center text-stone-900 dark:text-indigo-100 leading-none lg:rounded-full flex lg:inline-flex" role="alert">
                        <span className="flex rounded-full bg-red-600 text-indigo-100 uppercase px-2 py-1 text-xs font-bold mr-3 shadow">Error</span>
                        <span className="font-semibold mr-2 text-left flex-auto">{alertMessage}</span>
                        <button onClick={closeAlert} className="ml-2">
                            <IoIosCloseCircle className="text-red-500 dark:text-red-300 text-2xl" />
                        </button>
                    </div>
                    {alertConfirmation && (
                        <div>
                            <span className="mx-2.5 italic font-sans text-left text-stone-900 dark:text-indigo-100">{alertConfirmation}</span>
                            <button onClick={resendConfirmationCode} className="ml-2 text-blue-500 underline">Reenviar</button>
                        </div>
                    )}
                </div>
            )}
            {alertSuccess && (
                <div className="rounded-xl my-1 shadow bg-gradient-to-br from-orange-400 to-amber-200 dark:from-indigo-950 dark:to-indigo-600 text-center py-4 lg:px-4">
                    <div className="px-4 md:px-2 p-1 bg-transparent items-center text-stone-900 dark:text-indigo-100 leading-none lg:rounded-full flex lg:inline-flex" role="alert">
                        <span className="flex rounded-full dark:bg-amber-500 bg-indigo-500 text-white uppercase px-2 py-1 text-xs font-bold mr-3 shadow">Warning</span>
                        <span className="m-2 text-left font-sans">
                            <b>{alertSuccess}</b>
                        </span>
                        <button onClick={closeAlert} className="ml-2">
                            <IoIosCloseCircle className="text-red-500 dark:text-red-300 text-2xl" />
                        </button>
                    </div>
                    <div className="mx-2.5 italic font-sans text-left flex-auto text-stone-900 dark:text-indigo-100 ">{indicationMessage}</div>
                </div>
            )}
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <RefautomexLogo classAttr={"h-24 md:h-32 w-auto object-contain p-2 md:p-3 mx-auto"} />
                    <h2 className="text-center text-2xl leading-9 tracking-tight text-stone-600 dark:text-stone-200 text-shadow">
                        {t('account.account')}
                    </h2>
                </div>
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form className="space-y-6" method="POST" onSubmit={onSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                {t('account.mail')}
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    onChange={event => setEmail(event.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                    {t('account.password')}
                                </label>
                                <div className="text-sm">
                                    <Link href={{ pathname: "/section/account", query: { load: 'recovery', lang: selectedLanguage } }} className="font-semibold leading-6 dark:text-amber-300 text-amber-400 text-shadow">
                                        {t('account.forgot')}
                                    </Link>
                                </div>
                            </div>
                            <div className="mt-2 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={passwordVisible ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    onChange={event => setPassword(event.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                                <div
                                    className='absolute right-0 top-0 bg-blue-300 cursor-pointer m-1.5 p-1 rounded-full shadow-xl'
                                    onClick={() => setPasswordVisible(!passwordVisible)}>
                                    <AiFillEye />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-1 justify-center items-center">
                            <button type="submit" className="bg-gradient-to-bl hover:bg-gradient-to-tr from-amber-500 via-yellow-400 to-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer font-bold">
                                <span className='flex px-1 justify-center items-center'>
                                    <IoMdLogIn className="inline-block text-xl md:text-2xl mx-1.5 p-0.5 rounded-md bg-slate-50 opacity-50 shadow" />
                                    {t('account.login')}
                                </span>
                            </button>
                        </div>
                    </form>
                    <p className="mt-5 text-center text-sm text-slate-700 dark:text-stone-200">
                        <Link href={{ pathname: "/section/account", query: { load: 'sign-up', lang: selectedLanguage } }} className="font-semibold leading-6 dark:text-amber-300 text-amber-400 text-shadow">
                            {t('account.noAccount')}
                        </Link>
                    </p>
                    <div className="mt-6 flex items-center justify-center">
                        <div className="flex-grow border-t border-gray-400"></div>
                        <span className="mx-4 text-gray-700 text-sm dark:text-gray-300">
                        {t('account.continue')}
                        </span>
                        <div className="flex-grow border-t border-gray-400"></div>
                    </div>
                    <div className="mt-6 flex justify-center space-x-4">
                        <button
                            onClick={() => signIn('Google')}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-stone-500 bg-stone-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        >
                            <FcGoogle className="w-5 h-5 mr-3" />
                            Google
                        </button>
                        <button
                            onClick={() => signIn('Facebook')}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-stone-500 bg-stone-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        >
                            <FaFacebook className="w-5 h-5 mr-3 text-blue-600" />
                            Facebook
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
