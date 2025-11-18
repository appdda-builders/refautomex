import About from "./about";

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const lang = (params && params.lang) || "es";
    return {
        title: lang === "en" ? "Refautomex | About" : "Refautomex | Nosotros",
        description:
        lang === "en"
            ? "Learn more about Refautomex"
            : "Conoce más sobre Refautomex",
    };
}

export default function AboutPage() {
    return <About />;
}
