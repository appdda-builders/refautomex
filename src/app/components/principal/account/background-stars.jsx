import React, { useState, useEffect } from 'react';
import { FaStar } from "react-icons/fa";
import SignUp from '@/app/components/principal/account/sign-up';

export default function BackgroundStars({ children }) {
    const [stars, setStars] = useState([]);

    useEffect(() => {
        const newStars = Array.from({ length: 75 }).map((_, index) => ({
            id: index,
            style: {
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 60 + 40}s`,
                animationDelay: `${Math.random() * 20}s`
            }
        }));
        setStars(newStars);
    }, []);

    const isSignUp = children.type === SignUp;

    return (
      <div>
        <div className='falling-stars pt-28 pb-5 relative w-full min-h-screen h-auto bg-gradient-to-b overflow-hidden from-[rgb(var(--color-galaxy))]/50 via-[rgb(var(--color-card))] to-[rgb(var(--color-bg))]'>
            {stars.map(star => (
                <FaStar key={star.id} className="star absolute text-amber-400 w-5 h-5" style={star.style} />
            ))}
            <div
                className="hidden absolute top-0 sm:right-1/2 sm:-z-10 sm:mr-10 sm:block sm:transform-gpu sm:blur-3xl"
                aria-hidden="true"
            >
                <div
                    className="aspect-[1097/845] w-[50rem] bg-gradient-to-tr"
                    style={{
                        clipPath:
                            'polygon(90% 60%, 100% 61%, 100% 30%, 85.5% 0.1%, 80.7% 2%, 60.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                    }}
                />
            </div>

            <div
                className="absolute -bottom-10 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl"
                aria-hidden="true"
            >
                <div
                    className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr"
                    style={{
                        clipPath:
                            'polygon(60.1% 80.1%, 100% 61.6%, 97.5% 60.9%, 85.5% 0.1%, 80.7% 2%, 60.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                    }}
                />
            </div>

            <div
                className="absolute bottom-1/2 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl sm:top-[-28rem] sm:ml-16 sm:translate-x-0 sm:transform-gpu"
                aria-hidden="true"
            >
                <div
                    className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr"
                    style={{
                        clipPath:
                            'polygon(60.1% 30.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 60.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                    }}
                />
            </div>
            {children}
        </div>
    </div>
    );
};
