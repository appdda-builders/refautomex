import Contact from "./contact";

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const lang = (params && params.lang) || "es";
    return {
        title: lang === "en" ? "Refautomex | Contact" : "Refautomex | Contacto",
        description:
        lang === "en"
            ? "Contact Refautomex"
            : "Contacto Refautomex",
    };
}

export default function ContactPage() {
    return <Contact />;
}
