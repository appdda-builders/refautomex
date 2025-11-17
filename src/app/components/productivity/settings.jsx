'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getStorageValue, setStorageValue } from "@/app/lib/storage-values";
import { BiSolidUserCircle } from 'react-icons/bi';
import { MdEdit, MdSave } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import GooglePlacesAutocomplete from '@/app/components/principal/account/google-places';
import AWS from 'aws-sdk';
import axios from 'axios';
import { FaStarHalfAlt } from 'react-icons/fa';

const HeicToJpgUploader = dynamic(() => import('@/app/components/productivity/stock/heic-to-jpg-uploader'), { ssr: false });

export default function Settings() {
    const { t } = useTranslation();
    const multimediaSrc = process.env.NEXT_PUBLIC_S3;
    const access_key_id = process.env.NEXT_PUBLIC_ACCESS_KEY_S3;
    const secret_access_key = process.env.NEXT_PUBLIC_SECRET_KEY_S3;
    const [email, setEmail] = useState("");
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [placeId, setPlaceId] = useState('');
    const [cognitoid, setCognitoId] = useState('');
    const [rfc, setRfc] = useState('');
    const [empleado, setEmpleado] = useState('');
    const [isLoading, setLoading] = useState(false);
    const [mediaUploading, setMediaUploading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [errorMessages, setErrorMessages] = useState({
        nombre: '',
        last_name: '',
        birthday: '',
        phone: '',
        rfc: '',
        gender: '',
    });
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const cognitoUserSession = getStorageValue('CognitoUserSession');
    const username = cognitoUserSession.idToken.payload["cognito:username"];
    const userData = getStorageValue(`user_${username}`);
    const idUsuario = userData?.idusuario || 0;

    const [isEditable, setEditable] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    }

    const toggleEdit = (event) => {
        event.preventDefault();
        setEditable(!isEditable);
    };

    const handleSaveImage = () => {
        setMediaUploading(true);
        setIsSaving(true);
        if (!profile) {
            setProfileError('Selecciona una imagen antes de guardar.');
            setMediaUploading(false);
            setIsSaving(false);
            return;
        }

        AWS.config.update({
            accessKeyId: access_key_id,
            secretAccessKey: secret_access_key,
            region: 'us-east-1'
        });

        const s3 = new AWS.S3();

        let file_data = {
            Bucket: 'refautomex',
            Key: `usr/${idUsuario}.jpg`,
            Body: profile,
            ContentType: 'image/jpeg'
        };

        s3.upload(file_data, function(err, data) {
            if (err) {
                setProfileError('Error al subir imagen. Por favor intenta de nuevo.');
                console.error('Error al subir imagen:', err);
            } else {
                setProfileSuccess('Imagen guardada correctamente.');
                console.log('Imagen guardada:', data);
            }
            setMediaUploading(false);
            setIsSaving(false);
        });
    };

    const patchUserInfo = async (e) => {
        e.preventDefault();

        let newErrors = {
            nombre: '',
            last_name: '',
            birthDate: '',
            phone: '',
            gender: ''
        };

        const regexGeneral = {
            nombre: /^[a-zA-ZáéíóúÁÉÍÓÚ\s\.]+$/,
            last_name: /^[a-zA-ZáéíóúÁÉÍÓÚ\s\.]+$/,
            birthDate: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
            phone: /^[0-9]{10}$/
        };

        if (!name || !regexGeneral.nombre.test(name)) {
            newErrors.nombre = 'Por favor, ingresa un nombre válido.';
        }

        if (!lastName || !regexGeneral.last_name.test(lastName)) {
            newErrors.last_name = 'Por favor, ingresa un apellido válido.';
        }

        if (!birthDate || !regexGeneral.birthDate.test(birthDate)) {
            newErrors.birthDate = 'Por favor, ingresa una fecha de nacimiento válida.';
        }

        if (!phone || !regexGeneral.phone.test(phone)) {
            newErrors.phone = 'Por favor, ingresa un teléfono válido.';
        }

        setErrorMessages(newErrors);

        const hasErrors = Object.values(newErrors).some(error => error !== '');
        if (hasErrors) {
            return;
        }

        setLoading(true);
        setIsSaving(true);

        const user_data = {
            nombre: name || "",
            apellido: lastName || "",
            telefono: phone || "",
            rfc: rfc || "",
            f_nacimiento: birthDate || "",
            genero: gender || "",
            email: email || "",
            cognitoid: cognitoid,
            domicilio: placeId || "",
            categoria: "G",
            empleado: empleado || "",
        };

        try {
            const response = await axios.patch(`/api/dataManage?type=patchUser&id=${idUsuario}`, user_data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('Respuesta del servidor:', response.data);
            setSuccessMessage("Usuario actualizado correctamente.");
            let updatedUserData = { ...userData };
            updatedUserData.idusuario = idUsuario;
            updatedUserData.cognitoid = cognitoid;
            updatedUserData.nombre = name;
            updatedUserData.apellido = lastName;
            updatedUserData.telefono = phone;
            updatedUserData.genero = gender;
            updatedUserData.f_nacimiento = birthDate;
            updatedUserData.domicilio = placeId;
            updatedUserData.rfc = rfc;
            updatedUserData.email = email;
            updatedUserData.empleado = empleado;
            setStorageValue(`user_${username}`, updatedUserData);
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            setErrorMessage("Imposible actualizar usuario.");
        } finally {
            setLoading(false);
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (userData) {
            const formattedBirthDate = userData?.f_nacimiento 
                ? new Date(userData.f_nacimiento).toISOString().split('T')[0] 
                : '';
            setEmail(userData?.email || '');
            setName(userData?.nombre || '');
            setLastName(userData?.apellido || '');
            setPhone(userData?.telefono || '');
            setGender(userData?.genero || 'Selecciona...');
            setBirthDate(formattedBirthDate);
            setPlaceId(userData?.domicilio || '');
            setCognitoId(userData?.cognitoid || '');
            setRfc(userData?.rfc || '');
            setEmpleado(userData?.empleado || '');
        }
    }, []);

    return (
        <div className="relative">
            {isSaving && (
                <div className="fixed inset-0 flex items-center justify-center bg-black opacity-50 z-50">
                    <div className="flex flex-col items-center">
                        <FaStarHalfAlt className="animate-spin text-white text-6xl" />
                        <p className="text-white mt-4">Guardando...</p>
                    </div>
                </div>
            )}
            <div className="bg-gradient-to-b min-h-screen from-white via-gray-50 to-gray-200 dark:from-black dark:via-stone-900 dark:to-gray-600 backdrop-blur-md pt-28">
                <form className="space-y-8" onSubmit={patchUserInfo}>
                    <div className="space-y-4 max-w-3xl mx-auto px-12 divide-y dark:divide-gray-200 divide-stone-500">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="sm:col-span-full sm:col-start mt-4 flex flex-col justify-center items-center">
                                <label htmlFor="profile" className="block text-xl font-bold leading-6 text-gray-900 bg-slate-200 dark:bg-stone-600 dark:text-gray-100 p-4 rounded-full">
                                    {t('account.photo')}
                                </label>
                                <div className="mt-2 mx-auto flex flex-col justify-center items-center relative ">
                                    <div className="flex flex-col justify-end h-[340px] sm:h-[300px]">
                                        <div className="flex h-52 w-52 items-center justify-center bg-slate-50 dark:bg-stone-900 border border-slate-300 dark:border-stone-600 hover:bg-slate-100 hover:border-amber-300 dark:hover:border-amber-400 animate-out shadow-lg rounded-full overflow-hidden">
                                            {profile ? (
                                                <img
                                                    src={URL.createObjectURL(profile)}
                                                    alt="Profile preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                userData && !imageError ? (
                                                    <img 
                                                        src={`${multimediaSrc}usr/${userData.idusuario}.jpg`}
                                                        alt="profile"
                                                        className="w-full h-full object-cover"
                                                        onError={handleImageError}
                                                    />
                                                ) : (
                                                    <BiSolidUserCircle className="w-32 h-32 my-auto animate-up dark:text-zinc-100" />
                                                )
                                            )}
                                        </div>
                                        <div className="absolute top-0 -right-12 sm:right-0 sm:-left-48 w-full">
                                            {profileSuccess ? (
                                                <p className=" text-green-500 w-32 min-h-28 bg-green-50 text-center border-2 border-green-100 rounded shadow-md my-3 overflow-hidden">{profileSuccess}</p>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <div className='flex items-center'>
                                                        <div className="flex flex-row justify-center items-center bg-amber-100 p-2 m-2 rounded-full animate-out shadow-md" onClick={handleSaveImage} disabled={mediaUploading}>
                                                            <MdSave size={20} className='text-green-600'/>
                                                        </div>
                                                        <HeicToJpgUploader setProfile={setProfile} setProfileError={setProfileError} mediaUploading={mediaUploading} />
                                                    </div>
                                                    <div>
                                                        {profileError && <p className=" text-red-500 w-32 min-h-28 bg-red-50 text-center border-2 border-red-100 rounded shadow-md my-3 overflow-hidden">{profileError}</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='sm:col-span-full'>
                                <div className="flex flex-row justify-between items-center mx-auto max-w-3xl px-6 lg:px-8 bg-slate-200 dark:bg-stone-600 dark:text-gray-100 py-2 rounded-md">
                                    <p className='font-bold text-xl '>{t('account.info')}</p>
                                    <div className='w-10 h-10 flex justify-center items-center'>
                                        <button onClick={toggleEdit} className="h-10 w-10 inline-flex justify-center items-center rounded-full bg-amber-400 shadow-md text-white">
                                            <MdEdit size={20}/>
                                        </button>
                                    </div>
                                </div>
                                <div role="alert" className="mt-4 text-xl p-2 mx-4 text-center">
                                    {errorMessage && <p className="text-red-800 bg-red-50 rounded-md shadow text-center animate-up">{errorMessage}</p>}
                                    {successMessage && <p className="text-green-800 bg-green-50 rounded-md shadow text-center animate-up">{successMessage}</p>}
                                </div>
                            </div>
                            <div className="sm:col-span-3 sm:col-start">
                                <label htmlFor="name" className="block font-medium leading-6 text-gray-900 dark:text-gray-200">
                                    {t('account.name')}
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="name"
                                        name="Nombre"
                                        type="text"
                                        required
                                        placeholder={t('account.name')}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${isEditable ? 'bg-white' : 'bg-gray-100'}`}
                                        disabled={!isEditable}
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-3">
                                <label htmlFor="lastname" className="block font-medium leading-6 text-gray-900 dark:text-gray-200">
                                    {t('account.lastname')}
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="lastname"
                                        name="Apellido"
                                        type="text"
                                        required
                                        placeholder={t('account.lastname')}
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${isEditable ? 'bg-white' : 'bg-gray-100'}`}
                                        disabled={!isEditable}
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-3">
                                <label htmlFor="phone" className="block font-medium leading-6 text-gray-900 dark:text-gray-200">
                                    {t('account.phone')}
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="phone"
                                        name="Teléfono"
                                        type="text"
                                        required
                                        placeholder={t('account.phone')}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${isEditable ? 'bg-white' : 'bg-gray-100'}`}
                                        disabled={!isEditable}
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-3">
                                <label htmlFor="rfc" className="block font-medium leading-6 text-gray-900 dark:text-gray-200">
                                    RFC
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="rfc"
                                        id="rfc"
                                        required
                                        placeholder='RFC'
                                        value={rfc}
                                        onChange={(e) => setRfc(e.target.value)}
                                        className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${isEditable ? 'bg-white' : 'bg-gray-100'}`}
                                        disabled={!isEditable}
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-3">
                                <label htmlFor="birthDate" className="block font-medium leading-6 text-gray-900 dark:text-gray-200">
                                    {t('account.birthdate')}
                                </label>
                                <div className="mt-2">
                                    <input type="date" name="birthDate" id="birthDate"
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        placeholder={t('account.birthdate')}
                                        className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${isEditable ? 'bg-white' : 'bg-gray-100'}`}
                                        disabled={!isEditable}
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-3">
                                <label htmlFor="gender" className="block font-medium leading-6 text-gray-900 dark:text-gray-200">
                                    {t('account.gener')}
                                </label>
                                <div>
                                    <select
                                        name="gender"
                                        id="gender"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        placeholder={t('account.gener')}
                                        className={`block w-full rounded-md border-0 py-1.5 mt-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${isEditable ? 'bg-white' : 'bg-gray-100'}`}
                                        disabled={!isEditable}
                                    >
                                        <option id="gender_0" value="" disabled selected>{t('account.gener')}</option>
                                        <option id="gender_1" value="M">Masculino</option>
                                        <option id="gender_2" value="F">Femenino</option>
                                        <option id="gender_3" value="O">Otro</option>
                                    </select>
                                </div>
                            </div>
                            <div className="sm:col-span-full">
                                <label htmlFor="email" className="block font-medium leading-6 text-gray-900 dark:text-gray-200">
                                    {t('account.mail')}
                                </label>
                                <div className="mt-2">
                                    <input type="text"
                                        name="email"
                                        id="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder={t('account.mail')}
                                        className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${isEditable ? 'bg-white' : 'bg-gray-100'}`}
                                        disabled={!isEditable}
                                    />
                                </div>
                            </div>
                            {isEditable && (
                            <div className="sm:col-span-full">
                                <label htmlFor="placeId" className="block font-medium leading-6 text-gray-900 dark:text-gray-200">
                                    {t('account.address')}
                                </label>
                                <div className="mt-2 relative">
                                    <GooglePlacesAutocomplete
                                        placeId={placeId}
                                        setPlaceId={setPlaceId}
                                    />
                                </div>
                            </div>
                            )}
                        </div>
                        <div className='flex items-center justify-center p-2'>
                            {isSaving ? (
                                <div className="fixed inset-0 flex items-center justify-center bg-black opacity-50 z-50">
                                    <div className="flex flex-col items-center">
                                        <FaStarHalfAlt className="animate-spin text-white text-6xl" />
                                        <p className="text-white mt-4">Guardando...</p>
                                    </div>
                                </div>
                            ) : (
                                <button type="submit" className='cursor-pointer bg-gradient-to-bl hover:bg-gradient-to-tr from-amber-500 via-yellow-400 to-slate-300 shadow text-slate-900 p-3 rounded-full mt-3 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer'>
                                    {isLoading ? t('account.btnUpdating') : t('account.btnUpdate')}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
