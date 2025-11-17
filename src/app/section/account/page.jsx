import Account from "./account";

export function generateMetadata({ searchParams }) {
    const lang = searchParams.lang || "es";
    return {
        title: lang === "en" ? "Refautomex | Account" : "Refautomex | Cuenta",
        description:
        lang === "en"
            ? "Account Refautomex"
            : "Cuenta Refautomex",
    };
}

export default function AccountPage() {
    return <Account />;
}