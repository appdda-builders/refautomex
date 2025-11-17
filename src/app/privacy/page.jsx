import Privacy from './privacy';

export function generateMetadata({ searchParams }) {
    const lang = searchParams.lang || 'es';
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
