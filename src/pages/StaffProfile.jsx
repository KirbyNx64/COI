import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { uploadProfilePhoto } from '../services/authService';
import { compressImage } from '../utils/imageUtils';
import ProfileHeader from '../components/Profile/ProfileHeader';
import ProfileInfoSection, { ProfileInfoItem } from '../components/Profile/ProfileInfoSection';
import './StaffProfile.css';

const StaffProfile = ({ userData }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    if (!userData) {
        return (
            <div className="staff-profile-loading">
                <div className="loading-spinner"></div>
                <p>Cargando perfil...</p>
            </div>
        );
    }

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setUploadError('Por favor, selecciona una imagen válida (JPG, PNG o WEBP)');
            return;
        }

        // Validate file size (5MB max before compression)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setUploadError('La imagen debe ser menor a 5MB');
            return;
        }

        setIsUploading(true);
        setUploadError('');

        const user = auth.currentUser;
        if (!user) {
            setUploadError('Debes estar autenticado para subir una foto');
            setIsUploading(false);
            return;
        }

        try {
            // Compress the image
            const compressedBlob = await compressImage(file);

            // Convert compressed blob to file
            const compressedFile = new File([compressedBlob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
            });

            const { photoURL, error } = await uploadProfilePhoto(user.uid, compressedFile, 'staff');

            if (error) {
                console.error('Upload error:', error);
                setUploadError('Error al subir la foto. Por favor intenta de nuevo.');
            } else {
                // Photo uploaded successfully
                window.location.reload();
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            setUploadError('Ocurrió un error inesperado al subir la foto.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="staff-profile-container">
            <div className="staff-profile-header-section">
                <ProfileHeader
                    userData={userData}
                    handlePhotoUpload={handlePhotoUpload}
                    isUploading={isUploading}
                />
            </div>

            {uploadError && <div className="profile-error-message">{uploadError}</div>}

            <div className="staff-profile-sections">
                <ProfileInfoSection
                    title="Información Personal"
                    icon={
                        <svg className="staff-profile-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    }
                >
                    <ProfileInfoItem label="Nombre Completo" value={`${userData.nombres} ${userData.apellidos}`} />
                    <ProfileInfoItem label="Email de Acceso" value={userData.email} />
                    <ProfileInfoItem label="Rol en el Sistema" value={userData.role === 'admin' ? 'Administrador' : 'Médico'} />
                </ProfileInfoSection>

                <ProfileInfoSection
                    title="Detalles de Cuenta"
                    icon={
                        <svg className="staff-profile-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    }
                >
                    <ProfileInfoItem label="UID de Usuario" value={userData.uid} />
                    <ProfileInfoItem label="Estado de Cuenta" value="Activo" />
                </ProfileInfoSection>
            </div>
        </div>
    );
};

export default StaffProfile;
