import Mailbox from "./mailbox";

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const lang = (params && params.lang) || "es";
    return {
        title: lang === "en" ? "Refautomex | Mailbox" : "Refautomex | Buzón",
        description:
        lang === "en"
            ? "Mailbox Refautomex"
            : "Buzón Refautomex",
    };
}

export default function MailboxPage() {
    return <Mailbox />;
}
