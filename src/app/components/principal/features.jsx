'use client';
import { FaTools, FaCar, FaHandsHelping } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation'

export default function Features() {
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const { t } = useTranslation();
    const features = [
        {
            name: `${t('index.features.section-1')}`,
            description: `${t('index.features.description-1')}`,
            icon: FaCar,
        },
        {
            name: `${t('index.features.section-2')}`,
            description: `${t('index.features.description-2')}`,
            icon: FaTools,
        },
        {
            name: `${t('index.features.section-3')}`,
            description: `${t('index.features.description-3')}`,
            icon: FaHandsHelping,
        },
    ]

    return (
        <div className="overflow-hidden bg-white dark:bg-stone-950 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                    <div className="lg:pr-8 lg:pt-4">
                        <div className="lg:max-w-lg">
                        <h2 className="text-lg font-bold leading-10 text-slate-500 dark:text-slate-300">{t( 'index.features.subtitle' )}</h2>
                        <p className="mt-2 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-yellow-500">{t( 'index.features.title' )}</p>
                        <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-200 italic">
                        {t( 'index.features.description' )}
                        </p>
                        <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-gray-600 dark:text-gray-400 lg:max-w-none">
                            {features.map((feature) => (
                            <div key={feature.name} className="relative pl-9">
                                <dt className="inline font-semibold text-gray-900 dark:text-gray-100">
                                <feature.icon className="absolute left-1 top-1 h-5 w-5 text-amber-400" aria-hidden="true" />
                                {feature.name}
                                </dt>
                                <dd className="inline">{feature.description}</dd>
                            </div>
                            ))}
                        </dl>
                        </div>
                    </div>
                <img
                    src={`${multimediaSrc}place.jpg`}
                    alt="Product screenshot"
                    className="w-[40rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem] -m-0 dark:ring-gray-600"
                    width={2432}
                    height={1442}
                />
                </div>
            </div>
        </div>
    )
}
