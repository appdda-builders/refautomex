"use client";

import { useSearchParams } from "next/navigation";
import BackgroundStars from "@/app/components/principal/account/background-stars";
import Login from "@/app/components/principal/account/log-in";
import SignUp from "@/app/components/principal/account/sign-up";
import Recovery from "@/app/components/principal/account/recovery";

export default function Account() {
    const searchParams = useSearchParams();
    const load = searchParams.get("load");

    let component;
    switch (load) {
        case "login":
        component = <Login />;
        break;
        case "sign-up":
        component = <SignUp />;
        break;
        case "recovery":
        component = <Recovery />;
        break;
        default:
        component = <Login />;
    }

    return (
        <section className="relative">
        <BackgroundStars>{component}</BackgroundStars>
        </section>
    );
}
