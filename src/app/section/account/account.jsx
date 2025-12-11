"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect } from "react";
import BackgroundStars from "@/app/components/principal/account/background-stars";
import Login from "@/app/components/principal/account/log-in";
import SignUp from "@/app/components/principal/account/sign-up";
import Recovery from "@/app/components/principal/account/recovery";
import Spinner from "@/app/components/principal/spinner";
import { AuthContext } from "@/app/lib/auth-tracker";

export default function Account() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const load = searchParams.get("load");
    const lang = searchParams.get("lang") || "es";
    const { isAuthenticated, authStatusChecked } = useContext(AuthContext);

    useEffect(() => {
        if (authStatusChecked && isAuthenticated) {
            router.replace(`/section/refautomex?lang=${lang}`);
        }
    }, [authStatusChecked, isAuthenticated, lang, router]);

    if (!authStatusChecked) return <Spinner />;

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
