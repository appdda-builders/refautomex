'use client';
import { createContext, useContext } from "react";
import useTimeZone from "@/app/lib/use-time-zone";

const TimeZoneContext = createContext("America/Mexico_City");

export const TimeZoneProvider = ({ children }) => {
    const timeZone = useTimeZone(); // Detecta la zona horaria del usuario

    return (
        <TimeZoneContext.Provider value={timeZone}>
            {children}
        </TimeZoneContext.Provider>
    );
};

// Hook para acceder a la zona horaria en cualquier parte de la app
export const useTimeZoneContext = () => useContext(TimeZoneContext);
