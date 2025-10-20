'use client';
import MetaHead from "@/app/components/meta-head";
import FormContact from "@/app/components/principal/contact/form-contact";
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation';

export default function Contact() {
    const { t } = useTranslation();
    return(
        <section>
            <MetaHead title={t('navbar.contact')}/>
            <FormContact />
        </section>
    )
}