'use client';
import MetaHead from '@/app/components/meta-head'
import OurScope from '@/app/components/principal/about/our-scope'
import OurTeam from '@/app/components/principal/about/our-team'
import OurValues from '@/app/components/principal/about/our-values'
import OurWork from '@/app/components/principal/about/our-work'
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation';

export default function About() {
    const { t } = useTranslation();
    return (
        <section>
            <MetaHead title={t('navbar.about')}/>
            <OurTeam />
            <OurValues />
            <OurWork />
            <OurScope />
        </section>
    )
}