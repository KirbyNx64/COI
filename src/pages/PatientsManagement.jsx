import React, { useState, useEffect } from 'react';
import { getAllPatients, updatePatientData } from '../services/staffService';
import StaffAppointmentForm from '../components/StaffAppointmentForm';
import './PatientsManagement.css';

const PatientsManagement = () => {
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedPatient, setEditedPatient] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [copiedUid, setCopiedUid] = useState(false);

    useEffect(() => {
        loadPatients();
    }, []);

    useEffect(() => {
        // Filter patients based on search term
        if (searchTerm.trim() === '') {
            setFilteredPatients(patients);
        } else {
            const filtered = patients.filter(patient => {
                const searchLower = searchTerm.toLowerCase();
                const fullName = `${patient.nombres || ''} ${patient.apellidos || ''}`.toLowerCase();
                const email = (patient.email || '').toLowerCase();
                const dui = (patient.dui || '').toLowerCase();
                const telefono = (patient.telefono || '').toLowerCase();

                return fullName.includes(searchLower) ||
                    email.includes(searchLower) ||
                    dui.includes(searchLower) ||
                    telefono.includes(searchLower);
            });
            setFilteredPatients(filtered);
        }
    }, [searchTerm, patients]);

    // Block body scroll when any modal is open
    useEffect(() => {
        if (showDetailModal || showAppointmentModal || showSuccessModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to restore scroll when component unmounts
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showDetailModal, showAppointmentModal, showSuccessModal]);

    const loadPatients = async () => {
        setIsLoading(true);
        setError('');

        const { patients: patientsData, error: loadError } = await getAllPatients();

        if (loadError) {
            setError('Error al cargar los pacientes. Verifica los permisos de Firestore.');
            console.error('Error loading patients:', loadError);
        } else {
            setPatients(patientsData);
            setFilteredPatients(patientsData);
        }

        setIsLoading(false);
    };

    const handleViewDetails = (patient) => {
        setSelectedPatient(patient);
        setEditedPatient(patient);
        setIsEditMode(false);
        setSaveError('');
        setShowDetailModal(true);
    };

    const handleEditClick = () => {
        setIsEditMode(true);
        setSaveError('');
    };

    const handleCancelEdit = () => {
        setEditedPatient(selectedPatient);
        setIsEditMode(false);
        setSaveError('');
    };

    const handleFieldChange = (field, value) => {
        setEditedPatient({
            ...editedPatient,
            [field]: value
        });
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setSaveError('');

        const { error: updateError } = await updatePatientData(selectedPatient.id, {
            nombres: editedPatient.nombres,
            apellidos: editedPatient.apellidos,
            fechaNacimiento: editedPatient.fechaNacimiento,
            genero: editedPatient.genero,
            dui: editedPatient.dui,
            email: editedPatient.email,
            telefono: editedPatient.telefono,
            direccion: editedPatient.direccion,
            emergenciaNombre: editedPatient.emergenciaNombre,
            emergenciaTelefono: editedPatient.emergenciaTelefono,
            emergenciaParentesco: editedPatient.emergenciaParentesco,
            tipoPaciente: editedPatient.tipoPaciente
        });

        if (updateError) {
            setSaveError('Error al guardar los cambios. Intenta nuevamente.');
            console.error('Error updating patient:', updateError);
        } else {
            // Update local state
            const updatedPatients = patients.map(p =>
                p.id === selectedPatient.id ? { ...p, ...editedPatient } : p
            );
            setPatients(updatedPatients);
            setSelectedPatient(editedPatient);
            setIsEditMode(false);
        }

        setIsSaving(false);
    };

    const handleScheduleAppointment = (patient) => {
        setSelectedPatientForAppointment(patient);
        setShowAppointmentModal(true);
    };

    const handleAppointmentSuccess = () => {
        setShowAppointmentModal(false);
        setSelectedPatientForAppointment(null);
        setShowSuccessModal(true);
    };

    const handleAppointmentCancel = () => {
        setShowAppointmentModal(false);
        setSelectedPatientForAppointment(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-SV', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const handleCopyUid = async (uid) => {
        try {
            await navigator.clipboard.writeText(uid);
            setCopiedUid(true);
            setTimeout(() => setCopiedUid(false), 2000);
        } catch (err) {
            console.error('Error al copiar UID:', err);
        }
    };

    return (
        <div className="patients-management">
            <div className="patients-header">
                <h1>
                    <svg className="header-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Gestión de Pacientes
                </h1>
                <p className="subtitle">Administra la base de datos de pacientes</p>
            </div>

            <div className="patients-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email, DUI o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </div>
                <div className="patients-count">
                    {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''}
                </div>
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Cargando pacientes...</p>
                </div>
            ) : error ? (
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button onClick={loadPatients} className="retry-button">
                        Reintentar
                    </button>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="empty-state">
                    <p>No se encontraron pacientes</p>
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="clear-search-button">
                            Limpiar búsqueda
                        </button>
                    )}
                </div>
            ) : (
                <div className="patients-table-container">
                    <table className="patients-table">
                        <thead>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>DUI</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.map((patient) => (
                                <tr key={patient.id}>
                                    <td className="patient-name">
                                        {patient.nombres} {patient.apellidos}
                                    </td>
                                    <td>{patient.email}</td>
                                    <td>{patient.telefono || 'N/A'}</td>
                                    <td>{patient.dui || 'N/A'}</td>
                                    <td>
                                        <button
                                            onClick={() => handleViewDetails(patient)}
                                            className="view-button"
                                        >
                                            Ver detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Patient Detail Modal */}
            {showDetailModal && selectedPatient && editedPatient && (
                <div className="modal-overlay" onClick={() => !isEditMode && setShowDetailModal(false)}>
                    <div className="modal-content patient-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{isEditMode ? 'Editar Paciente' : 'Detalles del Paciente'}</h2>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    if (!isEditMode) {
                                        setShowDetailModal(false);
                                    }
                                }}
                                disabled={isEditMode}
                            >
                                ×
                            </button>
                        </div>

                        <div className="patient-detail-content">
                            {saveError && (
                                <div className="save-error-message">
                                    {saveError}
                                </div>
                            )}

                            <div className="detail-section">
                                <h3>Información Personal</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Nombres:</label>
                                        {isEditMode ? (
                                            <input
                                                type="text"
                                                value={editedPatient.nombres || ''}
                                                onChange={(e) => handleFieldChange('nombres', e.target.value)}
                                                className="edit-input"
                                            />
                                        ) : (
                                            <span>{selectedPatient.nombres}</span>
                                        )}
                                    </div>
                                    <div className="detail-item">
                                        <label>Apellidos:</label>
                                        {isEditMode ? (
                                            <input
                                                type="text"
                                                value={editedPatient.apellidos || ''}
                                                onChange={(e) => handleFieldChange('apellidos', e.target.value)}
                                                className="edit-input"
                                            />
                                        ) : (
                                            <span>{selectedPatient.apellidos}</span>
                                        )}
                                    </div>
                                    <div className="detail-item">
                                        <label>Fecha de Nacimiento:</label>
                                        {isEditMode ? (
                                            <input
                                                type="date"
                                                value={editedPatient.fechaNacimiento || ''}
                                                onChange={(e) => handleFieldChange('fechaNacimiento', e.target.value)}
                                                className="edit-input"
                                            />
                                        ) : (
                                            <span>{formatDate(selectedPatient.fechaNacimiento)}</span>
                                        )}
                                    </div>
                                    <div className="detail-item">
                                        <label>Género:</label>
                                        {isEditMode ? (
                                            <select
                                                value={editedPatient.genero || ''}
                                                onChange={(e) => handleFieldChange('genero', e.target.value)}
                                                className="edit-input"
                                            >
                                                <option value="">Seleccionar</option>
                                                <option value="Masculino">Masculino</option>
                                                <option value="Femenino">Femenino</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        ) : (
                                            <span>{selectedPatient.genero || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="detail-item">
                                        <label>DUI:</label>
                                        {isEditMode ? (
                                            <input
                                                type="text"
                                                value={editedPatient.dui || ''}
                                                onChange={(e) => handleFieldChange('dui', e.target.value)}
                                                className="edit-input"
                                                placeholder="########-#"
                                            />
                                        ) : (
                                            <span>{selectedPatient.dui || 'N/A'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Información de Contacto</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Email:</label>
                                        {isEditMode ? (
                                            <input
                                                type="email"
                                                value={editedPatient.email || ''}
                                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                                className="edit-input"
                                                placeholder="ejemplo@email.com"
                                            />
                                        ) : (
                                            <span>{selectedPatient.email}</span>
                                        )}
                                    </div>
                                    <div className="detail-item">
                                        <label>Teléfono:</label>
                                        {isEditMode ? (
                                            <input
                                                type="text"
                                                value={editedPatient.telefono || ''}
                                                onChange={(e) => handleFieldChange('telefono', e.target.value)}
                                                className="edit-input"
                                                placeholder="12345678"
                                            />
                                        ) : (
                                            <span>{selectedPatient.telefono || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="detail-item full-width">
                                        <label>Dirección:</label>
                                        {isEditMode ? (
                                            <input
                                                type="text"
                                                value={editedPatient.direccion || ''}
                                                onChange={(e) => handleFieldChange('direccion', e.target.value)}
                                                className="edit-input"
                                                placeholder="Dirección completa"
                                            />
                                        ) : (
                                            <span>{selectedPatient.direccion || 'N/A'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Contacto de Emergencia</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Nombre:</label>
                                        {isEditMode ? (
                                            <input
                                                type="text"
                                                value={editedPatient.emergenciaNombre || ''}
                                                onChange={(e) => handleFieldChange('emergenciaNombre', e.target.value)}
                                                className="edit-input"
                                                placeholder="Nombre completo"
                                            />
                                        ) : (
                                            <span>{selectedPatient.emergenciaNombre || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="detail-item">
                                        <label>Teléfono:</label>
                                        {isEditMode ? (
                                            <input
                                                type="text"
                                                value={editedPatient.emergenciaTelefono || ''}
                                                onChange={(e) => handleFieldChange('emergenciaTelefono', e.target.value)}
                                                className="edit-input"
                                                placeholder="12345678"
                                            />
                                        ) : (
                                            <span>{selectedPatient.emergenciaTelefono || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="detail-item">
                                        <label>Parentesco:</label>
                                        {isEditMode ? (
                                            <input
                                                type="text"
                                                value={editedPatient.emergenciaParentesco || ''}
                                                onChange={(e) => handleFieldChange('emergenciaParentesco', e.target.value)}
                                                className="edit-input"
                                                placeholder="Ej: Madre, Hermano"
                                            />
                                        ) : (
                                            <span>{selectedPatient.emergenciaParentesco || 'N/A'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Información Adicional</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Tipo de Paciente:</label>
                                        {isEditMode ? (
                                            <select
                                                value={editedPatient.tipoPaciente || ''}
                                                onChange={(e) => handleFieldChange('tipoPaciente', e.target.value)}
                                                className="edit-input"
                                            >
                                                <option value="primera-vez">Primera vez</option>
                                                <option value="subsecuente">Subsecuente</option>
                                            </select>
                                        ) : (
                                            <span className={`patient-type ${selectedPatient.tipoPaciente}`}>
                                                {selectedPatient.tipoPaciente === 'primera-vez' ? 'Primera vez' : 'Subsecuente'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="detail-item">
                                        <label>Fecha de Registro:</label>
                                        <span>{formatDate(selectedPatient.createdAt)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section technical-info">
                                <h3>
                                    <svg className="technical-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                        <line x1="8" y1="21" x2="16" y2="21"></line>
                                        <line x1="12" y1="17" x2="12" y2="21"></line>
                                    </svg>
                                    Información Técnica
                                </h3>
                                <div className="detail-grid">
                                    <div className="detail-item full-width">
                                        <label>UID del Usuario:</label>
                                        <div className="uid-container">
                                            <span className="technical-value">{selectedPatient.id || 'N/A'}</span>
                                            <button
                                                className={`copy-uid-button ${copiedUid ? 'copied' : ''}`}
                                                onClick={() => handleCopyUid(selectedPatient.id)}
                                                title="Copiar UID"
                                            >
                                                {copiedUid ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                    </svg>
                                                )}
                                                <span className="copy-text">{copiedUid ? '¡Copiado!' : 'Copiar'}</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <label>Fecha de Creación:</label>
                                        <span className="technical-value">
                                            {selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleString('es-SV', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                    {selectedPatient.updatedAt && (
                                        <div className="detail-item">
                                            <label>Última Actualización:</label>
                                            <span className="technical-value">
                                                {new Date(selectedPatient.updatedAt).toLocaleString('es-SV', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            {isEditMode ? (
                                <>
                                    <button
                                        className="cancel-button"
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="save-button"
                                        onClick={handleSaveChanges}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="schedule-appointment-button"
                                        onClick={() => handleScheduleAppointment(selectedPatient)}
                                    >
                                        <svg className="calendar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        Programar Cita
                                    </button>
                                    <button
                                        className="edit-button"
                                        onClick={handleEditClick}
                                    >
                                        <svg className="edit-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                        </svg>
                                        Editar
                                    </button>
                                    <button
                                        className="close-button"
                                        onClick={() => setShowDetailModal(false)}
                                    >
                                        Cerrar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Appointment Scheduling Modal */}
            {showAppointmentModal && selectedPatientForAppointment && (
                <div className="modal-overlay" onClick={handleAppointmentCancel}>
                    <div className="modal-content appointment-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Programar Cita</h2>
                            <button className="modal-close" onClick={handleAppointmentCancel}>
                                ×
                            </button>
                        </div>
                        <StaffAppointmentForm
                            patientData={selectedPatientForAppointment}
                            onSuccess={handleAppointmentSuccess}
                            onCancel={handleAppointmentCancel}
                        />
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
                    <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="success-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <h3>Cita programada exitosamente</h3>
                        <p>La cita ha sido creada y el paciente será notificado.</p>
                        <button className="success-button" onClick={() => setShowSuccessModal(false)}>
                            Aceptar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientsManagement;
