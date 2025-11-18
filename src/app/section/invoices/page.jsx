import Invoices from "./invoices";

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const lang = (params && params.lang) || "es";
    return {
        title: lang === "en" ? "Refautomex | Invoices" : "Refautomex | Facturas",
        description:
        lang === "en"
            ? "Invoices Refautomex"
            : "Facturas Refautomex",
    };
}

export default function InvoicesPage() {
    return <Invoices />;
}
