import { useState, useEffect } from 'react';
import { getAllAppointments, updateAppointmentStatus, updateAppointment } from '../services/appointmentService';
import { getPatientById, getAllStaffMembers } from '../services/staffService';
import { createNotification } from '../services/notificationService';
import EditAppointmentModal from '../components/EditAppointmentModal';
import './StaffAppointments.css';

const StaffAppointments = ({ userType, userData }) => {
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
    const [notasMedico, setNotasMedico] = useState('');
    const [recetaMedica, setRecetaMedica] = useState('');
    const [diagnostico, setDiagnostico] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    // Assign Doctor State
    const [staffList, setStaffList] = useState([]);
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);
    const [showAssignDoctor, setShowAssignDoctor] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToastMessage = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 3000);
    };

    useEffect(() => {
        loadAppointments();
        loadStaff();
    }, []);

    const loadStaff = async () => {
        setIsLoadingStaff(true);
        const { staff, error } = await getAllStaffMembers();
        if (!error && staff) {
            setStaffList(staff);
        }
        setIsLoadingStaff(false);
    };

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
            if (userType !== 'admin' && userData) {
                const doctorId = userData.uid || userData.id;
                setAppointments(appointmentsData.filter(appt => appt.doctorId === doctorId));
            } else {
                setAppointments(appointmentsData);
            }
        }

        setIsLoading(false);
    };

    const applyFilters = () => {
        let filtered = [...appointments];

        // Helper for local date formatting e.g., 'YYYY-MM-DD'
        const getLocalDateString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Date filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = getLocalDateString(today);

        if (dateFilter === 'today') {
            filtered = filtered.filter(apt => apt.date === todayStr);
        } else if (dateFilter === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getLocalDateString(yesterday);
            filtered = filtered.filter(apt => apt.date === yesterdayStr);
        } else if (dateFilter === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = getLocalDateString(tomorrow);
            filtered = filtered.filter(apt => apt.date === tomorrowStr);
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
        setCurrentPage(1); // Reset to first page on search/filter
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAppointmentsSubset = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleViewDetails = async (appointment) => {
        setSelectedAppointment(appointment);
        setShowDetailModal(true);
        setShowAssignDoctor(false);
        setNotasMedico(appointment.notasMedico || '');
        setRecetaMedica(appointment.recetaMedica || '');
        setDiagnostico(appointment.diagnostico || '');

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
            showToastMessage('Error al actualizar el estado de la cita', 'error');
        } else {
            // Reload appointments to reflect changes
            await loadAppointments();
            setShowDetailModal(false);
            showToastMessage('Estado actualizado correctamente', 'success');
        }

        setIsUpdatingStatus(false);
    };

    const handleSaveNotasMedico = async () => {
        setIsSavingNotes(true);
        const { error } = await updateAppointment(selectedAppointment.id, {
            notasMedico,
            recetaMedica,
            diagnostico
        });

        if (error) {
            console.error('Error updating medical info:', error);
            showToastMessage('Error al guardar la información médica', 'error');
        } else {
            // Determine if a new prescription was added
            const hasNewPrescription = recetaMedica && recetaMedica.trim() !== '' && recetaMedica !== selectedAppointment.recetaMedica;

            // Determine if other notes (notes or diagnosis) were changed
            const notesChanged = (notasMedico !== selectedAppointment.notasMedico) ||
                (diagnostico !== selectedAppointment.diagnostico);

            // Send notifications to patient
            if (selectedAppointment.userId) {
                try {
                    const promises = [];

                    // Notification for prescription
                    if (hasNewPrescription) {
                        promises.push(createNotification(
                            selectedAppointment.userId,
                            'Nueva receta médica',
                            `El Dr. ha emitido una nueva receta médica en tu cita del ${selectedAppointment.date}.`,
                            'info',
                            '/mis-citas'
                        ));
                    }

                    // Notification for doctor's notes/diagnosis
                    if (notesChanged) {
                        promises.push(createNotification(
                            selectedAppointment.userId,
                            'Nuevas notas médicas',
                            `El Dr. ha agregado observaciones a tu cita del ${selectedAppointment.date}.`,
                            'info',
                            '/mis-citas'
                        ));
                    }

                    if (promises.length > 0) {
                        await Promise.all(promises);
                    }
                } catch (notifError) {
                    console.error('Error sending notifications:', notifError);
                }
            }

            // Update the selected appointment with new notes
            setSelectedAppointment({ ...selectedAppointment, notasMedico, recetaMedica, diagnostico });
            // Reload appointments to reflect changes
            await loadAppointments();
            showToastMessage('Información médica guardada exitosamente', 'success');
        }

        setIsSavingNotes(false);
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

    const handleAssignDoctor = () => {
        setShowAssignDoctor(true);
    };

    const handleSaveDoctor = async (doctorId, doctorName) => {
        setIsUpdatingStatus(true);
        const { error } = await updateAppointment(selectedAppointment.id, {
            doctorId,
            doctorName
        });

        if (error) {
            showToastMessage('Error al asignar el médico', 'error');
        } else {
            showToastMessage('Médico asignado correctamente', 'success');
            setSelectedAppointment({ ...selectedAppointment, doctorId, doctorName });
            setShowAssignDoctor(false);
            await loadAppointments();
        }
        setIsUpdatingStatus(false);
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
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        return dateStr === todayStr;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        const date = new Date(year, month - 1, day);
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
                    <svg className="appointments-page-title-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            <option value="yesterday">Ayer</option>
                            <option value="today">Hoy</option>
                            <option value="tomorrow">Mañana</option>
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

                        <button
                            onClick={loadAppointments}
                            className={`refresh-button ${isLoading ? 'spinning' : ''}`}
                            title="Actualizar datos"
                            disabled={isLoading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2v6h-6"></path>
                                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                                <path d="M3 22v-6h6"></path>
                                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                            </svg>
                        </button>
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
                            {currentAppointmentsSubset.map((app) => (
                                <tr
                                    key={app.id}
                                    className={isToday(app.date) ? 'today-appointment' : ''}
                                >
                                    <td data-label="Fecha">
                                        <div className="appointment-date">
                                            {isToday(app.date) && <span className="today-badge">HOY</span>}
                                            {formatDate(app.date)}
                                        </div>
                                    </td>
                                    <td data-label="Hora">
                                        <div className="appointment-time">{app.time}</div>
                                    </td>
                                    <td className="patient-name" data-label="Paciente">
                                        {app.patientName || 'N/A'}
                                    </td>
                                    <td data-label="Clínica">{getClinicaLabel(app.clinica)}</td>
                                    <td data-label="Motivo">{app.reason || 'N/A'}</td>
                                    <td data-label="Estado">
                                        <span className={`status-badge status-${app.status}`}>
                                            {getStatusLabel(app.status)}
                                        </span>
                                    </td>
                                    <td data-label="Acciones">
                                        <button
                                            onClick={() => handleViewDetails(app)}
                                            className="view-button"
                                        >
                                            Ver detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="apt-pagination">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="apt-pagination-btn"
                            >
                                &laquo; Anterior
                            </button>

                            <div className="apt-pagination-numbers">
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index + 1}
                                        onClick={() => paginate(index + 1)}
                                        className={`apt-pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="apt-pagination-btn"
                            >
                                Siguiente &raquo;
                            </button>
                        </div>
                    )}
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
                                    <div className="detail-item">
                                        <label>Médico Asignado:</label>
                                        <span style={{ fontWeight: 600, color: '#2c5282' }}>{selectedAppointment.doctorName || 'Sin asignar'}</span>
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
                                <h3>Sección Médica</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Receta Médica:</label>
                                        <textarea
                                            value={recetaMedica}
                                            onChange={(e) => setRecetaMedica(e.target.value)}
                                            placeholder="Ingresa la receta médica aquí..."
                                            rows="3"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '0.95rem',
                                                fontFamily: 'inherit',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Notas del Médico:</label>
                                        <textarea
                                            value={notasMedico}
                                            onChange={(e) => setNotasMedico(e.target.value)}
                                            placeholder="Agregar observaciones médicas..."
                                            rows="3"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '0.95rem',
                                                fontFamily: 'inherit',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Diagnóstico:</label>
                                        <textarea
                                            value={diagnostico}
                                            onChange={(e) => setDiagnostico(e.target.value)}
                                            placeholder="Ingresa el diagnóstico aquí..."
                                            rows="3"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '0.95rem',
                                                fontFamily: 'inherit',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveNotasMedico}
                                    disabled={isSavingNotes}
                                    className="edit-button"
                                    style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    {isSavingNotes ? 'Guardando...' : 'Guardar Información Médica'}
                                </button>
                            </div>

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
                            {userType === 'admin' && (
                                <button className="assign-button" onClick={handleAssignDoctor}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="8.5" cy="7" r="4"></circle>
                                        <line x1="20" y1="8" x2="20" y2="14"></line>
                                        <line x1="23" y1="11" x2="17" y2="11"></line>
                                    </svg>
                                    Asignar Médico
                                </button>
                            )}
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

            {/* Assign Doctor Modal */}
            {showAssignDoctor && selectedAppointment && userType === 'admin' && (
                <div className="modal-overlay" style={{ zIndex: 1050 }} onClick={() => setShowAssignDoctor(false)}>
                    <div className="modal-content appointment-detail-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Asignar Médico</h2>
                            <button className="modal-close" onClick={() => setShowAssignDoctor(false)}>
                                ×
                            </button>
                        </div>
                        <div className="appointment-detail-content">
                            {isLoadingStaff ? (
                                <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando médicos...</div>
                            ) : (
                                <div className="doctor-selection-grid">
                                    {staffList.map(doctor => (
                                        <div
                                            key={doctor.uid}
                                            className={`doctor-selection-card ${selectedAppointment.doctorId === doctor.uid ? 'active' : ''}`}
                                            onClick={() => handleSaveDoctor(doctor.uid, `${doctor.nombres} ${doctor.apellidos}`)}
                                        >
                                            <div className="doctor-avatar-circle">
                                                {doctor.photoURL ? (
                                                    <img src={doctor.photoURL} alt={doctor.nombres} />
                                                ) : (
                                                    <span>{doctor.nombres.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="doctor-info-text">
                                                <span className="doctor-name">{doctor.nombres} {doctor.apellidos}</span>
                                                {doctor.especialidad && <span className="doctor-specialty">{doctor.especialidad}</span>}
                                            </div>
                                            {selectedAppointment.doctorId === doctor.uid && (
                                                <span className="assigned-badge">Actual</span>
                                            )}
                                        </div>
                                    ))}
                                    {staffList.length === 0 && (
                                        <p className="no-doctors" style={{ padding: '2rem', textAlign: 'center' }}>No hay médicos disponibles.</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="close-button" onClick={() => setShowAssignDoctor(false)}>
                                Cancelar
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
            {/* Toast Notification */}
            {toast.show && (
                <div className={`toast-notification ${toast.type}`}>
                    <div className="toast-icon">
                        {toast.type === 'success' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        )}
                    </div>
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default StaffAppointments;
