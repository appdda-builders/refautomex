import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Title from '../title';
import { FaUsersViewfinder } from 'react-icons/fa6';
import { BiSolidUserCircle } from "react-icons/bi";
import { GrStatusGoodSmall } from "react-icons/gr";
import axios from 'axios';
import { buildApiUrl } from '@/app/lib/refautomex-api';

export default function Personal() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [searchEmail, setSearchEmail] = useState('');
    const [imgErrors, setImgErrors] = useState({});
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(buildApiUrl('/getAllUsers'));
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    const handleSearchChange = (event) => {
        setSearchEmail(event.target.value);
    };

    const handleImageError = (userId) => {
        setImgErrors((prevErrors) => ({
            ...prevErrors,
            [userId]: true
        }));
    };

    const handleImageLoad = (userId) => {
        setImgErrors((prevErrors) => ({
            ...prevErrors,
            [userId]: false
        }));
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchEmail.toLowerCase())
    );

    const employees = filteredUsers.filter(user => user.empleado === 1);
    const nonEmployees = filteredUsers.filter(user => user.empleado !== 1);

    return (
        <div className="bg-gradient-to-b min-h-screen from-white via-gray-100 to-gray-400 dark:from-black dark:via-slate-800 dark:to-stone-700 backdrop-blur-md pt-28">
            <Title
                title='Personal'
                icon={FaUsersViewfinder}
                back='Volver al panel'
                path='/productivity'
            />
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto mt-4 max-w-5xl">
                    <input
                        type="text"
                        placeholder="Buscar por correo"
                        value={searchEmail}
                        onChange={handleSearchChange}
                        className="mb-4 p-2 border border-gray-300 rounded-md w-full"
                    />
                    <h2 className="text-2xl font-bold text-slate-500 dark:text-white mb-4">Empleados Activos</h2>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-5 lg:max-w-none lg:grid-cols-3 lg:gap-y-8">
                        {employees.map((user) => (
                            <div key={user.email} className="relative p-4 shadow-md rounded-xl animate-out bg-gray-50 dark:bg-slate-600">
                                <span className="absolute flex h-5 w-5 top-0 -left-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${user.empleado === 1 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <GrStatusGoodSmall className={`relative inline-flex rounded-full h-5 w-5 ${user.empleado === 1 ? 'text-green-500' : 'text-red-500'}`}/>
                                </span>
                                <dt className="text-xl font-bold leading-7 text-slate-500 pl-16 dark:text-white">
                                    <div className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full shadow-2xl">
                                        {!imgErrors[user.idusuario] ? (
                                            <div className="flex h-9 w-9 items-center justify-center bg-slate-50 dark:bg-stone-900 border border-slate-300 dark:border-stone-600 hover:bg-slate-100 hover:border-amber-300 dark:hover:border-amber-400 animate-out shadow-lg rounded-full overflow-hidden">
                                                <img
                                                    src={`${multimediaSrc}usr/${user.idusuario}.jpg`}
                                                    onError={() => handleImageError(user.idusuario)}
                                                    onLoad={() => handleImageLoad(user.idusuario)}
                                                    className="w-full h-full object-cover bg-gray-50"
                                                />
                                            </div>
                                        ) : (
                                            <BiSolidUserCircle className="w-8 h-8 rounded-full shadow-xl border border-indigo-100 my-auto animate-out" />
                                        )}
                                    </div>
                                    {user.nombre}
                                </dt>
                                <dd className="mt-2 pl-16 text-base leading-7 text-gray-500 dark:text-slate-300 truncate">{user.email}</dd>
                                <dd className="mt-2 pl-16 text-base leading-7 text-gray-500 dark:text-slate-300">{user.sucursal}</dd>
                            </div>
                        ))}
                    </dl>
                    <h2 className="text-2xl font-bold text-slate-500 dark:text-white mt-8 mb-4">Otros Usuarios</h2>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-5 lg:max-w-none lg:grid-cols-3 lg:gap-y-8">
                        {nonEmployees.map((user) => (
                            <div key={user.email} className="relative p-4 shadow-md rounded-xl animate-out bg-gray-50 dark:bg-slate-600">
                                <span className="absolute flex h-5 w-5 top-0 -left-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${user.empleado === 1 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <GrStatusGoodSmall className={`relative inline-flex rounded-full h-5 w-5 ${user.empleado === 1 ? 'text-green-500' : 'text-red-500'}`}/>
                                </span>
                                <dt className="text-xl font-bold leading-7 text-slate-500 pl-16 dark:text-white">
                                    <div className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full shadow-2xl">
                                        {!imgErrors[user.idusuario] ? (
                                            <div className="flex h-9 w-9 items-center justify-center bg-slate-50 dark:bg-stone-900 border border-slate-300 dark:border-stone-600 hover:bg-slate-100 hover:border-amber-300 dark:hover:border-amber-400 animate-out shadow-lg rounded-full overflow-hidden">
                                                <img
                                                    src={`${multimediaSrc}usr/${user.idusuario}.jpg`}
                                                    onError={() => handleImageError(user.idusuario)}
                                                    onLoad={() => handleImageLoad(user.idusuario)}
                                                    className="w-full h-full object-cover bg-gray-50"
                                                />
                                            </div>
                                        ) : (
                                            <BiSolidUserCircle className="w-8 h-8 rounded-full shadow-xl border border-indigo-100 my-auto animate-out" />
                                        )}
                                    </div>
                                    {user.nombre}
                                </dt>
                                <dd className="mt-2 pl-16 text-base leading-7 text-gray-500 dark:text-slate-300 truncate">{user.email}</dd>
                                <dd className="mt-2 pl-16 text-base leading-7 text-gray-500 dark:text-slate-300">{user.sucursal}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
}
