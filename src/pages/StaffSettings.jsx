import React, { useState, useEffect, useRef } from 'react';
import { getAllStaffMembers, updateStaffProfile, createStaffProfile, generateDatabaseBackup, importDatabaseBackup } from '../services/staffService';
import { uploadProfilePhoto } from '../services/authService';
import { compressImage } from '../utils/imageUtils';
import StaffEditModal from '../components/Staff/StaffEditModal';
import AddStaffModal from '../components/Staff/AddStaffModal';
import ConfirmationModal from '../components/Modals/ConfirmationModal';
import './StaffSettings.css';

const StaffSettings = () => {
    const [staffList, setStaffList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Edit Modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [editedMember, setEditedMember] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Add Modal state
    const [showAddModal, setShowAddModal] = useState(false);

    // Confirmation Modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [backupError, setBackupError] = useState('');
    const [backupSuccess, setBackupSuccess] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState('');
    const [importSuccess, setImportSuccess] = useState('');
    const backupFileInputRef = useRef(null);

    useEffect(() => {
        loadStaff();
    }, []);

    useEffect(() => {
        if (showEditModal || showAddModal || showConfirmModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showEditModal, showAddModal, showConfirmModal]);

    const loadStaff = async () => {
        setIsLoading(true);
        setError('');
        try {
            const { staff, error: loadError } = await getAllStaffMembers();
            if (loadError) {
                console.error('Load error:', loadError);
                setError(loadError.message || 'Error al cargar la lista de personal.');
            } else {
                setStaffList(staff);
            }
        } catch (err) {
            console.error('Caught error:', err);
            setError('Error de conexión o permisos insuficientes.');
        }
        setIsLoading(false);
    };

    const handleEditClick = (member) => {
        setSelectedMember(member);
        setEditedMember({ ...member });
        setSaveError('');
        setShowEditModal(true);
    };

    const handleFieldChange = (field, value) => {
        setEditedMember(prev => ({ ...prev, [field]: value }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setSaveError('Por favor, selecciona una imagen válida (JPG, PNG o WEBP)');
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setSaveError('La imagen debe ser menor a 5MB');
            return;
        }

        setIsUploadingPhoto(true);
        setSaveError('');

        try {
            const compressedBlob = await compressImage(file);
            const compressedFile = new File([compressedBlob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
            });

            const { photoURL, error } = await uploadProfilePhoto(selectedMember.uid, compressedFile, 'staff');

            if (error) {
                console.error('Upload error:', error);
                setSaveError('Error al subir la foto.');
            } else {
                setEditedMember(prev => ({ ...prev, photoURL }));
                setStaffList(prevList =>
                    prevList.map(m => m.uid === selectedMember.uid ? { ...m, photoURL } : m)
                );
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            setSaveError('Ocurrió un error al subir la foto.');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setSaveError('');

        const { error } = await updateStaffProfile(selectedMember.uid, {
            nombres: editedMember.nombres,
            apellidos: editedMember.apellidos,
            role: editedMember.role,
            telefono: editedMember.telefono || '',
            cargo: editedMember.cargo || ''
        });

        if (error) {
            setSaveError('Error al actualizar los datos.');
        } else {
            await loadStaff();
            setShowEditModal(false);
        }
        setIsSaving(false);
    };

    const handleAddStaff = async (formData) => {
        setIsSaving(true);
        setSaveError('');

        const { success, error } = await createStaffProfile(formData.email, formData.password, formData);

        if (!success) {
            console.error('Error creating user:', error);
            if (error.code === 'auth/email-already-in-use') {
                setSaveError('Este correo electrónico ya está registrado.');
            } else if (error.code === 'auth/weak-password') {
                setSaveError('La contraseña es demasiado débil.');
            } else {
                setSaveError('Ocurrió un error al crear la cuenta. Verifica que tienes conexión.');
            }
        } else {
            await loadStaff();
            setShowAddModal(false);
        }
        setIsSaving(false);
    };
    const handleDeactivate = () => {
        const isDeactivating = selectedMember.status !== 'inactive';
        setConfirmAction({
            title: isDeactivating ? 'Desactivar Cuenta' : 'Activar Cuenta',
            message: `¿Estás seguro de que deseas ${isDeactivating ? 'desactivar' : 'activar'} esta cuenta?`,
            onConfirm: async () => {
                setIsSaving(true);
                const { error } = await updateStaffProfile(selectedMember.uid, {
                    status: isDeactivating ? 'inactive' : 'active'
                });

                if (error) {
                    setSaveError(`Error al cambiar el estado.`);
                } else {
                    await loadStaff();
                    setShowEditModal(false);
                }
                setIsSaving(false);
                setShowConfirmModal(false);
            }
        });
        setShowConfirmModal(true);
    };

    const handleDatabaseBackup = async () => {
        setIsBackingUp(true);
        setBackupError('');
        setBackupSuccess('');
        setImportError('');
        setImportSuccess('');

        const { backup, error: backupLoadError } = await generateDatabaseBackup();

        if (backupLoadError || !backup) {
            setBackupError('No se pudo generar el respaldo. Verifica permisos e inténtalo de nuevo.');
            setIsBackingUp(false);
            return;
        }

        try {
            const dateForFile = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `respaldo-bd-${dateForFile}.json`;
            const fileContent = JSON.stringify(backup, null, 2);
            const blob = new Blob([fileContent], { type: 'application/json' });
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

            setBackupSuccess('Respaldo generado y descargado correctamente.');
        } catch (downloadError) {
            console.error('Backup download error:', downloadError);
            setBackupError('El respaldo se generó, pero falló la descarga del archivo.');
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleOpenImportFilePicker = () => {
        setImportError('');
        setImportSuccess('');
        if (backupFileInputRef.current) {
            backupFileInputRef.current.click();
        }
    };

    const validateBackupStructure = (backupData) => {
        if (!backupData || typeof backupData !== 'object') {
            return 'El archivo no contiene un JSON válido de respaldo.';
        }

        if (!backupData.collections || typeof backupData.collections !== 'object') {
            return 'El archivo no incluye la sección "collections".';
        }

        const requiredCollections = ['staff', 'users', 'appointments', 'notifications'];
        for (const collectionName of requiredCollections) {
            const records = backupData.collections[collectionName];
            if (!Array.isArray(records)) {
                return `La colección "${collectionName}" es inválida o no existe en el respaldo.`;
            }

            const hasInvalidRecord = records.some((item) => !item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id.trim());
            if (hasInvalidRecord) {
                return `La colección "${collectionName}" contiene registros sin "id" válido.`;
            }
        }

        return null;
    };

    const handleImportBackup = async (backupData) => {
        setShowConfirmModal(false);
        setIsImporting(true);
        setImportError('');
        setImportSuccess('');
        setBackupError('');
        setBackupSuccess('');

        const { success, error: importLoadError } = await importDatabaseBackup(backupData);

        if (!success || importLoadError) {
            console.error('Import error:', importLoadError);
            setImportError('No se pudo importar el respaldo. Verifica permisos e inténtalo de nuevo.');
            setIsImporting(false);
            return;
        }

        await loadStaff();
        setImportSuccess('Respaldo importado correctamente. Los datos actuales fueron reemplazados.');
        setIsImporting(false);
    };

    const handleBackupFileSelected = async (event) => {
        const selectedFile = event.target.files?.[0];
        event.target.value = '';

        if (!selectedFile) return;

        try {
            const fileText = await selectedFile.text();
            const backupData = JSON.parse(fileText);
            const validationError = validateBackupStructure(backupData);

            if (validationError) {
                setImportError(validationError);
                return;
            }

            const collectionLabels = {
                staff: 'personal',
                users: 'pacientes',
                appointments: 'citas',
                notifications: 'notificaciones'
            };

            const counts = ['staff', 'users', 'appointments', 'notifications']
                .map((collectionName) => ({
                    label: collectionLabels[collectionName] || collectionName,
                    value: backupData.collections[collectionName].length
                }));

            setConfirmAction({
                title: 'Importar Respaldo',
                message: 'Advertencia: esta importación reemplazará todos los datos actuales del sistema.',
                details: {
                    fileName: selectedFile.name,
                    counts,
                    footer: '¿Deseas continuar con la importación?'
                },
                confirmText: 'Sí, importar y reemplazar',
                cancelText: 'Cancelar',
                type: 'warning',
                onConfirm: () => handleImportBackup(backupData)
            });
            setShowConfirmModal(true);
        } catch (error) {
            console.error('Invalid backup file:', error);
            setImportError('El archivo seleccionado no es un JSON de respaldo válido.');
        }
    };

    return (
        <div className="settings-container">
            <header className="settings-header">
                <h1>
                    <svg className="settings-page-title-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    Configuración del Sistema
                </h1>
                <p className="subtitle">Administra el personal médico y ajustes globales</p>
            </header>

            <div className="settings-content">
                <section className="settings-section">
                    <div className="section-header">
                        <h2>Personal Médico y Administrativo</h2>
                        <button className="add-staff-btn" onClick={() => setShowAddModal(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="23" y1="11" x2="17" y2="11"></line>
                            </svg>
                            Agregar Personal
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="settings-loading">Cargando personal...</div>
                    ) : error ? (
                        <div className="settings-error">{error}</div>
                    ) : (
                        <div className="staff-table-container">
                            <table className="staff-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Cargo</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffList.map((member) => (
                                        <tr key={member.uid}>
                                            <td data-label="Nombre">
                                                <div className="member-name">
                                                    <div className="member-avatar">
                                                        {member.photoURL ? (
                                                            <img src={member.photoURL} alt={member.nombres} />
                                                        ) : (
                                                            <span>{member.nombres.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <div className="member-info">
                                                        <span className="name">{member.nombres} {member.apellidos}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Cargo">
                                                <span className="member-cargo">{member.cargo || 'No especificado'}</span>
                                            </td>
                                            <td data-label="Email">
                                                <span className="member-email">{member.email}</span>
                                            </td>
                                            <td data-label="Rol">
                                                <span className={`role-badge ${member.role}`}>
                                                    {member.role === 'admin' ? 'Administrador' : 'Médico'}
                                                </span>
                                                {member.status === 'inactive' && (
                                                    <span className="status-badge inactive">Inactivo</span>
                                                )}
                                            </td>
                                            <td data-label="Acciones">
                                                <button
                                                    className="edit-staff-btn"
                                                    onClick={() => handleEditClick(member)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="settings-section backup-section">
                    <div className="section-header">
                        <h2>Respaldo de Base de Datos</h2>
                        <div className="backup-actions">
                            <button
                                className="backup-db-btn"
                                onClick={handleDatabaseBackup}
                                disabled={isBackingUp || isImporting}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                {isBackingUp ? 'Generando respaldo...' : 'Respaldar toda la base de datos'}
                            </button>
                            <button
                                className="import-db-btn"
                                onClick={handleOpenImportFilePicker}
                                disabled={isBackingUp || isImporting}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                                {isImporting ? 'Importando respaldo...' : 'Importar respaldo'}
                            </button>
                        </div>
                    </div>
                    <p className="backup-description">
                        Descarga un archivo JSON con toda la información de pacientes, personal, citas y notificaciones.
                    </p>
                    <p className="backup-warning">
                        Advertencia: al importar un respaldo se reemplazan los datos actuales del sistema.
                    </p>
                    {backupError && <p className="backup-status backup-status-error">{backupError}</p>}
                    {backupSuccess && <p className="backup-status backup-status-success">{backupSuccess}</p>}
                    {importError && <p className="backup-status backup-status-error">{importError}</p>}
                    {importSuccess && <p className="backup-status backup-status-success">{importSuccess}</p>}

                    <input
                        ref={backupFileInputRef}
                        type="file"
                        accept="application/json,.json"
                        onChange={handleBackupFileSelected}
                        className="backup-file-input"
                    />
                </section>
            </div>

            <StaffEditModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                member={selectedMember}
                editedMember={editedMember}
                isSaving={isSaving}
                isUploadingPhoto={isUploadingPhoto}
                saveError={saveError}
                onFieldChange={handleFieldChange}
                onPhotoUpload={handlePhotoUpload}
                onSaveChanges={handleSaveChanges}
                onDeactivate={handleDeactivate}
            />

            <AddStaffModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAddStaff={handleAddStaff}
                isSaving={isSaving}
                saveError={saveError}
            />

            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmAction?.onConfirm}
                title={confirmAction?.title}
                message={confirmAction?.message}
                details={confirmAction?.details}
                confirmText={confirmAction?.confirmText || confirmAction?.title}
                cancelText={confirmAction?.cancelText}
                type={confirmAction?.type}
            />
        </div>
    );
};

export default StaffSettings;
