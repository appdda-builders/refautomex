import Account from "./account";

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const lang = (params && params.lang) || "es";
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
