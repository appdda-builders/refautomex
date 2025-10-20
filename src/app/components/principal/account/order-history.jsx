import React, { useState, useEffect, use } from "react";
import { getStorageValue } from "@/app/lib/storage-values";
import axios from "axios";

const orders = [
  {
    id: 'WU88191111',
    date: 'January 22, 2021',
    amount: '$302.00',
    status: 'View Order',
    invoice: 'View Invoice',
    products: [
      {
        name: 'Nomad Tumbler',
        description: 'This durable double-walled insulated tumbler keeps your beverages...',
        price: '$35.00',
        status: 'Out for delivery',
        imageUrl: 'https://tailwindui.com/img/ecommerce-images/product-page-01-related-product-01.jpg' // Replace with your image path
      },
      // ... more products
    ]
    // ... more orders
  }
];

export default function OrderHistory(){
    const cognitoUserSession = getStorageValue('CognitoUserSession');
    const username = cognitoUserSession?.idToken.payload["cognito:username"];
    const userData = getStorageValue(`user_${username}`);
    const userId = userData?.idusuario;
    const [sales, setSales] = useState([]);
    const [error, setError] = useState(null);

    const fetchData = async (id) => {
        setError(null);
        try {
            const response = await axios.get(`/api/dataManage?type=getUserHistory&id=${id}`);
            if (Array.isArray(response.data)) {
                setSales(response.data);
                //console.log(response.data);
            } else {
                setSales([]);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            setError(error.message);
            setSales([]);
        }
    };

    useEffect(() => {
        fetchData(userId);
    }, [userId]);

    return (
        <div className='dark:bg-black'>
            <div className="container mx-auto bg-gradient-to-tl from-stone-100 via-slate-200 to-slate-300 dark:from-slate-700 dark:via-slate-800 dark:to-slate-950 px-6 md:px-28 py-24 sm:py-40">
                <h1 className="text-3xl pt-10 font-semibold mb-4 text-center sm:text-left dark:text-stone-100">Order history</h1>
                <p className="mb-8 text-center sm:text-left dark:text-stone-50">Check the status of recent orders, manage returns, and download invoices.</p>
                {sales.map((order) => (
                    <div key={order.id} className="mb-6">
                    <div className="flex flex-col lg:flex-row justify-between items-center bg-gray-100 dark:bg-slate-950 p-4 lg:p-8 my-2 rounded-2xl border border-zinc-300">
                        <div className="flex-1 mb-4 lg:mb-0">
                        <div className="text-gray-600 dark:text-stone-50">Order number</div>
                        <div className='dark:text-stone-100'>{order.folio}</div>
                        </div>
                        <div className="flex-1 mb-4 lg:mb-0">
                            <div className="text-gray-600 dark:text-stone-50">Date placed</div>
                            <div className='dark:text-stone-100'>{order.fecha_venta}</div>
                        </div>
                        <div className="flex-1 mb-4 lg:mb-0">
                            <div className="text-gray-600 dark:text-stone-50">Total amount</div>
                            <div className='dark:text-stone-100'>{order.total_venta}</div>
                        </div>
                        <div className="flex space-x-2">
                            <div className="gradient-text-title flex justify-center items-center mx-2">{order.status == 'A' ? 'Pendiente' : 'Entregada'}</div>
                            <button className="bg-gradient-to-bl hover:bg-gradient-to-tr from-amber-500 via-yellow-400 to-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer">Ver compra</button>
                        </div>
                    </div>
                    
                    {/*sales.products.map((product) => (
                        <div key={product.name} className="border-t border-b py-4 mt-6 flex flex-col sm:flex-row justify-between items-center">
                            <div className="overflow-hidden rounded-xl shadow-md animate-out bg-gray-50">
                                <img className="h-24 w-24 object-cover object-center group-hover:opacity-75" src={product.imageUrl} alt={product.name} />
                            </div>
                            <div className="flex-1 px-4">
                                <p className="text-lg font-semibold dark:text-gray-50">{product.name}</p>
                                <p className="text-gray-600 dark:text-gray-300">{product.description}</p>
                                <div className="flex mt-2">
                                    <button className="text-yellow-500 hover:underline">View Product</button>
                                    <button className="text-yellow-500 hover:underline ml-4">Buy Again</button>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg dark:text-gray-50">{product.price}</div>
                                <div className="text-sm shadow text-gray-500 dark:text-gray-200 p-1.5 bg-gray-100 dark:bg-slate-500 rounded-full">{product.status}</div>
                            </div>
                        </div>
                    ))*/}
                    </div>
                ))}
            </div>
        </div>
    );
};
