import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { uploadProfilePhoto } from '../services/authService';
import { compressImage } from '../utils/imageUtils';
import ProfileHeader from '../components/Profile/ProfileHeader';
import ProfileInfoSection, { ProfileInfoItem } from '../components/Profile/ProfileInfoSection';
import './Profile.css';

function Profile({ userData: userDataProp }) {
    const [userData, setUserData] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
        // Use prop data if available, otherwise fallback to localStorage
        if (userDataProp) {
            setUserData(userDataProp);
        } else {
            const storedUser = localStorage.getItem('userData');
            if (storedUser) {
                setUserData(JSON.parse(storedUser));
            }
        }
    }, [userDataProp]);

    const formatDate = (dateString) => {
        if (!dateString) return 'No especificado';
        // Parse the date string directly to avoid timezone issues
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-SV', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getGeneroLabel = (genero) => {
        const labels = {
            'masculino': 'Masculino',
            'femenino': 'Femenino',
            'otro': 'Otro'
        };
        return labels[genero] || genero;
    };

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
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
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

            const { photoURL, error } = await uploadProfilePhoto(user.uid, compressedFile);

            if (error) {
                console.error('Upload error:', error);
                let errorMessage = 'Error al subir la foto. Por favor, intenta de nuevo.';

                // Check for specific Firebase Storage errors
                if (error.code === 'storage/unauthorized') {
                    errorMessage = 'No tienes permisos para subir fotos. Contacta al administrador.';
                } else if (error.code === 'storage/canceled') {
                    errorMessage = 'La subida fue cancelada.';
                } else if (error.code === 'storage/unknown') {
                    errorMessage = 'Error desconocido. Verifica tu conexión a internet.';
                }

                setUploadError(errorMessage);
                setIsUploading(false);
                return;
            }

            // Update local state with new photo URL
            setUserData(prev => ({ ...prev, photoURL }));
            setIsUploading(false);
        } catch (err) {
            console.error('Unexpected error:', err);
            setUploadError(err.message || 'Error inesperado. Por favor, intenta de nuevo.');
            setIsUploading(false);
        }
    };

    if (!userData) {
        return (
            <div className="profile-page">
                <div className="container">
                    <div className="loading-state">
                        <p>Cargando perfil...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="container">
                <ProfileHeader
                    userData={userData}
                    isUploading={isUploading}
                    handlePhotoUpload={handlePhotoUpload}
                    uploadError={uploadError}
                />

                <div className="profile-sections">
                    {/* Información Personal */}
                    <ProfileInfoSection
                        title="Información Personal"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        }
                    >
                        <ProfileInfoItem label="Nombres" value={userData.nombres} />
                        <ProfileInfoItem label="Apellidos" value={userData.apellidos} />
                        <ProfileInfoItem label="Fecha de Nacimiento" value={formatDate(userData.fechaNacimiento)} />
                        <ProfileInfoItem label="DUI" value={userData.dui} />
                        <ProfileInfoItem label="Género" value={getGeneroLabel(userData.genero)} />
                    </ProfileInfoSection>

                    {/* Información de Contacto */}
                    <ProfileInfoSection
                        title="Información de Contacto"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                        }
                    >
                        <ProfileInfoItem label="Correo Electrónico" value={userData.email} />
                        <ProfileInfoItem label="Teléfono" value={userData.telefono} />
                        <ProfileInfoItem label="Dirección" value={userData.direccion} />
                    </ProfileInfoSection>

                    {/* Contacto de Emergencia */}
                    <ProfileInfoSection
                        title="Contacto de Emergencia"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        }
                    >
                        <ProfileInfoItem label="Nombre" value={userData.emergenciaNombre} />
                        <ProfileInfoItem label="Teléfono" value={userData.emergenciaTelefono} />
                        <ProfileInfoItem label="Parentesco" value={userData.emergenciaParentesco} />
                    </ProfileInfoSection>
                </div>
            </div>
        </div>
    );
}

export default Profile;

