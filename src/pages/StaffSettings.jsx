import React, { useState, useEffect } from 'react';
import { getAllStaffMembers, updateStaffProfile, createStaffProfile } from '../services/staffService';
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
    const [saveError, setSaveError] = useState('');

    // Add Modal state
    const [showAddModal, setShowAddModal] = useState(false);

    // Confirmation Modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

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
                                                    <span>{member.nombres} {member.apellidos}</span>
                                                </div>
                                            </td>
                                            <td data-label="Email">{member.email}</td>
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
            </div>

            <StaffEditModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                member={selectedMember}
                editedMember={editedMember}
                isSaving={isSaving}
                saveError={saveError}
                onFieldChange={handleFieldChange}
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
                confirmText={confirmAction?.title}
            />
        </div>
    );
};

export default StaffSettings;
