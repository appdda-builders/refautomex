import Privacy from './privacy';

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const lang = (params && params.lang) || 'es';
    return {
        title: lang === 'en' ? 'Privacy Notice' : 'Aviso de Privacidad',
        description:
        lang === 'en'
            ? 'Legal privacy terms for Refautomex users.'
            : 'Términos legales de privacidad para los usuarios de Refautomex.',
        robots: 'index,follow',
    };
}

export default function PrivacyPage() {
    return <Privacy />;
}
