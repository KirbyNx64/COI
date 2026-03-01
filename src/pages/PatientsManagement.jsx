import { useEffect, useReducer, useMemo, useState } from 'react';
import { updatePatientData, createPatientWithTempPassword, getPatientHistory, getPatientsByDui, getPatientsPaginated, getAllPatients } from '../services/staffService';
import StaffAppointmentForm from '../components/StaffAppointmentForm';
import PatientTable from '../components/Patients/PatientTable';
import PatientDetailModal from '../components/Patients/PatientDetailModal';
import NewPatientModal from '../components/Patients/NewPatientModal';
import MedicalHistoryModal from '../components/Patients/MedicalHistoryModal';
import SuccessModal from '../components/Patients/SuccessModal';
import './PatientsManagement.css';

const initialState = {
    patients: [],
    searchTerm: '',
    isLoading: true,
    currentPage: 1,
    // Detail Modal
    showDetailModal: false,
    selectedPatient: null,
    isEditMode: false,
    editedPatient: null,
    isSaving: false,
    saveError: null,
    copiedUid: false,
    // Appointment Modal
    showAppointmentModal: false,
    selectedPatientForAppointment: null,
    // Success Modal
    showSuccessModal: false,
    // New Patient Modal
    showNewPatientModal: false,
    isCreatingPatient: false,
    createError: null,
    newPatientData: {
        nombres: '',
        apellidos: '',
        email: '',
        telefono: '',
        fechaNacimiento: '',
        genero: '',
        direccion: '',
        dui: '',
        emergenciaNombre: '',
        emergenciaTelefono: '',
        emergenciaParentesco: '',
        tipoPaciente: 'primera-vez'
    },
    // History Modal
    showHistoryModal: false,
    patientHistory: [],
    isLoadingHistory: false
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_PATIENTS':
            return { ...state, patients: action.payload, isLoading: false };
        case 'SET_SEARCH':
            return { ...state, searchTerm: action.payload, currentPage: 1 };
        case 'SET_PAGE':
            return { ...state, currentPage: action.payload };
        // Detail Modal Actions
        case 'OPEN_DETAIL':
            return {
                ...state,
                showDetailModal: true,
                selectedPatient: action.payload,
                editedPatient: { ...action.payload },
                isEditMode: false,
                saveError: null
            };
        case 'CLOSE_DETAIL':
            return {
                ...state,
                showDetailModal: false,
                selectedPatient: null,
                editedPatient: null,
                isEditMode: false,
                saveError: null
            };
        case 'TOGGLE_EDIT':
            return { ...state, isEditMode: !state.isEditMode, saveError: null };
        case 'UPDATE_EDITED_PATIENT':
            return {
                ...state,
                editedPatient: { ...state.editedPatient, [action.field]: action.value }
            };
        case 'SET_SAVING':
            return { ...state, isSaving: action.payload };
        case 'SET_SAVE_ERROR':
            return { ...state, saveError: action.payload, isSaving: false };
        case 'SET_COPIED':
            return { ...state, copiedUid: action.payload };
        // Appointment Modal Actions
        case 'OPEN_APPOINTMENT':
            return {
                ...state,
                showAppointmentModal: true,
                selectedPatientForAppointment: action.payload
            };
        case 'CLOSE_APPOINTMENT':
            return {
                ...state,
                showAppointmentModal: false,
                selectedPatientForAppointment: null
            };
        // New Patient Modal Actions
        case 'OPEN_NEW_PATIENT':
            return { ...state, showNewPatientModal: true, createError: null };
        case 'CLOSE_NEW_PATIENT':
            return {
                ...state,
                showNewPatientModal: false,
                isCreatingPatient: false,
                createError: null,
                newPatientData: initialState.newPatientData
            };
        case 'UPDATE_NEW_PATIENT_DATA':
            return {
                ...state,
                newPatientData: { ...state.newPatientData, [action.field]: action.value }
            };
        case 'SET_CREATING':
            return { ...state, isCreatingPatient: action.payload };
        case 'SET_CREATE_ERROR':
            return { ...state, createError: action.payload, isCreatingPatient: false };
        // History Modal Actions
        case 'OPEN_HISTORY':
            return { ...state, showHistoryModal: true, isLoadingHistory: true };
        case 'SET_HISTORY':
            return { ...state, patientHistory: action.payload, isLoadingHistory: false };
        case 'CLOSE_HISTORY':
            return { ...state, showHistoryModal: false, patientHistory: [], isLoadingHistory: false };
        // Global
        case 'TOGGLE_SUCCESS':
            return { ...state, showSuccessModal: action.payload };
        case 'REFRESH_LIST':
            return {
                ...state,
                patients: action.patients,
                selectedPatient: action.selectedPatient || state.selectedPatient,
                editedPatient: action.selectedPatient ? { ...action.selectedPatient } : state.editedPatient
            };
        default:
            return state;
    }
}

