import { useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { subscribeToUserAppointments, updateAppointmentStatus } from '../services/appointmentService';
import ConfirmationModal from '../components/ConfirmationModal';
import './AppointmentsList.css';

const initialState = {
    appointments: [],
    expandedId: null,
    isModalOpen: false,
    appointmentToCancel: null,
    isLoading: true
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_APPOINTMENTS':
            return { ...state, appointments: action.payload, isLoading: false };
        case 'TOGGLE_EXPAND':
            return { ...state, expandedId: state.expandedId === action.payload ? null : action.payload };
        case 'OPEN_CANCEL_MODAL':
            return { ...state, isModalOpen: true, appointmentToCancel: action.payload };
        case 'CLOSE_CANCEL_MODAL':
            return { ...state, isModalOpen: false, appointmentToCancel: null };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        default:
            return state;
    }
}

function AppointmentsList() {
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(reducer, initialState);
    const { appointments, expandedId, isModalOpen, appointmentToCancel, isLoading } = state;

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
        }

        // Subscribe to real-time updates from Firebase
        const unsubscribe = subscribeToUserAppointments(user.uid, (appointmentsData) => {
            // Sort by date descending (most recent first)
            const sortedAppointments = [...appointmentsData].sort((a, b) => {
                const dateA = new Date(`${a.date} ${a.time}`);
                const dateB = new Date(`${b.date} ${b.time}`);
                return dateB - dateA;
            });
            dispatch({ type: 'SET_APPOINTMENTS', payload: sortedAppointments });
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const getStatusLabel = (status) => {
        const labels = {
            'programada': 'Programada',
            'terminada': 'Terminada',
            'cancelada': 'Cancelada',
            'perdida': 'Perdida'
        };
        return labels[status] || status;
    };

    const getClinicaLabel = (clinica) => {
        const labels = {
            'santa-tecla': 'Santa Tecla',
            'soyapango': 'Soyapango',
            'san-martin': 'San Martín',
            'escalon': 'Escalón',
            'usulutan': 'Usulután'
        };
        return labels[clinica] || clinica;
    };

    const toggleExpand = (id) => {
        dispatch({ type: 'TOGGLE_EXPAND', payload: id });
    };

    const handleCancelAppointment = (appointmentId) => {
        dispatch({ type: 'OPEN_CANCEL_MODAL', payload: appointmentId });
    };

    const confirmCancellation = async () => {
        if (!appointmentToCancel) return;

        try {
            // Update appointment status in Firebase
            const { error } = await updateAppointmentStatus(appointmentToCancel, 'cancelada');

            if (error) {
                console.error('Error cancelling appointment:', error);
                alert('Error al cancelar la cita. Por favor, intenta de nuevo.');
            }

            // Close modal and clear state
            dispatch({ type: 'CLOSE_CANCEL_MODAL' });
        } catch (err) {
            console.error('Unexpected error:', err);
            alert('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
            dispatch({ type: 'CLOSE_CANCEL_MODAL' });
        }
    };

    const handleEditAppointment = (appointment) => {
        navigate('/cita', { state: { editingAppointment: appointment } });
    };

    return (
        <div className="appointments-list-page">
            <div className="container">
                <div className="page-header">
                    <button className="back-button" onClick={() => navigate('/')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Volver
                    </button>
                    <h1 className="page-title">Mis Citas</h1>
                    <p className="page-subtitle">Todas tus citas programadas</p>
                </div>

                {isLoading ? (
                    <div className="loading-state">
                        <p>Cargando tus citas...</p>
                    </div>
                ) : appointments.length > 0 ? (
                    <div className="appointments-list">
                        {appointments.map((appointment) => (
                            <div
                                key={appointment.id}
                                className={`appointment-list-item ${expandedId === appointment.id ? 'expanded' : ''}`}
                            >
                                <div
                                    className="appointment-summary"
                                    onClick={() => toggleExpand(appointment.id)}
                                >
                                    <div className="summary-content">
                                        <div className="summary-date">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                            <span>{appointment.date}</span>
                                        </div>
                                        <div className="summary-reason">{appointment.reason || 'Sin motivo especificado'}</div>
                                        <span className={`summary-status status-${appointment.status}`}>
                                            {getStatusLabel(appointment.status)}
                                        </span>
                                    </div>
                                    <div className="expand-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </div>
                                </div>

                                {expandedId === appointment.id && (
                                    <div className="appointment-details">
                                        <div className="details-grid">
                                            <div className="detail-item">
                                                <label>Paciente</label>
                                                <p>{appointment.patientName || 'Usuario'}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Hora</label>
                                                <p>{appointment.time}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Clínica</label>
                                                <p>{getClinicaLabel(appointment.clinica)}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Motivo</label>
                                                <p>{appointment.reason || 'No especificado'}</p>
                                            </div>
                                            {appointment.notas && appointment.notas.trim() && (
                                                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                                    <label>Notas</label>
                                                    <p>{appointment.notas}</p>
                                                </div>
                                            )}
                                            {appointment.recetaMedica && appointment.recetaMedica.trim() && (
                                                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                                    <label>Receta Médica</label>
                                                    <pre style={{
                                                        backgroundColor: '#f0fdf4',
                                                        padding: '0.75rem',
                                                        borderRadius: '6px',
                                                        margin: '0',
                                                        whiteSpace: 'pre-wrap',
                                                        fontFamily: 'inherit',
                                                        fontSize: '0.95rem',
                                                        color: '#333',
                                                        width: '100%',
                                                        boxSizing: 'border-box'
                                                    }}>
                                                        {appointment.recetaMedica}
                                                    </pre>
                                                </div>
                                            )}
                                            {appointment.diagnostico && appointment.diagnostico.trim() && (
                                                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                                    <label>Diagnóstico</label>
                                                    <p style={{
                                                        backgroundColor: '#fff7ed',
                                                        padding: '0.75rem',
                                                        borderRadius: '6px',
                                                        margin: '0',
                                                        color: '#431407',
                                                        width: '100%',
                                                        boxSizing: 'border-box'
                                                    }}>
                                                        {appointment.diagnostico}
                                                    </p>
                                                </div>
                                            )}
                                            {appointment.notasMedico && appointment.notasMedico.trim() && (
                                                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                                    <label>Notas del Médico</label>
                                                    <p style={{
                                                        backgroundColor: '#f0f9ff',
                                                        padding: '0.75rem',
                                                        borderRadius: '6px',
                                                        margin: '0',
                                                        width: '100%',
                                                        boxSizing: 'border-box'
                                                    }}>
                                                        {appointment.notasMedico}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {appointment.status === 'programada' && (
                                            <div className="appointment-actions">
                                                <button
                                                    className="btn-action btn-edit"
                                                    onClick={() => handleEditAppointment(appointment)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                    Editar
                                                </button>
                                                <button
                                                    className="btn-action btn-cancel"
                                                    onClick={() => handleCancelAppointment(appointment.id)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                                    </svg>
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <h3>No tienes citas programadas</h3>
                        <p>Agenda tu próxima cita con nosotros</p>
                        <button className="cta-button" onClick={() => navigate('/cita')}>
                            Agendar Cita
                        </button>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => {
                    dispatch({ type: 'CLOSE_CANCEL_MODAL' });
                }}
                onConfirm={confirmCancellation}
                title="Cancelar Cita"
                message="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer."
            />
        </div>
    );
}

export default AppointmentsList;

