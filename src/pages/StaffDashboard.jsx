import React from 'react';
import './StaffDashboard.css';

const StaffDashboard = ({ userType, userData }) => {
    const isAdmin = userType === 'admin';
    const isDoctor = userType === 'doctor';

    return (
        <div className="staff-dashboard">
            <div className="dashboard-header">
                <h1>
                    {isAdmin && '👨‍💼 Panel Administrativo'}
                    {isDoctor && '👨‍⚕️ Panel Médico'}
                </h1>
                <p className="welcome-message">
                    Bienvenido(a), <strong>{userData?.nombre || 'Usuario'}</strong>
                </p>
            </div>

            <div className="dashboard-content">
                {isAdmin && (
                    <div className="admin-view">
                        <div className="dashboard-grid">
                            <div className="dashboard-card">
                                <div className="card-icon">📅</div>
                                <h3>Gestión de Citas</h3>
                                <p>Administra todas las citas programadas</p>
                                <button className="card-button">Ver Citas</button>
                            </div>

                            <div className="dashboard-card">
                                <div className="card-icon">👥</div>
                                <h3>Pacientes</h3>
                                <p>Gestiona la base de datos de pacientes</p>
                                <button className="card-button">Ver Pacientes</button>
                            </div>

                            <div className="dashboard-card">
                                <div className="card-icon">📊</div>
                                <h3>Reportes</h3>
                                <p>Consulta estadísticas y reportes</p>
                                <button className="card-button">Ver Reportes</button>
                            </div>

                            <div className="dashboard-card">
                                <div className="card-icon">⚙️</div>
                                <h3>Configuración</h3>
                                <p>Ajustes del sistema y usuarios</p>
                                <button className="card-button">Configurar</button>
                            </div>
                        </div>

                        <div className="recent-activity">
                            <h2>Actividad Reciente</h2>
                            <div className="activity-list">
                                <div className="activity-item">
                                    <span className="activity-time">Hace 5 min</span>
                                    <span className="activity-text">Nueva cita programada - Juan Pérez</span>
                                </div>
                                <div className="activity-item">
                                    <span className="activity-time">Hace 15 min</span>
                                    <span className="activity-text">Cita cancelada - María López</span>
                                </div>
                                <div className="activity-item">
                                    <span className="activity-time">Hace 1 hora</span>
                                    <span className="activity-text">Nuevo paciente registrado - Carlos Gómez</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isDoctor && (
                    <div className="doctor-view">
                        <div className="dashboard-grid">
                            <div className="dashboard-card">
                                <div className="card-icon">📋</div>
                                <h3>Citas del Día</h3>
                                <p>Revisa tu agenda de hoy</p>
                                <button className="card-button">Ver Agenda</button>
                            </div>

                            <div className="dashboard-card">
                                <div className="card-icon">🦷</div>
                                <h3>Historial Clínico</h3>
                                <p>Consulta historiales de pacientes</p>
                                <button className="card-button">Ver Historiales</button>
                            </div>

                            <div className="dashboard-card">
                                <div className="card-icon">📝</div>
                                <h3>Notas Médicas</h3>
                                <p>Registra diagnósticos y tratamientos</p>
                                <button className="card-button">Nueva Nota</button>
                            </div>

                            <div className="dashboard-card">
                                <div className="card-icon">💊</div>
                                <h3>Recetas</h3>
                                <p>Gestiona prescripciones médicas</p>
                                <button className="card-button">Ver Recetas</button>
                            </div>
                        </div>

                        <div className="today-appointments">
                            <h2>Citas de Hoy</h2>
                            <div className="appointments-list">
                                <div className="appointment-item">
                                    <span className="appointment-time">09:00 AM</span>
                                    <div className="appointment-details">
                                        <strong>Ana Martínez</strong>
                                        <span>Limpieza dental</span>
                                    </div>
                                </div>
                                <div className="appointment-item">
                                    <span className="appointment-time">10:30 AM</span>
                                    <div className="appointment-details">
                                        <strong>Roberto Silva</strong>
                                        <span>Extracción de muela</span>
                                    </div>
                                </div>
                                <div className="appointment-item">
                                    <span className="appointment-time">02:00 PM</span>
                                    <div className="appointment-details">
                                        <strong>Laura Hernández</strong>
                                        <span>Consulta general</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffDashboard;