const PatientsManagement = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        patients, searchTerm, isLoading, currentPage,
        showDetailModal, selectedPatient, isEditMode, editedPatient, isSaving, saveError, copiedUid,
        showAppointmentModal, selectedPatientForAppointment,
        showSuccessModal,
        showNewPatientModal, isCreatingPatient, createError, newPatientData,
        showHistoryModal, patientHistory, isLoadingHistory
    } = state;

    // DUI search state
    const [duiInput, setDuiInput] = useState('');
    const [isDuiMode, setIsDuiMode] = useState(false);
    const [duiResults, setDuiResults] = useState([]);
    const [isDuiLoading, setIsDuiLoading] = useState(false);

    // Cursor-based pagination state
    const [pagePatients, setPagePatients] = useState([]);  // current page records
    const [pageNum, setPageNum] = useState(1);
    const [firstDocCursor, setFirstDocCursor] = useState(null);
    const [lastDocCursor, setLastDocCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [isPagLoading, setIsPagLoading] = useState(false);
    const patientsPerPage = 10;

    // DUI format: ########-#
    const isDuiFormat = (text) => /^\d{8}-\d$/.test(text.trim());

    useEffect(() => {
        loadPage();
    }, []);

    const loadPage = async (direction = 'next', cursorDoc = null, firstDoc = null) => {
        setIsPagLoading(true);
        dispatch({ type: 'SET_PATIENTS', payload: [] }); // clear while loading
        const { patients: data, firstDoc: fd, lastDoc: ld, hasMore: more, error } = await getPatientsPaginated(
            patientsPerPage, cursorDoc, direction, firstDoc
        );
        setIsPagLoading(false);
        if (!error) {
            setPagePatients(data);
            setFirstDocCursor(fd);
            setLastDocCursor(ld);
            setHasMore(more);
        } else {
            console.error('Error loading paginated patients:', error);
        }
    };

    const handleNextPage = () => {
        if (!hasMore) return;
        setPageNum(p => p + 1);
        loadPage('next', lastDocCursor, null);
    };

    const handlePrevPage = () => {
        if (pageNum <= 1) return;
        setPageNum(p => p - 1);
        loadPage('prev', null, firstDocCursor);
    };

    // Also keep getAllPatients for refreshing after create/edit
    const loadPatients = async () => {
        loadPage();
        setPageNum(1);
    };

    // Auto-format DUI input: ########-#  (max 10 chars)
    const formatDuiInput = (value) => {
        const digits = value.replace(/\D/g, '').slice(0, 9);
        if (digits.length > 8) {
            return `${digits.slice(0, 8)}-${digits.slice(8)}`;
        }
        return digits;
    };

    const handleDuiSearch = async () => {
        const trimmed = duiInput.trim();
        setIsDuiLoading(true);
        const { patients: results, error } = await getPatientsByDui(trimmed);
        setIsDuiLoading(false);
        if (!error) {
            setDuiResults(results);
            setIsDuiMode(true);
        }
    };

    const handleDuiInputChange = (e) => {
        const formatted = formatDuiInput(e.target.value);
        setDuiInput(formatted);
        if (!formatted) {
            setIsDuiMode(false);
            setDuiResults([]);
        }
    };

    // Displayed patients: DUI results or current page
    const displayedPatients = isDuiMode ? duiResults : pagePatients;
    const totalPages = isDuiMode ? Math.ceil(duiResults.length / patientsPerPage) : null;
    const currentPatients = isDuiMode
        ? duiResults.slice((state.currentPage - 1) * patientsPerPage, state.currentPage * patientsPerPage)
        : pagePatients; // already the right page from Firestore

    const handleViewDetails = (patient) => {
        dispatch({ type: 'OPEN_DETAIL', payload: patient });
    };

    const handleEditFieldChange = (field, value) => {
        dispatch({ type: 'UPDATE_EDITED_PATIENT', field, value });
    };

    const handleSaveChanges = async () => {
        dispatch({ type: 'SET_SAVING', payload: true });
        const { error } = await updatePatientData(selectedPatient.id, editedPatient);

        if (!error) {
            const { patients } = await getAllPatients();
            const updatedPatient = patients?.find(p => p.id === selectedPatient.id);
            dispatch({ type: 'REFRESH_LIST', patients: patients || [], selectedPatient: updatedPatient });
            dispatch({ type: 'TOGGLE_EDIT' });
        } else {
            console.error('Error updating patient:', error);
            dispatch({ type: 'SET_SAVE_ERROR', payload: error.message || 'Error al guardar los cambios' });
        }
        dispatch({ type: 'SET_SAVING', payload: false });
    };

    const handleCopyUid = (uid) => {
        navigator.clipboard.writeText(uid);
        dispatch({ type: 'SET_COPIED', payload: true });
        setTimeout(() => dispatch({ type: 'SET_COPIED', payload: false }), 2000);
    };

    const handleViewHistory = async (patient) => {
        dispatch({ type: 'OPEN_HISTORY' });
        const { history, error } = await getPatientHistory(patient.id);
        if (history) {
            dispatch({ type: 'SET_HISTORY', payload: history });
        } else {
            console.error('Error fetching history:', error);
            dispatch({ type: 'SET_HISTORY', payload: [] });
        }
    };

    const handleCreatePatient = async (e) => {
        e.preventDefault();
        dispatch({ type: 'SET_CREATING', payload: true });

        // Basic validation
        if (!newPatientData.nombres || !newPatientData.apellidos || !newPatientData.email) {
            dispatch({ type: 'SET_CREATE_ERROR', payload: 'Por favor completa los campos obligatorios (*)' });
            dispatch({ type: 'SET_CREATING', payload: false });
            return;
        }

        const { success, error } = await createPatientWithTempPassword(newPatientData);

        if (success) {
            const { patients } = await getAllPatients();
            dispatch({ type: 'SET_PATIENTS', payload: patients || [] });
            dispatch({ type: 'CLOSE_NEW_PATIENT' });
            dispatch({ type: 'TOGGLE_SUCCESS', payload: true });
        } else {
            console.error('Error creating patient:', error);
            dispatch({ type: 'SET_CREATE_ERROR', payload: error.message || 'Error al crear el paciente' });
        }
    };

    const handleAppointmentSuccess = () => {
        dispatch({ type: 'CLOSE_APPOINTMENT' });
    };

    const formatDate = (value) => {
        if (!value) return 'N/A';
        try {
            let date;
            if (value?.toDate) {
                // Firestore Timestamp
                date = value.toDate();
            } else if (value instanceof Date) {
                date = value;
            } else {
                const str = String(value);
                if (str.includes('T')) {
                    // ISO datetime string (e.g. "2025-12-02T18:30:55.549Z") — parse normally
                    date = new Date(str);
                } else {
                    // Plain "YYYY-MM-DD" date string — parse manually to avoid UTC offset
                    const [year, month, day] = str.split('-');
                    date = new Date(Number(year), Number(month) - 1, Number(day));
                }
            }
            return date.toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return String(value);
        }
    };

    // Block body scroll when any modal is open
    useEffect(() => {
        if (showDetailModal || showAppointmentModal || showSuccessModal || showNewPatientModal || showHistoryModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showDetailModal, showAppointmentModal, showSuccessModal, showNewPatientModal, showHistoryModal]);

    return (
        <div className="patients-management">
            <div className="patients-header">
                <h1>
                    <svg className="patients-page-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                    <div className="search-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    <input
                        type="text"
                        className={`search-input ${isDuiMode ? 'dui-search-active' : ''}`}
                        placeholder="Buscar por DUI"
                        value={duiInput}
                        onChange={handleDuiInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleDuiSearch()}
                    />
                    {duiInput && (
                        <button
                            className="dui-clear-btn"
                            onClick={() => {
                                setDuiInput('');
                                setIsDuiMode(false);
                                setDuiResults([]);
                            }}
                            title="Limpiar búsqueda"
                        >
                            ✕
                        </button>
                    )}
                    <button
                        className="dui-search-btn"
                        onClick={handleDuiSearch}
                        disabled={isDuiLoading}
                        title="Buscar paciente por DUI"
                    >
                        {isDuiLoading ? '...' : 'Buscar DUI'}
                    </button>
                </div>

                <button
                    className="add-patient-button"
                    onClick={() => dispatch({ type: 'OPEN_NEW_PATIENT' })}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="17" y1="11" x2="23" y2="11"></line>
                    </svg>
                    Agregar Paciente
                </button>
            </div>

            {(isLoading || isPagLoading) ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando pacientes...</p>
                </div>
            ) : (
                <PatientTable
                    patients={currentPatients}
                    onViewDetails={handleViewDetails}
                    pageNum={pageNum}
                    hasNext={!isDuiMode && hasMore}
                    hasPrev={!isDuiMode && pageNum > 1}
                    onNext={handleNextPage}
                    onPrev={handlePrevPage}
                    isDuiMode={isDuiMode}
                    totalDuiPages={totalPages}
                    currentDuiPage={currentPage}
                    onDuiPageChange={(n) => dispatch({ type: 'SET_PAGE', payload: n })}
                />
            )}

            {/* Modals extracted to components */}
            <PatientDetailModal
                isOpen={showDetailModal}
                onClose={() => dispatch({ type: 'CLOSE_DETAIL' })}
                patient={selectedPatient}
                editedPatient={editedPatient}
                isEditMode={isEditMode}
                isSaving={isSaving}
                saveError={saveError}
                onEditClick={() => dispatch({ type: 'TOGGLE_EDIT' })}
                onCancelEdit={() => dispatch({ type: 'TOGGLE_EDIT' })}
                onFieldChange={handleEditFieldChange}
                onSaveChanges={handleSaveChanges}
                onScheduleAppointment={(p) => dispatch({ type: 'OPEN_APPOINTMENT', payload: p })}
                onViewHistory={handleViewHistory}
                formatDate={formatDate}
                handleCopyUid={handleCopyUid}
                copiedUid={copiedUid}
            />

            <NewPatientModal
                isOpen={showNewPatientModal}
                onClose={() => dispatch({ type: 'CLOSE_NEW_PATIENT' })}
                newPatientData={newPatientData}
                isCreating={isCreatingPatient}
                createError={createError}
                onFieldChange={(field, value) => dispatch({ type: 'UPDATE_NEW_PATIENT_DATA', field, value })}
                onCreatePatient={handleCreatePatient}
                onCancel={() => dispatch({ type: 'CLOSE_NEW_PATIENT' })}
            />

            <MedicalHistoryModal
                isOpen={showHistoryModal}
                onClose={() => dispatch({ type: 'CLOSE_HISTORY' })}
                patient={selectedPatient}
                isLoading={isLoadingHistory}
                history={patientHistory}
                formatDate={formatDate}
            />

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => dispatch({ type: 'TOGGLE_SUCCESS', payload: false })}
                message="Paciente agregado exitosamente"
                submessage="Se ha enviado un correo electrónico al paciente para que establezca su contraseña."
            />

            {/* Appointment Modal — Programar Cita */}
            {showAppointmentModal && selectedPatientForAppointment && (
                <div className="scm-overlay" onClick={() => dispatch({ type: 'CLOSE_APPOINTMENT' })}>
                    <div className="scm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="scm-header">
                            <div className="scm-header-text">
                                <h2>Programar Cita</h2>
                                <span className="scm-patient-subtitle">
                                    {selectedPatientForAppointment.nombres} {selectedPatientForAppointment.apellidos}
                                </span>
                            </div>
                            <button className="scm-close" onClick={() => dispatch({ type: 'CLOSE_APPOINTMENT' })}>
                                ×
                            </button>
                        </div>
                        <StaffAppointmentForm
                            patientData={selectedPatientForAppointment}
                            onSuccess={handleAppointmentSuccess}
                            onCancel={() => dispatch({ type: 'CLOSE_APPOINTMENT' })}
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

export default PatientsManagement;
