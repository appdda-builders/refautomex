import React, { useEffect, useState } from 'react';

export default function RefautomexLogo({classAttr}) {
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const [logo, setLogo] = useState(`${multimediaSrc}refautomex.svg`);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
            setLogo(darkModeEnabled ? `${multimediaSrc}refautomex_bn.svg` : `${multimediaSrc}refautomex.svg`);
        }, 50);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <img loading="lazy" className={classAttr} src={logo} alt="Refautomex" />
    );
}