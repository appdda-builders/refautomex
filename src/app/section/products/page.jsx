import Products from "./products";

export function generateMetadata({ searchParams }) {
    const lang = searchParams.lang || "es";
    return {
        title: lang === "en" ? "Refautomex | Products" : "Refautomex | Productos",
        description:
        lang === "en"
            ? "Products Refautomex"
            : "Productos Refautomex",
    };
}

export default function ProductsPage() {
    return <Products />;
}
