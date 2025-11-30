import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { uploadProfilePhoto } from '../services/authService';
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

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate new dimensions (max 800x800)
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 800;

                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to blob with compression
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Error al comprimir la imagen'));
                            }
                        },
                        'image/jpeg',
                        0.8 // 80% quality
                    );
                };
                img.onerror = () => reject(new Error('Error al cargar la imagen'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsDataURL(file);
        });
    };

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

    const getTipoPacienteLabel = (tipo) => {
        const labels = {
            'primera-vez': 'Primera Vez',
            'particular': 'Particular',
            'seguro': 'Con Seguro',
            'empresa': 'Empresa'
        };
        return labels[tipo] || tipo;
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
                <div className="profile-header">
                    <div className="profile-avatar-container">
                        <input
                            type="file"
                            id="photo-upload"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handlePhotoUpload}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="photo-upload" className="profile-avatar">
                            {isUploading ? (
                                <div className="upload-spinner"></div>
                            ) : userData.photoURL ? (
                                <>
                                    <img src={userData.photoURL} alt="Foto de perfil" className="profile-photo" />
                                    <div className="photo-overlay">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                            <circle cx="12" cy="13" r="4"></circle>
                                        </svg>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <div className="photo-overlay">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                            <circle cx="12" cy="13" r="4"></circle>
                                        </svg>
                                    </div>
                                </>
                            )}
                        </label>
                    </div>
                    <div className="profile-header-info">
                        <h1 className="profile-name">{userData.nombres} {userData.apellidos}</h1>
                        <p className="profile-email">{userData.email}</p>
                        {uploadError && <p className="upload-error">{uploadError}</p>}
                    </div>
                </div>

                <div className="profile-sections">
                    {/* Información Personal */}
                    <section className="profile-section">
                        <h2 className="section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Información Personal
                        </h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Nombres</label>
                                <p>{userData.nombres || 'No especificado'}</p>
                            </div>
                            <div className="info-item">
                                <label>Apellidos</label>
                                <p>{userData.apellidos || 'No especificado'}</p>
                            </div>
                            <div className="info-item">
                                <label>Fecha de Nacimiento</label>
                                <p>{formatDate(userData.fechaNacimiento)}</p>
                            </div>
                            <div className="info-item">
                                <label>DUI</label>
                                <p>{userData.dui || 'No especificado'}</p>
                            </div>
                            <div className="info-item">
                                <label>Género</label>
                                <p>{getGeneroLabel(userData.genero)}</p>
                            </div>
                        </div>
                    </section>

                    {/* Información de Contacto */}
                    <section className="profile-section">
                        <h2 className="section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            Información de Contacto
                        </h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Correo Electrónico</label>
                                <p>{userData.email || 'No especificado'}</p>
                            </div>
                            <div className="info-item">
                                <label>Teléfono</label>
                                <p>{userData.telefono || 'No especificado'}</p>
                            </div>
                            <div className="info-item">
                                <label>Dirección</label>
                                <p>{userData.direccion || 'No especificado'}</p>
                            </div>
                        </div>
                    </section>

                    {/* Contacto de Emergencia */}
                    <section className="profile-section">
                        <h2 className="section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            Contacto de Emergencia
                        </h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Nombre</label>
                                <p>{userData.emergenciaNombre || 'No especificado'}</p>
                            </div>
                            <div className="info-item">
                                <label>Teléfono</label>
                                <p>{userData.emergenciaTelefono || 'No especificado'}</p>
                            </div>
                            <div className="info-item">
                                <label>Parentesco</label>
                                <p>{userData.emergenciaParentesco || 'No especificado'}</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Profile;
