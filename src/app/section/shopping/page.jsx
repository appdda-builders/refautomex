import Shopping from "./shopping";

export function generateMetadata({ searchParams }) {
    const lang = searchParams.lang || "es";
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