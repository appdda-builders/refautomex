import React, { useRef } from 'react';
import heic2any from 'heic2any';
import { FaImage } from 'react-icons/fa6';

const HeicToJpgUploader = ({ setProfile, setProfileError, mediaUploading }) => {
    const fileInputRef = useRef();

    const triggerUpload = () => {
        if (mediaUploading) return;
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleProfileUpload = async (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            try {
                if (file.type === 'image/heic' || file.type === 'image/heif') {
                    const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg' });
                    const jpgFile = new File([convertedBlob], `${file.name.split('.')[0]}.jpg`, { type: 'image/jpeg' });
                    setProfile(jpgFile);
                    setProfileError('');
                } else if (file.type !== 'image/jpeg') {
                    // Ensure proper conversion for non-JPG images
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            canvas.toBlob((blob) => {
                                const jpgFile = new File([blob], `${file.name.split('.')[0]}.jpg`, { type: 'image/jpeg' });
                                setProfile(jpgFile);
                                setProfileError('');
                            }, 'image/jpeg');
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                } else {
                    setProfile(file);
                    setProfileError('');
                }
            } catch (error) {
                setProfileError('Error al convertir la imagen. Por favor intenta con otra imagen.');
            }
        } else {
            setProfileError('Por favor, selecciona una imagen.');
        }
    };
    

    return (
        <div>
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleProfileUpload}
                disabled={mediaUploading}
            />
            <div className="flex flex-row justify-center items-center bg-slate-300 p-2 m-2 rounded-full animate-out shadow-md" onClick={triggerUpload} disabled={mediaUploading}>
                <FaImage className="text-stone-600" />
            </div>
        </div>
    );
};

export default HeicToJpgUploader;
