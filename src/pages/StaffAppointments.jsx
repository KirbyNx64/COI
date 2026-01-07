import { useState, useEffect } from 'react';
import { getAllAppointments, updateAppointmentStatus } from '../services/appointmentService';
import { getPatientById } from '../services/staffService';
import EditAppointmentModal from '../components/EditAppointmentModal';
import './StaffAppointments.css';

const StaffAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week'
    const [statusFilter, setStatusFilter] = useState('all');
    const [clinicFilter, setClinicFilter] = useState('all');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    useEffect(() => {
        loadAppointments();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [appointments, searchTerm, dateFilter, statusFilter, clinicFilter]);

    // Block body scroll when modal is open
    useEffect(() => {
        if (showDetailModal || showEditModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to restore scroll when component unmounts
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showDetailModal, showEditModal]);

    const loadAppointments = async () => {
        setIsLoading(true);
        setError('');

        const { appointments: appointmentsData, error: loadError } = await getAllAppointments();

        if (loadError) {
            setError('Error al cargar las citas. Verifica los permisos de Firestore.');
            console.error('Error loading appointments:', loadError);
        } else {
            setAppointments(appointmentsData);
        }

        setIsLoading(false);
    };

    const applyFilters = () => {
        let filtered = [...appointments];

        // Date filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        if (dateFilter === 'today') {
            filtered = filtered.filter(apt => apt.date === todayStr);
        } else if (dateFilter === 'week') {
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            filtered = filtered.filter(apt => {
                const aptDate = new Date(apt.date);
                return aptDate >= today && aptDate <= weekFromNow;
            });
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }

        // Clinic filter
        if (clinicFilter !== 'all') {
            filtered = filtered.filter(apt => apt.clinica === clinicFilter);
        }

        // Search filter
        if (searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(apt => {
                const patientName = (apt.patientName || '').toLowerCase();
                const reason = (apt.reason || '').toLowerCase();
                return patientName.includes(searchLower) || reason.includes(searchLower);
            });
        }

        setFilteredAppointments(filtered);
    };

    const handleViewDetails = async (appointment) => {
        setSelectedAppointment(appointment);
        setShowDetailModal(true);

        // Load patient details
        const { patient, error } = await getPatientById(appointment.userId);
        if (!error && patient) {
            setPatientDetails(patient);
        }
    };

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        setIsUpdatingStatus(true);
        const { error } = await updateAppointmentStatus(appointmentId, newStatus);

        if (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar el estado de la cita');
        } else {
            // Reload appointments to reflect changes
            await loadAppointments();
            setShowDetailModal(false);
        }

        setIsUpdatingStatus(false);
    };

    const handleEditAppointment = () => {
        setShowDetailModal(false);
        setShowEditModal(true);
    };

    const handleEditSuccess = async () => {
        setShowEditModal(false);
        setShowDetailModal(false);
        await loadAppointments();
    };

    const handleEditCancel = () => {
        setShowEditModal(false);
        setShowDetailModal(true);
    };

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

    const isToday = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        return dateStr === todayStr;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-SV', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="staff-appointments">
            <div className="appointments-header">
                <h1>
                    <svg className="header-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Gestión de Citas
                </h1>
                <p className="subtitle">Administra todas las citas del sistema</p>
            </div>

            <div className="appointments-filters">
                <div className="filter-row">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Buscar por paciente o motivo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </div>

                    <div className="filter-group">
                        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="filter-select">
                            <option value="all">Todas las fechas</option>
                            <option value="today">Hoy</option>
                            <option value="week">Esta semana</option>
                        </select>

                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                            <option value="all">Todos los estados</option>
                            <option value="programada">Programada</option>
                            <option value="terminada">Terminada</option>
                            <option value="cancelada">Cancelada</option>
                            <option value="perdida">Perdida</option>
                        </select>

                        <select value={clinicFilter} onChange={(e) => setClinicFilter(e.target.value)} className="filter-select">
                            <option value="all">Todas las clínicas</option>
                            <option value="santa-tecla">Santa Tecla</option>
                            <option value="soyapango">Soyapango</option>
                            <option value="san-martin">San Martín</option>
                            <option value="escalon">Escalón</option>
                            <option value="usulutan">Usulután</option>
                        </select>
                    </div>
                </div>

                <div className="appointments-count">
                    {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''}
                </div>
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Cargando citas...</p>
                </div>
            ) : error ? (
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button onClick={loadAppointments} className="retry-button">
                        Reintentar
                    </button>
                </div>
            ) : filteredAppointments.length === 0 ? (
                <div className="empty-state">
                    <p>No se encontraron citas</p>
                </div>
            ) : (
                <div className="appointments-table-container">
                    <table className="appointments-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Paciente</th>
                                <th>Clínica</th>
                                <th>Motivo</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.map((appointment) => (
                                <tr
                                    key={appointment.id}
                                    className={isToday(appointment.date) ? 'today-appointment' : ''}
                                >
                                    <td className="appointment-date">
                                        {isToday(appointment.date) && (
                                            <span className="today-badge">HOY</span>
                                        )}
                                        {appointment.date}
                                    </td>
                                    <td>{appointment.time}</td>
                                    <td className="patient-name">{appointment.patientName || 'N/A'}</td>
                                    <td>{getClinicaLabel(appointment.clinica)}</td>
                                    <td>{appointment.reason || 'N/A'}</td>
                                    <td>
                                        <span className={`status-badge status-${appointment.status}`}>
                                            {getStatusLabel(appointment.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleViewDetails(appointment)}
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

            {/* Appointment Detail Modal */}
            {showDetailModal && selectedAppointment && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content appointment-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detalles de la Cita</h2>
                            <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                                ×
                            </button>
                        </div>

                        <div className="appointment-detail-content">
                            <div className="detail-section">
                                <h3>Información de la Cita</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Fecha:</label>
                                        <span>{formatDate(selectedAppointment.date)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Hora:</label>
                                        <span>{selectedAppointment.time}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Clínica:</label>
                                        <span>{getClinicaLabel(selectedAppointment.clinica)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Estado:</label>
                                        <span className={`status-badge status-${selectedAppointment.status}`}>
                                            {getStatusLabel(selectedAppointment.status)}
                                        </span>
                                    </div>
                                    <div className="detail-item full-width">
                                        <label>Motivo:</label>
                                        <span>{selectedAppointment.reason || 'No especificado'}</span>
                                    </div>
                                    {selectedAppointment.notas && (
                                        <div className="detail-item full-width">
                                            <label>Notas:</label>
                                            <span>{selectedAppointment.notas}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {patientDetails && (
                                <div className="detail-section">
                                    <h3>Información del Paciente</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <label>Nombre:</label>
                                            <span>{patientDetails.nombres} {patientDetails.apellidos}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Email:</label>
                                            <span>{patientDetails.email}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Teléfono:</label>
                                            <span>{patientDetails.telefono || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>DUI:</label>
                                            <span>{patientDetails.dui || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="detail-section">
                                <h3>Actualizar Estado</h3>
                                <div className="status-buttons">
                                    <button
                                        onClick={() => handleStatusUpdate(selectedAppointment.id, 'programada')}
                                        className={`status-update-btn status-programada ${selectedAppointment.status === 'programada' ? 'active' : ''}`}
                                        disabled={isUpdatingStatus}
                                    >
                                        Programada
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedAppointment.id, 'terminada')}
                                        className={`status-update-btn status-terminada ${selectedAppointment.status === 'terminada' ? 'active' : ''}`}
                                        disabled={isUpdatingStatus}
                                    >
                                        Terminada
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedAppointment.id, 'cancelada')}
                                        className={`status-update-btn status-cancelada ${selectedAppointment.status === 'cancelada' ? 'active' : ''}`}
                                        disabled={isUpdatingStatus}
                                    >
                                        Cancelada
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedAppointment.id, 'perdida')}
                                        className={`status-update-btn status-perdida ${selectedAppointment.status === 'perdida' ? 'active' : ''}`}
                                        disabled={isUpdatingStatus}
                                    >
                                        Perdida
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="edit-button" onClick={handleEditAppointment}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Editar Cita
                            </button>
                            <button className="close-button" onClick={() => setShowDetailModal(false)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Appointment Modal */}
            {showEditModal && selectedAppointment && (
                <EditAppointmentModal
                    appointment={selectedAppointment}
                    onSuccess={handleEditSuccess}
                    onCancel={handleEditCancel}
                />
            )}
        </div>
    );
};

export default StaffAppointments;
