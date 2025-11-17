import Mailbox from "./mailbox";

export function generateMetadata({ searchParams }) {
    const lang = searchParams.lang || "es";
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