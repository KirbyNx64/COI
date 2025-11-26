import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
    const [scheduledAppointments, setScheduledAppointments] = useState([]);

    useEffect(() => {
        // Cargar citas programadas desde localStorage
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const scheduled = appointments.filter(apt => apt.status === 'programada');
        setScheduledAppointments(scheduled);
    }, []);

    return (
        <div className="home-page">
            <div className="container">
                {/* Sección Mi Cita */}
                <section className="my-appointments-section">
                    <h2 className="section-title">Mis Citas</h2>
                    {scheduledAppointments.length > 0 ? (
                        <div className="appointments-grid">
                            {scheduledAppointments.map((appointment) => (
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
                                        <span className="appointment-status">Programada</span>
                                    </div>
                                    <div className="appointment-details">
                                        <h3>{appointment.patientName}</h3>
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
                                    </div>
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
        </div>
    );
}

export default Home;
