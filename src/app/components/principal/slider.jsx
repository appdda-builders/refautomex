'use client';
import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import { Autoplay, Navigation } from 'swiper/modules';

export default function App({ slides }) {
  const [slidesPerView, setSlidesPerView] = useState(2);

  useEffect(() => {
    const handleResize = () => {
      setSlidesPerView(window.innerWidth >= 1200 ? 3 : 2);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className='bg-gray-200 dark:bg-stone-700'>
      <Swiper
        slidesPerView={slidesPerView}
        spaceBetween={5}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        navigation={true}
        modules={[Autoplay, Navigation]}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} className="flex justify-center items-center">
            <div className="w-full h-full py-8 px-1 md:px-10">
              <div className="rounded-md overflow-visible w-full h-full">
                <div className='relative w-full h-full'>
                  <div className='absolute inset-0 bg-black dark:opacity-50 opacity-30 z-10 rounded-md'></div>
                  <img src={slide.url} alt={`Slide ${index}`} className="w-full h-[650px] 2xl:h-[850px] object-cover rounded-md" />
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
