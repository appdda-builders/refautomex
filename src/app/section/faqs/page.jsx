import Faqs from "./faqs";

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const lang = (params && params.lang) || "es";
    return {
        title: lang === "en" ? "Refautomex | Faqs" : "Refautomex | Preguntas",
        description:
        lang === "en"
            ? "Faqs Refautomex"
            : "Preguntas Refautomex",
    };
}

export default function FaqsPage() {
    return <Faqs />;
}
