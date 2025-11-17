import About from "./about";

export function generateMetadata({ searchParams }) {
    const lang = searchParams.lang || "es";
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
