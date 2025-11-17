'use client';
import MetaHead from "@/app/components/meta-head";
import FormContact from "@/app/components/principal/contact/form-contact";
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation';

export default function Contact({ includeMeta = true, sectionId = 'contact' }) {
    const { t } = useTranslation();
    return(
        <section id={sectionId} className="scroll-mt-32">
            {includeMeta && <MetaHead title={t('navbar.contact')}/>}
            <FormContact />
        </section>
    )
}
