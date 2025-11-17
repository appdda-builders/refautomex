import Contact from "./contact";

export function generateMetadata({ searchParams }) {
    const lang = searchParams.lang || "es";
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
