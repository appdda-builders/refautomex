'use client';
import { useState, useEffect } from "react";

const useTimeZone = () => {
    const [timeZone, setTimeZone] = useState("America/Mexico_City"); // Default a CDMX

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setTimeZone(userTimeZone);
        }
    }, []);

    return timeZone;
};

export default useTimeZone;
