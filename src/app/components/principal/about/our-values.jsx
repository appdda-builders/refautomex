import { FaMap } from 'react-icons/fa'
import { IoTelescope } from "react-icons/io5";
import { GiSkills } from "react-icons/gi";
import Title from '../title';
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation'

export default function OurValues() {
    const { t } = useTranslation();
    const values = [
        {
            id: 1,
            title: `${t('about.values.section-1')}`,
            icon: FaMap,
            description: `${t('about.values.description-1')}`,
        },
        {
            id: 2,
            title: `${t('about.values.section-2')}`,
            icon: IoTelescope,
            description: `${t('about.values.description-2')}`,
        },
        {
            id: 3,
            title: `${t('about.values.section-3')}`,
            icon: GiSkills,
            description: `${t('about.values.description-3')}`,
        },
    ]

    return(
        <div className="bg-white dark:bg-black h-full min-h-screen flex justify-center items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Title title={t('about.values.subtitle')} desc={t('about.values.title')} leyend={t('about.values.leyend')} />
                <div className="mt-10">
                    <dl className="space-y-10 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:gap-y-10">
                        {values.map((value) => (
                        <div key={value.id}>
                            <dt>
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-400 hover:rounded-full hover:animate-pulse cursor-pointer">
                                    <value.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                </div>
                                <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-stone-300">{value.title}</p>
                            </dt>
                            <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-200">
                                {value.description}
                            </dd>
                        </div>
                        ))}

                    </dl>
                </div>
            </div>
        </div>
    )
}