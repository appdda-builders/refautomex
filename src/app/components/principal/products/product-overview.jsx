import React, { useState, useEffect } from 'react';

export default function ProductOverview ({prodOverview}) {
  const multimediaSrc = process.env.NEXT_PUBLIC_S3;
  const [selectedImage, setSelectedImage] = useState(prodOverview.images && prodOverview.images.length > 0 ? `${multimediaSrc}${prodOverview.images[0]}` : `${multimediaSrc}productos/no-img.png`);

  useEffect(() => {
    setSelectedImage(prodOverview.images && prodOverview.images.length > 0 ? `${multimediaSrc}${prodOverview.images[0]}` : `${multimediaSrc}productos/no-img.png`);
  }, [prodOverview]);

  return (
    <div className=''>
      <div className="container mx-auto px-6 py-3">
        <div className="flex flex-col xl:flex-row">
          <div className="flex-1 flex flex-col items-center xl:items-start">
            <div className="overflow-hidden rounded-3xl shadow-xl bg-gray-200 h-[250px] w-[250px] sm:h-[400px] sm:w-[400px] xl:w-[455px] xl:h-[455px]">
                <img
                    src={selectedImage}
                    className="h-full w-full object-cover object-center"
                />
            </div>
            <div className="flex justify-center items-center my-8 mx-auto">
              {prodOverview.images && prodOverview.images.map((image, index) => (
                <img
                  key={index}
                  src={`${multimediaSrc}${image}`}
                  className={`w-16 h-16 object-cover cursor-pointer rounded-xl mr-2 ${selectedImage === `${multimediaSrc}${image}` ? 'border-2 border-amber-400' : 'border border-stone-300'}`}
                  onClick={() => setSelectedImage(`${multimediaSrc}${image}`)} // Actualizar la imagen seleccionada al hacer clic
                />
              ))}
            </div>
          </div>

          <div className="flex-1 px-2 lg:px-12 my-auto">
            <div className='my-4'>
              <div className='text-[rgb(var(--color-text))]'>
                <span className="lg:text-3xl text-xl font-bold mt-4 text-[rgb(var(--color-text))] md:mt-0 max-w-[90%]">{prodOverview.descripcion}</span>
              </div>
            </div>
            <div className="my-4">
              <div className='text-[rgb(var(--color-text))]'>
                <span className='italic font-serif'>Categoría : </span>
                <span className="text-base px-2 uppercase">{prodOverview.grupo}</span>
              </div>
            </div>
            <div className="my-4">
              <div className='text-[rgb(var(--color-text))] my-2'>
                <h2 className="lg:text-3xl text-xl font-bold mt-4 text-[rgb(var(--color-text))] md:mt-0">$ {Math.ceil(Number(prodOverview.precio)).toFixed(2)} MXN</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
