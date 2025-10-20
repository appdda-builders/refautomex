import React, { useState, useEffect } from 'react';
import { MdLightMode } from 'react-icons/md';
import { FaStar } from "react-icons/fa";

export default function ShiftModeButton() {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(isDarkMode);
        document.body.classList.toggle('dark', isDarkMode);
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        localStorage.setItem('darkMode', !darkMode);
        document.body.classList.toggle('dark');
    };

    return (
        <button
        onClick={toggleDarkMode}
        className={`
            ${!darkMode ? 'from-stone-100 via-gray-100 to-stone-300' : 'from-indigo-800 via-gray-900 to-dark'}
            bg-gradient-to-tl hover:bg-gradient-to-br hover:scale-105 cursor-pointer opacity-90 md:fixed md:-left-0.5 md:bottom-[1.5vh] font-semibold p-2 m-3 md:m-4 rounded-full shadow-2xl border-slate-600 border-b animate-out focus:outline-none transition-all duration-500 ease-in-out z-30
        `}>
            {darkMode ? <FaStar className="text-amber-400 -rotate-45 h-5 w-5 md:h-9 md:w-9 2xl:w-12 2xl:h-12" /> : <MdLightMode  className="text-yellow-500 -rotate-12 h-5 w-5 md:h-9 md:w-9 2xl:w-12 2xl:h-12"/>}
        </button>
    );
}
