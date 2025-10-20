export default function Labels({ products }) {
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;

    // Función para extraer la parte principal de la localización
    const getMainLocation = (location) => {
        if (!location) return '';
        const lastDashIndex = location.lastIndexOf('-');
        if (lastDashIndex === -1) return location;
        return location.substring(0, lastDashIndex);
    };

    // Agrupar productos por localización principal
    const groupedProducts = products.reduce((groups, product) => {
        const mainLocation = getMainLocation(product.localizacion);
        if (!groups[mainLocation]) {
            groups[mainLocation] = [];
        }
        groups[mainLocation].push(product);
        return groups;
    }, {});

    return (
        <div className="p-4">
            {Object.entries(groupedProducts).map(([mainLocation, locationProducts]) => (
                <div key={mainLocation} className="my-4 border border-dashed border-gray-800 -mx-1 p-1 rounded-lg">
                    {/* Grid que incluye tanto la localización como los productos */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Etiqueta de localización como primer elemento del grid */}
                        <div className="flex items-center justify-center p-1 border border-gray-400 rounded-lg bg-gray-100 shadow-sm print:border print:shadow-none">
                            <div className="flex flex-col w-full">
                                <div className="w-full flex items-center justify-center">
                                    <img
                                        loading="lazy"
                                        className="h-8"
                                        src={`${multimediaSrc}refautomex_n.svg`}
                                        alt="Refautomex"
                                    />
                                </div>
                                <div className="w-full flex items-center justify-center">
                                    <span className="text-7xl font-bold text-gray-800 uppercase text-center px-2">
                                        {mainLocation}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Productos de esta localización */}
                        {locationProducts.map((product, index) => (
                            <div key={`${product.refaccion}-${index}`} className="flex p-3 border border-gray-300 rounded-lg bg-white shadow-sm print:border print:shadow-none">
                                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <img
                                        src={product.imageSrc || `${multimediaSrc}productos/no-img.png`}
                                        alt={product.refaccion}
                                        className="h-full w-full object-contain object-center"
                                    />
                                </div>
                                <div className="relative ml-3 flex flex-1 flex-col">
                                    {/* Índice secuencial dentro del grupo */}
                                    <div className="absolute -right-2 -bottom-2 bg-amber-500 text-white p-1 pt-4 rounded-full text-center w-12">
                                        <span className="absolute top-2 left-1.5 text-xs text-gray-100">
                                            ÍNDICE
                                        </span>
                                        <span className="font-bold text-lg">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <div className="absolute -top-2 -right-2 ">
                                        <img
                                            loading="lazy"
                                            className="h-8"
                                            src={`${multimediaSrc}refautomex_n.svg`}
                                            alt="Refautomex"
                                        />
                                    </div>
                                    <div className="flex justify-start text-md font-normal text-gray-900 overflow-x-hidden h-[66px] w-40 overflow-y-auto">
                                        <h3 className="italic">
                                            {product.descripcion}
                                        </h3>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">{product.category}</p>
                                    <div className="flex flex-1 items-end justify-between pt-1 mr-12">
                                        <p className="text-amber-600 font-bold text-md truncate">{product.refaccion}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}