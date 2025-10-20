'use client';
import BackgroundStars from "@/app/components/principal/account/background-stars";
import Login from "@/app/components/principal/account/log-in";
import SignUp from "@/app/components/principal/account/sign-up";
import Recovery from "@/app/components/principal/account/recovery";
import { useRouter } from "next/navigation";
import MetaHead from "@/app/components/meta-head";

export default function Account() {
    const router = useRouter();
    let load = router.query.load;
    let component;

    switch (load) {
        case 'login':
            component = <Login />;
            break;
        case 'sign-up':
            component = <SignUp />;
            break;
        case 'recovery':
            component = <Recovery />;
            break;
        default:
            component = <Login />;
            break;
    }

    return (
        <section className="relative">
            <MetaHead title="Account" />
            <BackgroundStars>
                {component}
            </BackgroundStars>
        </section>
    );
}
