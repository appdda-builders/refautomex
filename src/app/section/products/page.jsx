import Products from "./products";

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const lang = (params && params.lang) || "es";
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
