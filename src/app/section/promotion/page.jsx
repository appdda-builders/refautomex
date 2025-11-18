import Promotion from "./promotion";

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const lang = (params && params.lang) || "es";
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
