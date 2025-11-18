import Shopping from "./shopping";

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const lang = (params && params.lang) || "es";
    return {
        title: lang === "en" ? "Refautomex | Shopping" : "Refautomex | Carrito",
        description:
        lang === "en"
            ? "Shopping Refautomex"
            : "Carrito Refautomex",
    };
}

export default function ShoppingPage() {
    return <Shopping />;
}
