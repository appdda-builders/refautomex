import Faqs from "./faqs";

export function generateMetadata({ searchParams }) {
    const lang = searchParams.lang || "es";
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