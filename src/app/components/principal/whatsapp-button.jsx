import React, { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { IoMdCloseCircle } from "react-icons/io";
import { useTranslation } from 'react-i18next';
import '@/app/translations/i18next-translation';

export default function WhatsAppButton (){
  const { t } = useTranslation();
  const [showLabel, setShowLabel] = useState(true);
  const router = useRouter();
  const pathPage = router.pathname;

  const handleWhatsAppClick = () => {
    const message = t('index.video.whatsapp');
    const phoneNumber = "5639557232";
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappURL, '_blank');
  };

  const handleCloseLabel = () => {
    setShowLabel(false);
  };

  if (pathPage === '/calidad' || pathPage === '/productivity') {
    return null;
  }

  return (
    <div className="z-30">
      {showLabel && (
        <>
          <div className="fixed bottom-4 md:bottom-[11vh] left-22 bg-green-100 text-white text-sm p-0.5 border-x-4 shadow-md border-green-700 justify-between motion-safe:animate-bounce">
            <span className='my-auto text-green-700 font-bold xl:text-md 2xl:text-xl'>{t('index.video.contact')}</span>
            <button
              onClick={handleCloseLabel}
              className="bg-red-600 rounded-full absolute -left-2.5 -top-2.5 animate-out"
            >
              <IoMdCloseCircle className='text-slate-50' size={15} />
            </button>

          </div>
        </>
      )}

      <button
        onClick={handleWhatsAppClick}
        className="fixed -left-0.5 bottom-0 md:bottom-[9vh] bg-gradient-to-b from-green-100 via-[#41e179] to-[#23c75c] hover:bg-gradient-to-br font-semibold p-2 m-4 rounded-full shadow-2xl border-slate-600 border-b animate-out"
      >
        <FaWhatsapp className="text-white h-9 w-9 2xl:h-12 2xl:w-12" />
      </button>
    </div>
  );
};


