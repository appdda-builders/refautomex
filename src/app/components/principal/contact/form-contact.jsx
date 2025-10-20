import React, { useState } from 'react'
import emailjs from '@emailjs/browser';
import { useTranslation } from 'react-i18next';
import { AiOutlineSend } from "react-icons/ai";
import '@/app/translations/i18next-translation';
import ReCAPTCHA from "react-google-recaptcha";

export default function FormContact() {
    const { t } = useTranslation();
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const recaptchaRef = React.createRef();
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [isSuccessfull, setIsSuccessfull] = useState(false);
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        telephone: '',
        contact: ''
    });
    const [errorMessages, setErrorMessages] = useState({
        name: '',
        email: '',
        telephone: '',
        contact: '',
    });

    const onReCAPTCHAChange = (token) => {
        if (token) {
            setIsCaptchaValid(true);
        } else {
            setIsCaptchaValid(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        const regexPatterns = {
            name: /^[a-zA-ZáéíóúÁÉÍÓÚ\s]+$/,
            email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            telephone: /^[0-9]{7,15}$/,
            contact: /^[\w\s]+$/,
        };
        let isValid = true;
        let newErrorMessages = {};

        for (const [key, value] of Object.entries(formState)) {
            if (!regexPatterns[key].test(value)) {
                isValid = false;
                newErrorMessages[key] = `Invalid ${key}`;
            } else {
                newErrorMessages[key] = '';
            }
        }

        if (!isValid) {
            setErrorMessages(newErrorMessages);
            setErrorMessage(t('contact.errorData'));
            return;
        }

        const recaptchaValue = recaptchaRef.current.getValue();
        if (!recaptchaValue) {
            setErrorMessage(t('contact.errorCaptcha'));
            return;
        }

        recaptchaRef.current.reset();

        // Refautomex MailJS
        emailjs.sendForm('service_8auv5hr', 'template_9f13dbf', e.target, 'CN4xn1pjy830ZUWML')
        .then((result) => {
        setSuccessMessage(t('contact.sent'));
            setIsCaptchaValid(false);
            setIsSuccessfull(true);
        }, (error) => {
            setErrorMessage(t('contact.errorContact'));
        });
    };

    return (
        <>
            <div className="h-[1000px] relative">
                <img src={`${multimediaSrc}services.jpg`} className="w-full h-full object-cover" alt="Contacto" />
                <div className="absolute bg-black opacity-60 dark:opacity-70 top-0 left-0 w-full h-full flex flex-col justify-center items-center pt-24">
                    <div className='bg-slate-800 dark:bg-stone-900 opacity-70 dark:opacity-80 md:rounded-xl m-6 w-full md:w-[700px] pt-5 p-4 text-white'>
                        <div className='flex flex-col items-start justify-end lg:items-center px-6 lg:justify-center'>
                            <h1 className='text-3xl text-left text-slate-50'>{t('contact.title')}</h1>
                            <p className='text-lg lg:text-center text-zinc-200'>{t('contact.subtitle')}</p>
                        </div>
                        <div role="alert" className="mt-4 text-xl bg-zinc-200 shadow-md opacity-90 p-2 rounded-md w-full">
                            {errorMessage && <p className="text-red-800 text-center">{errorMessage}</p>}
                            {successMessage && <p className="text-green-800 text-center">{successMessage}</p>}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 z-10">
                            <div className="space-y-8 max-w-3xl mx-auto">
                                <div className="pb-6 ">
                                    <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                        <div className="sm:col-span-full">
                                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-100">
                                                {t('contact.name')}
                                            </label>
                                            <div className="mt-2">
                                                <input type="text" name="name" id="name" value={formState.name ?? ""} onChange={handleInputChange} disabled={isSuccessfull}
                                                    className={`
                                                    ${errorMessages.name ? "bg-red-200" : ""}
                                                    ${isSuccessfull ? "bg-stone-400 opacity-70" : ""}
                                                    block w-full rounded-md border-0 py-2 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6
                                                    `}
                                                />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2 sm:col-start-1">
                                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-100">
                                                {t('contact.email')}
                                            </label>
                                            <div className="mt-2">
                                                <input type="email" name="email" id="email" value={formState.email ?? ""} onChange={handleInputChange} disabled={isSuccessfull}
                                                    className={`
                                                    ${errorMessages.email ? "bg-red-200" : ""} 
                                                    ${isSuccessfull ? "bg-stone-400 opacity-70" : ""}
                                                    block w-full rounded-md border-0 py-2 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6
                                                    `}
                                                />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label htmlFor="telephone" className="block text-sm font-medium leading-6 text-gray-100">
                                                {t('contact.phone')}
                                            </label>
                                            <div className="mt-2">
                                                <input type="tel" name="telephone" id="telephone" value={formState.telephone ?? ""} onChange={handleInputChange} disabled={isSuccessfull}
                                                    className={`
                                                    ${errorMessages.telephone ? "bg-red-200" : ""}
                                                    ${isSuccessfull ? "bg-stone-400 opacity-70" : ""}
                                                    block w-full rounded-md border-0 py-2 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6
                                                    `}
                                                />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label htmlFor="contact" className="block text-sm font-medium leading-6 text-gray-100">
                                                {t('contact.contact')}
                                            </label>
                                            <div className="mt-2">
                                                <select id="contact" name="contact" value={formState.contact ?? ""} onChange={handleInputChange} disabled={isSuccessfull}
                                                    className={`
                                                    ${errorMessages.contact ? "bg-red-200" : ""}
                                                    ${isSuccessfull ? "bg-stone-400" : ""}
                                                    block w-full rounded-md border-0 py-2 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6
                                                    `}
                                                >
                                                    <option defaultValue='0' disabled>Selecciona...</option>
                                                    <option>WhatsApp</option>
                                                    <option>Email</option>
                                                    <option>Llamada | Call</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {!isSuccessfull ? (
                                <div className="mt-3 md:flex md:items-center md:justify-between mx-auto">
                                    <ReCAPTCHA
                                        ref={recaptchaRef}
                                        sitekey="6Lf6jHcgAAAAALChHtUKBVxS23pYaFAo9HNJG1qF"
                                        onChange={onReCAPTCHAChange}
                                    />
                                    <button
                                        type="submit"
                                        className={!isCaptchaValid ? 'bg-gradient-to-bl hover:bg-gradient-to-tr bg-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out cursor-not-allowed font-bold' : 'bg-gradient-to-bl hover:bg-gradient-to-tr from-amber-500 via-yellow-400 to-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer font-bold'}
                                        disabled={!isCaptchaValid}
                                    >
                                        <span className='flex px-1 justify-center items-center'>
                                            <AiOutlineSend className="inline-block text-xl md:text-2xl mx-1.5 p-0.5 rounded-md bg-slate-50 opacity-50 shadow" />
                                            {t('contact.btnCaption')}
                                        </span>
                                    </button>
                                </div>
                                ) : null}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}