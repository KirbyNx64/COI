import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getTodayAppointments } from '../services/appointmentService';
import { getAllPatients } from '../services/staffService';
import './StaffDashboard.css';

const StaffDashboard = ({ userType, userData }) => {
    const navigate = useNavigate();
    const isAdmin = userType === 'admin';
    const isDoctor = userType === 'doctor';

    const [stats, setStats] = useState(null);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);

        // Load statistics
        const { stats: dashboardStats, error: statsError } = await getDashboardStats();
        if (!statsError && dashboardStats) {
            setStats(dashboardStats);
        }

        // Load today's appointments
        const { appointments, error: appointmentsError } = await getTodayAppointments();
        if (!appointmentsError) {
            setTodayAppointments(appointments);
        }

        setLoading(false);
    };

    const formatTime = (time) => {
        return time;
    };

    return (
        <div className="staff-dashboard">
            <div className="dashboard-header">
                <h1>
                    {isAdmin && (
                        <>
                            <svg className="header-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Panel Administrativo
                        </>
                    )}
                    {isDoctor && (
                        <>
                            <svg className="header-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                            </svg>
                            Panel Médico
                        </>
                    )}
                </h1>
                <p className="welcome-message">
                    Bienvenido(a), <strong>{userData?.nombres} {userData?.apellidos}</strong>
                </p>
            </div>

            {loading ? (
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Cargando estadísticas...</p>
                </div>
            ) : (
                <>
                    {/* KPI Cards Section */}
                    <div className="kpi-section">
                        <h2 className="section-title">Resumen General</h2>
                        <div className="kpi-grid">
                            {/* Total Patients */}
                            <div className="kpi-card kpi-patients">
                                <div className="kpi-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </div>
                                <div className="kpi-content">
                                    <p className="kpi-label">Total Pacientes</p>
                                    <p className="kpi-value">{stats?.totalPatients || 0}</p>
                                </div>
                            </div>

                            {/* Active Appointments */}
                            <div className="kpi-card kpi-active">
                                <div className="kpi-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </div>
                                <div className="kpi-content">
                                    <p className="kpi-label">Citas Programadas</p>
                                    <p className="kpi-value">{stats?.scheduledAppointments || 0}</p>
                                </div>
                            </div>

                            {/* Today's Appointments */}
                            <div className="kpi-card kpi-today">
                                <div className="kpi-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </div>
                                <div className="kpi-content">
                                    <p className="kpi-label">Citas de Hoy</p>
                                    <p className="kpi-value">{stats?.todayAppointments || 0}</p>
                                </div>
                            </div>

                            {/* Completed Appointments */}
                            <div className="kpi-card kpi-completed">
                                <div className="kpi-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                </div>
                                <div className="kpi-content">
                                    <p className="kpi-label">Citas Completadas</p>
                                    <p className="kpi-value">{stats?.completedAppointments || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Section */}
                    <div className="quick-access-section">
                        <h2 className="section-title">Accesos Rápidos</h2>
                        <div className="quick-access-grid">
                            <button
                                className="quick-access-card"
                                onClick={() => navigate('/staff/appointments')}
                            >
                                <div className="quick-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </div>
                                <h3>Ver Todas las Citas</h3>
                                <p>Gestionar y revisar todas las citas programadas</p>
                            </button>

                            <button
                                className="quick-access-card"
                                onClick={() => navigate('/staff/patients')}
                            >
                                <div className="quick-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </div>
                                <h3>Gestión de Pacientes</h3>
                                <p>Ver y administrar información de pacientes</p>
                            </button>

                            <button
                                className="quick-access-card"
                                onClick={() => navigate('/staff/appointments')}
                            >
                                <div className="quick-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                </div>
                                <h3>Nueva Cita</h3>
                                <p>Programar una nueva cita para un paciente</p>
                            </button>
                        </div>
                    </div>

                    {/* Today's Appointments Section */}
                    {todayAppointments.length > 0 && (
                        <div className="today-appointments-section">
                            <h2 className="section-title">Citas de Hoy</h2>
                            <div className="appointments-list">
                                {todayAppointments.map((appointment) => (
                                    <div key={appointment.id} className="appointment-card">
                                        <div className="appointment-time">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                            <span>{formatTime(appointment.time)}</span>
                                        </div>
                                        <div className="appointment-details">
                                            <h4>{appointment.patientName}</h4>
                                            <p className="appointment-reason">{appointment.reason}</p>
                                            <p className="appointment-clinic">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                    <circle cx="12" cy="10" r="3"></circle>
                                                </svg>
                                                {appointment.clinica}
                                            </p>
                                        </div>
                                        <div className="appointment-status">
                                            <span className="status-badge status-programada">Programada</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StaffDashboard;

