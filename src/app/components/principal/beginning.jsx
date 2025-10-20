'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation';
import { IoMdCloseCircle } from "react-icons/io";
import { FaRegLightbulb } from "react-icons/fa6";
import PopTwoSections from '@/app/components/principal/pop-two-sections';

export default function Beginning() {
    const { t } = useTranslation();
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const imagesData = [
        {   id: 1, 
            src: `${multimediaSrc}services.jpg`,
            title: `${t('index.beginning.subtitle-1')}`, 
            caption: `${t('index.beginning.btnCaption')}`,
            tracking: 'index.beginning.trackingOne',
            titlePop: 'index.beginning.titlePopOne',
            sectionOne: 'index.beginning.sectionAOne',
            sectionTwo: 'index.beginning.sectionATwo',

        },
        {   id: 2,
            src: `${multimediaSrc}attention.jpg`,
            title: `${t('index.beginning.subtitle-2')}`, 
            caption: `${t('index.beginning.btnCaption')}`, 
            tracking: 'index.beginning.trackingTwo',
            titlePop: 'index.beginning.titlePopTwo',
            sectionOne: 'index.beginning.sectionBOne',
            sectionTwo: 'index.beginning.sectionBTwo',
        },
    ];

    const handleOpenModal = (image) => {
        setSelectedImage(image);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedImage(null);
    };

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [showModal]);

    return (
        <section className='flex flex-col justify-center items-center bg-stone-300 dark:bg-stone-800 w-full py-1 sm:pt-16 '>
            {imagesData.map((image) => (
                <div 
                    key={image.id} 
                    className="sm:px-16 sm:py-5 my-5 w-full xl:w-[1300px]"
                >
                <div className="relative w-full overflow-hidden h-[325px] mx-auto sm:rounded-3xl shadow-md">
                    <img src={image.src} alt={image.title} className="w-full h-[500px] object-cover z-0" />
                    <div className='top-0 left-0 absolute w-full h-full py-5 md:py-10 z-10 flex items-end justify-start bg-cover bg-stone-950 opacity-40 dark:opacity-60'>
                        <div className='absolute w-full -py-1  px-10 md:px-16'>
                            <div className='flex sm:flex-row flex-col justify-between items-center'>
                                <h1 className="lg:text-5xl text-center sm:text-left text-4xl italic text-slate-100">{image.title}</h1>
                                <button className="bg-gradient-to-bl hover:bg-gradient-to-tr from-amber-500 via-yellow-400 to-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer font-bold" onClick={() => handleOpenModal(image)}>
                                        <span className='flex px-1 justify-center items-center'>
                                            <FaRegLightbulb className="inline-block text-xl md:text-2xl mx-1.5 p-0.5 rounded-md bg-slate-50 opacity-50 shadow" />
                                            {image.caption}
                                        </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {showModal && selectedImage && (
                <div className="fixed z-40 inset-0 overflow-y-auto bg-stone-700 opacity-80">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className='relative max-w-7xl sm:px-10 lg:px-20 bg-gradient-to-bl from-stone-100 via-slate-200 to-slate-300 dark:from-slate-700 dark:via-slate-800 dark:to-slate-950 p-3 sm:rounded-xl shadow-xl py-12'>
                            <div className='absolute -top-5 right-1/2 translate-x-1/2 shadow bg-white dark:bg-black rounded-full p-3 dark:shadow-slate-300/40 cursor-pointer animate-out'>
                                <FaRegLightbulb className='h-9 w-9 text-amber-500 dark:text-amber-400 hover:opacity-80'/>
                            </div>
                            <button onClick={handleCloseModal} className="absolute top-2 right-2 text-red-500 dark:text-red-400 text-xl z-10">
                                <IoMdCloseCircle className='h-7 w-7 animate-out' />
                            </button>
                            <div className="relative overflow-y-auto h-[450px] sm:h-[500px] ">
                                <PopTwoSections
                                    tracking={selectedImage.tracking}
                                    title={selectedImage.titlePop}
                                    sectionOne={selectedImage.sectionOne}
                                    sectionTwo={selectedImage.sectionTwo}
                                    imageSrc={selectedImage.src}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
            ))}
        </section>
    );
}
