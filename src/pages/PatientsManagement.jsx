import React, { useState, useEffect } from 'react';
import { getAllPatients, updatePatientData, createPatientWithTempPassword } from '../services/staffService';
import { getAppointmentsByUser } from '../services/appointmentService';
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

    // New patient creation states
    const [showNewPatientModal, setShowNewPatientModal] = useState(false);
    const [newPatientData, setNewPatientData] = useState({
        nombres: '',
        apellidos: '',
        email: '',
        telefono: '',
        dui: '',
        fechaNacimiento: '',
        genero: '',
        direccion: '',
        emergenciaNombre: '',
        emergenciaTelefono: '',
        emergenciaParentesco: '',
        tipoPaciente: 'primera-vez'
    });
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [patientHistory, setPatientHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isCreatingPatient, setIsCreatingPatient] = useState(false);
    const [createError, setCreateError] = useState('');

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
        if (showDetailModal || showAppointmentModal || showSuccessModal || showNewPatientModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to restore scroll when component unmounts
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showDetailModal, showAppointmentModal, showSuccessModal, showNewPatientModal]);

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

    const handleViewHistory = async (patient) => {
        setIsLoadingHistory(true);
        setShowHistoryModal(true);
        const { appointments, error: historyError } = await getAppointmentsByUser(patient.id);
        if (!historyError) {
            setPatientHistory(appointments);
        } else {
            console.error('Error fetching history:', historyError);
        }
        setIsLoadingHistory(false);
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

    const handleNewPatientClick = () => {
        setNewPatientData({
            nombres: '',
            apellidos: '',
            email: '',
            telefono: '',
            dui: '',
            fechaNacimiento: '',
            genero: '',
            direccion: '',
            emergenciaNombre: '',
            emergenciaTelefono: '',
            emergenciaParentesco: '',
            tipoPaciente: 'primera-vez'
        });
        setCreateError('');
        setShowNewPatientModal(true);
    };

    const handleNewPatientFieldChange = (field, value) => {
        setNewPatientData({
            ...newPatientData,
            [field]: value
        });
    };

    const handleCreatePatient = async () => {
        // Validate required fields
        if (!newPatientData.nombres || !newPatientData.apellidos || !newPatientData.email) {
            setCreateError('Nombres, apellidos y email son requeridos');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newPatientData.email)) {
            setCreateError('El formato del email no es válido');
            return;
        }

        setIsCreatingPatient(true);
        setCreateError('');

        // Get current user ID (staff member creating the patient)
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const createdBy = currentUser?.uid || 'unknown';

        const { success, patient, error } = await createPatientWithTempPassword(
            newPatientData,
            createdBy
        );

        if (success) {
            // Reload patients list
            await loadPatients();
            setShowNewPatientModal(false);
            setShowSuccessModal(true);
        } else {
            setCreateError(error?.message || 'Error al crear el paciente');
        }

        setIsCreatingPatient(false);
    };

    const handleCancelNewPatient = () => {
        setShowNewPatientModal(false);
        setCreateError('');
    };

    const handleDuiChange = (value) => {
        // Remove all non-numeric characters
        let cleaned = value.replace(/\D/g, '');

        // Limit to 9 digits
        cleaned = cleaned.substring(0, 9);

        // Add hyphen after 8th digit
        if (cleaned.length > 8) {
            cleaned = cleaned.substring(0, 8) + '-' + cleaned.substring(8);
        }

        handleNewPatientFieldChange('dui', cleaned);
    };

    const handleEditDuiChange = (value) => {
        // Remove all non-numeric characters
        let cleaned = value.replace(/\D/g, '');

        // Limit to 9 digits
        cleaned = cleaned.substring(0, 9);

        // Add hyphen after 8th digit
        if (cleaned.length > 8) {
            cleaned = cleaned.substring(0, 8) + '-' + cleaned.substring(8);
        }

        handleFieldChange('dui', cleaned);
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
                <div className="controls-right">
                    <div className="patients-count">
                        {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''}
                    </div>
                    <button className="add-patient-button" onClick={handleNewPatientClick}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                        Agregar Paciente
                    </button>
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
                                    <td className="patient-name" data-label="Nombre Completo">
                                        {patient.nombres} {patient.apellidos}
                                    </td>
                                    <td data-label="Email">{patient.email}</td>
                                    <td data-label="Teléfono">{patient.telefono || 'N/A'}</td>
                                    <td data-label="DUI">{patient.dui || 'N/A'}</td>
                                    <td data-label="Acciones">
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
                                                onChange={(e) => handleEditDuiChange(e.target.value)}
                                                className="edit-input"
                                                placeholder="########-#"
                                                maxLength="10"
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
                                        className="history-button"
                                        onClick={() => handleViewHistory(selectedPatient)}
                                    >
                                        Historial Médico
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
                        <h3>Paciente agregado exitosamente</h3>
                        <p>Se ha enviado un correo electrónico al paciente para que establezca su contraseña.</p>
                        <button className="success-button" onClick={() => setShowSuccessModal(false)}>
                            Aceptar
                        </button>
                    </div>
                </div>
            )}

            {/* New Patient Modal */}
            {showNewPatientModal && (
                <div className="modal-overlay" onClick={handleCancelNewPatient}>
                    <div className="modal-content new-patient-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Agregar Nuevo Paciente</h2>
                            <button className="modal-close" onClick={handleCancelNewPatient}>
                                ×
                            </button>
                        </div>

                        <div className="new-patient-content">
                            {createError && (
                                <div className="error-banner">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    {createError}
                                </div>
                            )}

                            <div className="info-banner">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                Se enviará un correo electrónico al paciente para que establezca su contraseña.
                            </div>

                            <form className="new-patient-form">
                                <div className="form-section">
                                    <h3>Información Personal</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Nombres <span className="required">*</span></label>
                                            <input
                                                type="text"
                                                value={newPatientData.nombres}
                                                onChange={(e) => handleNewPatientFieldChange('nombres', e.target.value)}
                                                placeholder="Nombres del paciente"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Apellidos <span className="required">*</span></label>
                                            <input
                                                type="text"
                                                value={newPatientData.apellidos}
                                                onChange={(e) => handleNewPatientFieldChange('apellidos', e.target.value)}
                                                placeholder="Apellidos del paciente"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Fecha de Nacimiento</label>
                                            <input
                                                type="date"
                                                value={newPatientData.fechaNacimiento}
                                                onChange={(e) => handleNewPatientFieldChange('fechaNacimiento', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Género</label>
                                            <select
                                                value={newPatientData.genero}
                                                onChange={(e) => handleNewPatientFieldChange('genero', e.target.value)}
                                            >
                                                <option value="">Seleccionar</option>
                                                <option value="Masculino">Masculino</option>
                                                <option value="Femenino">Femenino</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>DUI</label>
                                            <input
                                                type="text"
                                                value={newPatientData.dui}
                                                onChange={(e) => handleDuiChange(e.target.value)}
                                                placeholder="########-#"
                                                maxLength="10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Información de Contacto</h3>
                                    <div className="form-grid">
                                        <div className="form-group full-width">
                                            <label>Email <span className="required">*</span></label>
                                            <input
                                                type="email"
                                                value={newPatientData.email}
                                                onChange={(e) => handleNewPatientFieldChange('email', e.target.value)}
                                                placeholder="ejemplo@email.com"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Teléfono</label>
                                            <input
                                                type="text"
                                                value={newPatientData.telefono}
                                                onChange={(e) => handleNewPatientFieldChange('telefono', e.target.value)}
                                                placeholder="12345678"
                                            />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Dirección</label>
                                            <input
                                                type="text"
                                                value={newPatientData.direccion}
                                                onChange={(e) => handleNewPatientFieldChange('direccion', e.target.value)}
                                                placeholder="Dirección completa"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Contacto de Emergencia</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Nombre</label>
                                            <input
                                                type="text"
                                                value={newPatientData.emergenciaNombre}
                                                onChange={(e) => handleNewPatientFieldChange('emergenciaNombre', e.target.value)}
                                                placeholder="Nombre completo"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Teléfono</label>
                                            <input
                                                type="text"
                                                value={newPatientData.emergenciaTelefono}
                                                onChange={(e) => handleNewPatientFieldChange('emergenciaTelefono', e.target.value)}
                                                placeholder="12345678"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Parentesco</label>
                                            <input
                                                type="text"
                                                value={newPatientData.emergenciaParentesco}
                                                onChange={(e) => handleNewPatientFieldChange('emergenciaParentesco', e.target.value)}
                                                placeholder="Ej: Madre, Hermano"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="save-button"
                                onClick={handleCreatePatient}
                                disabled={isCreatingPatient}
                            >
                                {isCreatingPatient ? 'Creando...' : 'Crear Paciente'}
                            </button>
                            <button
                                className="cancel-button"
                                onClick={handleCancelNewPatient}
                                disabled={isCreatingPatient}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Medical History Modal */}
            {showHistoryModal && selectedPatient && (
                <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%' }}>
                        <div className="modal-header">
                            <h2>Historial Médico: {selectedPatient.nombres} {selectedPatient.apellidos}</h2>
                            <button className="modal-close" onClick={() => setShowHistoryModal(false)}>×</button>
                        </div>
                        <div className="history-content" style={{ padding: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
                            {isLoadingHistory ? (
                                <div className="loading-container">
                                    <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
                                    <p style={{ textAlign: 'center' }}>Cargando historial...</p>
                                </div>
                            ) : patientHistory.length === 0 ? (
                                <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <p style={{ color: '#64748b' }}>No hay registros médicos para este paciente.</p>
                                </div>
                            ) : (
                                <div className="history-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {patientHistory.map((entry) => (
                                        <div key={entry.id} className="history-card" style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '1.25rem',
                                            backgroundColor: entry.status === 'terminada' ? '#f8fafc' : '#fff',
                                            borderLeft: entry.status === 'terminada' ? '4px solid #10b981' : '4px solid #cbd5e1'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                                                    <span style={{ fontSize: '1.1rem' }}>{formatDate(entry.date)}</span>
                                                    <span style={{ margin: '0 0.5rem', color: '#94a3b8' }}>•</span>
                                                    <span>{entry.time}</span>
                                                </div>
                                                <span className={`status-badge status-${entry.status}`} style={{ fontSize: '0.8rem' }}>
                                                    {entry.status.toUpperCase()}
                                                </span>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Motivo:</label>
                                                    <p style={{ margin: '0.25rem 0 0 0' }}>{entry.reason || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Clínica:</label>
                                                    <p style={{ margin: '0.25rem 0 0 0' }}>{entry.clinica || 'N/A'}</p>
                                                </div>
                                            </div>

                                            {(entry.diagnostico || entry.notasMedico || entry.recetaMedica) && (
                                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                    {entry.diagnostico && (
                                                        <div style={{ backgroundColor: '#fff7ed', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #f97316' }}>
                                                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#c2410c', fontWeight: 'bold' }}>DIAGNÓSTICO:</label>
                                                            <p style={{ margin: '0.25rem 0 0 0', color: '#431407' }}>{entry.diagnostico}</p>
                                                        </div>
                                                    )}
                                                    {entry.notasMedico && (
                                                        <div style={{ backgroundColor: '#f0f9ff', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #0ea5e9' }}>
                                                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#0369a1', fontWeight: 'bold' }}>OBSERVACIONES:</label>
                                                            <p style={{ margin: '0.25rem 0 0 0', color: '#0c4a6e' }}>{entry.notasMedico}</p>
                                                        </div>
                                                    )}
                                                    {entry.recetaMedica && (
                                                        <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                                                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#15803d', fontWeight: 'bold' }}>RECETA MÉDICA:</label>
                                                            <pre style={{ margin: '0.25rem 0 0 0', color: '#052e16', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{entry.recetaMedica}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="close-button" onClick={() => setShowHistoryModal(false)} style={{
                                backgroundColor: '#1e293b',
                                color: 'white',
                                border: 'none',
                                padding: '0.6rem 1.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientsManagement;
