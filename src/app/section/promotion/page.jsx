import Promotion from "./promotion";

export function generateMetadata({ searchParams }) {
    const lang = searchParams.lang || "es";
    return {
        title: lang === "en" ? "Refautomex | Promotion" : "Refautomex | Promociones",
        description:
        lang === "en"
            ? "Promotion Refautomex"
            : "Promociones Refautomex",
    };
}

export default function PromotionPage() {
    return <Promotion />;
}
