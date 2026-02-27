import { useReducer, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { subscribeToUserAppointments, updateAppointmentStatus } from '../services/appointmentService';
import { generateAppointmentPDF } from '../utils/pdfGenerator';
import ConfirmationModal from '../components/ConfirmationModal';
import PrescriptionModal from '../components/Home/PrescriptionModal';
import HistoryModal from '../components/Home/HistoryModal';
import './Home.css';

const initialState = {
    allAppointments: [],
    scheduledAppointments: [],
    isCancelModalOpen: false,
    appointmentToCancel: null,
    isLoading: true,
    showPrescriptionModal: false,
    showHistoryModal: false
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_APPOINTMENTS':
            const activeAppointments = action.payload
                .filter(app => app.status === 'programada')
                .sort((a, b) => {
                    const dateA = new Date(`${a.date} ${a.time}`);
                    const dateB = new Date(`${b.date} ${b.time}`);
                    return dateA - dateB;
                });
            return {
                ...state,
                allAppointments: action.payload,
                scheduledAppointments: activeAppointments,
                isLoading: false
            };
        case 'TOGGLE_CANCEL_MODAL':
            return {
                ...state,
                isCancelModalOpen: action.isOpen,
                appointmentToCancel: action.appointmentId || null
            };
        case 'TOGGLE_PRESCRIPTION_MODAL':
            return { ...state, showPrescriptionModal: action.payload };
        case 'TOGGLE_HISTORY_MODAL':
            return { ...state, showHistoryModal: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        default:
            return state;
    }
}

function Home() {
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        allAppointments, scheduledAppointments, isCancelModalOpen,
        appointmentToCancel, isLoading, showPrescriptionModal, showHistoryModal
    } = state;

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
        }

        const unsubscribe = subscribeToUserAppointments(user.uid, (appointments) => {
            dispatch({ type: 'SET_APPOINTMENTS', payload: appointments });
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const isAnyModalOpen = showPrescriptionModal || showHistoryModal || isCancelModalOpen;
        document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [showPrescriptionModal, showHistoryModal, isCancelModalOpen]);

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

    const confirmCancellation = async () => {
        if (!appointmentToCancel) return;
        const { error } = await updateAppointmentStatus(appointmentToCancel, 'cancelada');
        if (error) {
            alert('Error al cancelar la cita. Por favor, intenta de nuevo.');
        }
        dispatch({ type: 'TOGGLE_CANCEL_MODAL', isOpen: false });
    };

    const handleDownloadReceipt = async (appointment) => {
        const result = await generateAppointmentPDF(appointment, true);
        if (!result.success) {
            alert('Hubo un error al generar el comprobante. Por favor intenta de nuevo.');
        }
    };

    const nextAppointment = scheduledAppointments[0];

    return (
        <div className="home-page">
            <div className="container">
                <section className="my-appointments-section">
                    <div className="section-header">
                        <h2 className="section-title">Próxima Cita</h2>
                        <Link to="/mis-citas" className="view-more-button">
                            Ver todas
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="loading-state-container">
                            <div className="spinner"></div>
                            <p>Cargando citas...</p>
                        </div>
                    ) : nextAppointment ? (
                        <div className="appointments-grid">
                            <div className="appointment-card">
                                <div className="appointment-header">
                                    <div className="appointment-header-left">
                                        <div className="appointment-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                        </div>
                                        <button
                                            className="download-receipt-btn"
                                            onClick={() => handleDownloadReceipt(nextAppointment)}
                                            title="Descargar comprobante"
                                            aria-label="Descargar comprobante en PDF"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 15L12 3M12 15L8 11M12 15L16 11M2 17L2 18C2 19.6569 3.34315 21 5 21L19 21C20.6569 21 22 19.6569 22 18L22 17"></path>
                                            </svg>
                                        </button>
                                    </div>
                                    <span className={`appointment-status status-${nextAppointment.status}`}>
                                        {getStatusLabel(nextAppointment.status)}
                                    </span>
                                </div>
                                <div className="appointment-details">
                                    <h3>Paciente: {nextAppointment.patientName || 'Usuario'}</h3>
                                    <div className="appointment-info">
                                        <div className="info-item">
                                            <CalendarIcon />
                                            <span>{nextAppointment.date}</span>
                                        </div>
                                        <div className="info-item">
                                            <ClockIcon />
                                            <span>{nextAppointment.time}</span>
                                        </div>
                                    </div>
                                    <DetailRow label="Motivo" value={nextAppointment.reason} />
                                    <DetailRow label="Clínica" value={getClinicaLabel(nextAppointment.clinica)} />
                                    {nextAppointment.notas?.trim() && <DetailRow label="Notas" value={nextAppointment.notas} className="appointment-notes" />}

                                    <DoctorNotes notes={nextAppointment.notasMedico} />
                                    <PrescriptionBox recipe={nextAppointment.recetaMedica} />
                                </div>

                                <div className="appointment-actions">
                                    <button
                                        className="btn-action btn-edit"
                                        onClick={() => navigate('/cita', { state: { editingAppointment: nextAppointment } })}
                                    >
                                        <EditIcon />
                                        Editar
                                    </button>
                                    <button
                                        className="btn-action btn-cancel"
                                        onClick={() => dispatch({ type: 'TOGGLE_CANCEL_MODAL', isOpen: true, appointmentId: nextAppointment.id })}
                                    >
                                        <CancelIcon />
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <EmptyState />
                    )}
                </section>

                <SectionCard
                    title="Recetas"
                    icon={<PrescriptionIcon />}
                    description="Accede a todas tus recetas médicas, medicamentos prescritos y recomendaciones del doctor."
                    buttonLabel={allAppointments.some(app => app.recetaMedica) ? "Ver Receta Actual" : "No hay recetas disponibles"}
                    buttonDisabled={!allAppointments.some(app => app.recetaMedica)}
                    onClick={() => dispatch({ type: 'TOGGLE_PRESCRIPTION_MODAL', payload: true })}
                    variant="prescriptions"
                />

                <SectionCard
                    title="Historial Clínico"
                    icon={<HistoryIcon />}
                    description="Aquí podrás consultar tu historial clínico completo, incluyendo diagnósticos, tratamientos realizados y notas del doctor."
                    buttonLabel="Ver Mi Historial"
                    onClick={() => dispatch({ type: 'TOGGLE_HISTORY_MODAL', payload: true })}
                    variant="history"
                />
            </div>

            <ConfirmationModal
                isOpen={isCancelModalOpen}
                onClose={() => dispatch({ type: 'TOGGLE_CANCEL_MODAL', isOpen: false })}
                onConfirm={confirmCancellation}
                title="Cancelar Cita"
                message="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer."
            />

            <PrescriptionModal
                isOpen={showPrescriptionModal}
                onClose={() => dispatch({ type: 'TOGGLE_PRESCRIPTION_MODAL', payload: false })}
                appointments={allAppointments}
            />

            <HistoryModal
                isOpen={showHistoryModal}
                onClose={() => dispatch({ type: 'TOGGLE_HISTORY_MODAL', payload: false })}
                appointments={allAppointments}
                getClinicaLabel={getClinicaLabel}
            />
        </div>
    );
}

