import Invoices from "./invoices";

export function generateMetadata({ searchParams }) {
    const lang = searchParams.lang || "es";
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