import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import './Home.css';

function Home() {
    const navigate = useNavigate();
    const [scheduledAppointments, setScheduledAppointments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Cargar datos del usuario actual
        const storedUser = localStorage.getItem('userData');
        if (storedUser) {
            setUserData(JSON.parse(storedUser));
        }

        // Cargar citas programadas desde localStorage
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');

        // Ordenar citas por fecha y hora (más próxima primero)
        const sortedAppointments = appointments.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB; // Orden ascendente (más próxima primero)
        });

        setScheduledAppointments(sortedAppointments);
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

    const handleCancelAppointment = (appointmentId) => {
        setAppointmentToCancel(appointmentId);
        setIsModalOpen(true);
    };

    const confirmCancellation = () => {
        if (!appointmentToCancel) return;

        // Obtener citas del localStorage
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');

        // Actualizar el estado de la cita
        const updatedAppointments = appointments.map(apt =>
            apt.id === appointmentToCancel ? { ...apt, status: 'cancelada' } : apt
        );

        // Guardar en localStorage
        localStorage.setItem('appointments', JSON.stringify(updatedAppointments));

        // Ordenar citas actualizadas (más próxima primero)
        const sortedAppointments = updatedAppointments.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB; // Orden ascendente (más próxima primero)
        });

        // Actualizar estado local
        setScheduledAppointments(sortedAppointments);

        // Cerrar modal y limpiar estado
        setIsModalOpen(false);
        setAppointmentToCancel(null);
    };

    const handleEditAppointment = (appointment) => {
        // Navegar al formulario con los datos de la cita
        navigate('/cita', { state: { editingAppointment: appointment } });
    };

    return (
        <div className="home-page">
            <div className="container">
                {/* Sección Mi Cita */}
                <section className="my-appointments-section">
                    <div className="section-header">
                        <h2 className="section-title">Mis Citas</h2>
                        {scheduledAppointments.length > 3 && (
                            <Link to="/mis-citas" className="view-more-button">
                                Ver todas
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </Link>
                        )}
                    </div>
                    {scheduledAppointments.length > 0 ? (
                        <>
                            <div className="appointments-grid">
                                {scheduledAppointments.slice(0, 3).map((appointment) => (
                                    <div key={appointment.id} className="appointment-card">
                                        <div className="appointment-header">
                                            <div className="appointment-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                            </div>
                                            <span className={`appointment-status status-${appointment.status}`}>
                                                {getStatusLabel(appointment.status)}
                                            </span>
                                        </div>
                                        <div className="appointment-details">
                                            <h3>Paciente: {userData ? `${userData.nombres} ${userData.apellidos}`.trim() : 'Usuario'}</h3>
                                            <div className="appointment-info">
                                                <div className="info-item">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                                    </svg>
                                                    <span>{appointment.date}</span>
                                                </div>
                                                <div className="info-item">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                    </svg>
                                                    <span>{appointment.time}</span>
                                                </div>
                                            </div>
                                            {appointment.reason && (
                                                <p className="appointment-reason">
                                                    <strong>Motivo:</strong> {appointment.reason}
                                                </p>
                                            )}
                                            {appointment.clinica && (
                                                <p className="appointment-reason">
                                                    <strong>Clínica:</strong> {getClinicaLabel(appointment.clinica)}
                                                </p>
                                            )}
                                        </div>

                                        {/* Botones de acción - solo para citas programadas */}
                                        {appointment.status === 'programada' && (
                                            <div className="appointment-actions">
                                                <button
                                                    className="btn-action btn-edit"
                                                    onClick={() => handleEditAppointment(appointment)}
                                                    title="Editar cita"
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
                                                    title="Cancelar cita"
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
                                ))}
                            </div>
                        </>
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
                            <Link to="/cita" className="cta-button">
                                Agendar Cita
                            </Link>
                        </div>
                    )}
                </section>

                {/* Sección Historial Clínico */}
                <section className="medical-history-section">
                    <h2 className="section-title">Historial Clínico</h2>
                    <div className="content-card">
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <div className="card-content">
                            <h3>Tu Historial Médico</h3>
                            <p>Aquí podrás consultar tu historial clínico completo, incluyendo diagnósticos, tratamientos realizados y notas del doctor.</p>
                            <button className="secondary-button" disabled>
                                Próximamente disponible
                            </button>
                        </div>
                    </div>
                </section>

                {/* Sección Recetas */}
                <section className="prescriptions-section">
                    <h2 className="section-title">Recetas</h2>
                    <div className="content-card">
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="12" y1="18" x2="12" y2="12"></line>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                            </svg>
                        </div>
                        <div className="card-content">
                            <h3>Tus Recetas Médicas</h3>
                            <p>Accede a todas tus recetas médicas, medicamentos prescritos y recomendaciones del doctor.</p>
                            <button className="secondary-button" disabled>
                                Próximamente disponible
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setAppointmentToCancel(null);
                }}
                onConfirm={confirmCancellation}
                title="Cancelar Cita"
                message="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer."
            />
        </div>
    );
}

export default Home;
