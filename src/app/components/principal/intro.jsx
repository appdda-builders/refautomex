'use client';
import { RiOilFill } from "react-icons/ri";
import { GiCarWheel } from 'react-icons/gi';
import { PiPlugsConnectedFill } from "react-icons/pi";
import { FaCarCrash } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation'

export default function Intro() {
    const { t } = useTranslation();
    const features = [
        {
            name: `${t('index.intro.section-1')}`,
            description: `${t('index.intro.description-1')}`,
            icon: RiOilFill,
        },
        {
            name: `${t('index.intro.section-2')}`,
            description:`${t('index.intro.description-2')}`,
            icon: GiCarWheel,
        },
        {
            name: `${t('index.intro.section-3')}`,
            description:`${t('index.intro.description-3')}`,
            icon: PiPlugsConnectedFill,
        },
        {
            name: `${t('index.intro.section-4')}`,
            description:`${t('index.intro.description-4')}`,
            icon: FaCarCrash,
        },
    ]

    return (
        <div className="bg-gradient-to-b from-white via-slate-50 to-amber-100 dark:from-black dark:via-stone-950 dark:to-indigo-950 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-5xl lg:text-center">
                    <h2 className="text-lg font-bold leading-10 text-slate-500 dark:text-slate-300">{t('index.intro.subtitle')}</h2>
                    <p className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight gradient-text">
                    {t('index.intro.title')}
                    </p>
                    <p className="mt-6 text-lg leading-8 text-slate-700 dark:text-stone-300 italic">
                    {t('index.intro.leyend')}
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                        {features.map((feature) => (
                        <div key={feature.name} className="relative pl-16">
                            <dt className="text-xl font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
                            <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 hover:rounded-full hover:animate-pulse cursor-pointer">
                                <feature.icon className="h-8 w-8 text-white" aria-hidden="true" />
                            </div>
                            {feature.name}
                            </dt>
                            <dd className="mt-2 text-base leading-7 text-gray-700 dark:text-stone-300">{feature.description}</dd>
                        </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    )
}