// Internal Small Components
const DetailRow = ({ label, value, className = "" }) => value ? (
    <p className={`appointment-reason ${className}`}>
        <strong>{label}:</strong> {value}
    </p>
) : null;

const DoctorNotes = ({ notes }) => notes?.trim() ? (
    <div className="appointment-doctor-notes">
        <strong>Notas del Médico:</strong>
        <p>{notes}</p>
    </div>
) : null;

const PrescriptionBox = ({ recipe }) => recipe?.trim() ? (
    <div className="appointment-prescription">
        <strong>Receta Médica:</strong>
        <pre>{recipe}</pre>
    </div>
) : null;

const SectionCard = ({ title, icon, description, buttonLabel, onClick, buttonDisabled, variant }) => (
    <section className={`${variant}-section`}>
        <h2 className="section-title">{title}</h2>
        <div className={`content-card ${variant}-card-new`}>
            <div className={`card-icon icon-${variant}-new`}>{icon}</div>
            <div className="card-content">
                <h3>{variant === 'prescriptions' ? 'Tus Recetas Médicas' : 'Tu Historial Médico'}</h3>
                <p>{description}</p>
                <button
                    className={buttonDisabled ? "secondary-button" : "cta-button"}
                    onClick={onClick}
                    disabled={buttonDisabled}
                >
                    {buttonLabel}
                </button>
            </div>
        </div>
    </section>
);

const EmptyState = () => (
    <div className="empty-state-card-new">
        <div className="empty-icon-box-new"><CalendarIcon size={48} /></div>
        <h3>No tienes citas programadas</h3>
        <p>Agenda tu próxima cita con nosotros</p>
        <Link to="/cita" className="cta-button-primary-new">Agendar Cita</Link>
    </div>
);

// Icons
const CalendarIcon = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const PrescriptionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
    </svg>
);

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const CancelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
);

export default Home;
