import { useState, useEffect, useRef } from 'react';
import { getFilteredAppointments, updateAppointmentStatus, updateAppointment, getAppointmentsByDui } from '../services/appointmentService';
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
    const [dateFilter, setDateFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [clinicFilter, setClinicFilter] = useState('all');
    const [assignmentFilter, setAssignmentFilter] = useState('all'); // 'all', 'assigned', 'unassigned'
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

    // DUI search state
    const [isDuiMode, setIsDuiMode] = useState(false);
    const duiSearchTimeout = useRef(null);

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
        if (!isDuiMode) {
            loadFilteredAppointments();
        }
    }, [dateFilter, statusFilter, clinicFilter, assignmentFilter, isDuiMode]);

    // DUI format detector: ########-#
    const isDuiFormat = (text) => /^\d{8}-\d$/.test(text.trim());

    // Handle DUI search button / Enter key
    const handleDuiSearch = async () => {
        const trimmed = searchTerm.trim();
        if (!isDuiFormat(trimmed)) return;

        setIsLoading(true);
        const { appointments: duiResults, error } = await getAppointmentsByDui(trimmed);
        setIsLoading(false);

        if (error) {
            showToastMessage('Error al buscar por DUI. Intenta de nuevo.', 'error');
            return;
        }

        setIsDuiMode(true);
        setFilteredAppointments(duiResults);
        setCurrentPage(1);
    };

    // Auto-format DUI input: ########-#  (max 10 chars)
    const formatDuiInput = (value) => {
        const digits = value.replace(/\D/g, '').slice(0, 9);
        if (digits.length > 8) {
            return `${digits.slice(0, 8)}-${digits.slice(8)}`;
        }
        return digits;
    };

    // Reset DUI mode when search term is cleared
    const handleSearchChange = (e) => {
        const formatted = formatDuiInput(e.target.value);
        setSearchTerm(formatted);
        if (!formatted) {
            setIsDuiMode(false);
        }
    };

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

    const loadFilteredAppointments = async (force = false, overrides = null) => {
        if (isDuiMode && !force) return; // DUI search manages its own state
        setIsLoading(true);
        setError('');

        const currentStatus = overrides ? overrides.statusFilter : statusFilter;
        const currentClinic = overrides ? overrides.clinicFilter : clinicFilter;
        const currentDate = overrides ? overrides.dateFilter : dateFilter;
        const currentAssignment = overrides ? overrides.assignmentFilter : assignmentFilter;

        const doctorId = userData?.uid || userData?.id;
        const { appointments: data, error: loadError } = await getFilteredAppointments({
            statusFilter: currentStatus,
            clinicFilter: currentClinic,
            dateFilter: currentDate,
            doctorId,
            userType
        });

        if (loadError) {
            setError('Error al cargar las citas. Verifica los permisos de Firestore.');
            console.error('Error loading filtered appointments:', loadError);
            setIsLoading(false);
            return;
        }

        // Apply client-side filters: assignment
        let filtered = [...data];

        if (currentAssignment === 'assigned') {
            filtered = filtered.filter(apt => !!apt.doctorId);
        } else if (currentAssignment === 'unassigned') {
            filtered = filtered.filter(apt => !apt.doctorId);
        }

        setFilteredAppointments(filtered);
        setCurrentPage(1);
        setIsLoading(false);
    };

    // No auto-reload on searchTerm — search is manual (button / Enter)

    const loadStaff = async () => {
        setIsLoadingStaff(true);
        const { staff, error } = await getAllStaffMembers();
        if (!error && staff) {
            setStaffList(staff);
        }
        setIsLoadingStaff(false);
    };

    // Initial load
    useEffect(() => {
        loadFilteredAppointments();
        loadStaff();
    }, []);

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
            await loadFilteredAppointments();
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
            await loadFilteredAppointments();
            showToastMessage('Información médica guardada exitosamente', 'success');
        }

        setIsSavingNotes(false);
    };

    const handleEditAppointment = () => {
        // Ambos cambios se agrupan en un solo re-render (React 18 auto-batch)
        setShowDetailModal(false);
        setShowEditModal(true);
    };

    const handleEditSuccess = async () => {
        setShowEditModal(false);
        setShowDetailModal(false);
        await loadFilteredAppointments();
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
            await loadFilteredAppointments();
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
                            placeholder="Buscar por DUI"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleDuiSearch()}
                            className={`search-input ${isDuiMode ? 'dui-search-active' : ''}`}
                        />
                        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        {searchTerm && (
                            <button
                                className="dui-clear-btn"
                                onClick={() => {
                                    setSearchTerm('');
                                    setIsDuiMode(false);
                                }}
                                title="Limpiar búsqueda"
                            >
                                ✕
                            </button>
                        )}
                        <button
                            className="dui-search-btn"
                            onClick={handleDuiSearch}
                            disabled={isLoading}
                            title="Buscar por DUI en servidor"
                        >
                            {isLoading ? '...' : 'Buscar DUI'}
                        </button>
                    </div>

                    <div className="filter-group">
                        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="filter-select">
                            <option value="all">Últimos 3 meses</option>
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

                        {userType === 'admin' && (
                            <select value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value)} className="filter-select">
                                <option value="all">Todas</option>
                                <option value="assigned">Asignadas</option>
                                <option value="unassigned">Sin asignar</option>
                            </select>
                        )}

                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setDateFilter('all');
                                setStatusFilter('all');
                                setClinicFilter('all');
                                setAssignmentFilter('all');
                                setIsDuiMode(false);
                            }}
                            className="clear-filters-button"
                            title="Limpiar todos los filtros"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Limpiar
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
                    <button onClick={loadFilteredAppointments} className="retry-button">
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
                                    className={`
                                        ${isToday(app.date) ? 'today-appointment' : ''}
                                        ${userType === 'admin' && !app.doctorId ? 'unassigned-appointment' : ''}
                                    `.trim()}
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
                                        <div className="unassigned-badge-container">
                                            <span className={`status-badge status-${app.status}`}>
                                                {getStatusLabel(app.status)}
                                            </span>
                                            {userType === 'admin' && !app.doctorId && (
                                                <span className="unassigned-inline-badge">
                                                    Sin Asignar
                                                </span>
                                            )}
                                        </div>
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
                <div className="dam-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="dam-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dam-header">
                            <h2>Detalles de la Cita</h2>
                            <button className="dam-close" onClick={() => setShowDetailModal(false)}>
                                ×
                            </button>
                        </div>

                        <div className="dam-body">
                            {/* Información de la cita */}
                            <div className="dam-section">
                                <h3>Información de la Cita</h3>
                                <div className="dam-grid">
                                    <div className="dam-field">
                                        <label>Fecha</label>
                                        <span>{formatDate(selectedAppointment.date)}</span>
                                    </div>
                                    <div className="dam-field">
                                        <label>Hora</label>
                                        <span>{selectedAppointment.time}</span>
                                    </div>
                                    <div className="dam-field">
                                        <label>Clínica</label>
                                        <span>{getClinicaLabel(selectedAppointment.clinica)}</span>
                                    </div>
                                    <div className="dam-field">
                                        <label>Estado</label>
                                        <span className={`status-badge status-${selectedAppointment.status}`}>
                                            {getStatusLabel(selectedAppointment.status)}
                                        </span>
                                    </div>
                                    <div className="dam-field">
                                        <label>Médico Asignado</label>
                                        <span style={{ fontWeight: 600, color: '#2c5282' }}>
                                            {selectedAppointment.doctorName || 'Sin asignar'}
                                        </span>
                                    </div>
                                    <div className="dam-field dam-full">
                                        <label>Motivo</label>
                                        <span>{selectedAppointment.reason || 'No especificado'}</span>
                                    </div>
                                    {selectedAppointment.notas && (
                                        <div className="dam-field dam-full">
                                            <label>Notas del Paciente</label>
                                            <span>{selectedAppointment.notas}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Información del paciente */}
                            {patientDetails && (
                                <div className="dam-section">
                                    <h3>Información del Paciente</h3>
                                    <div className="dam-grid">
                                        <div className="dam-field">
                                            <label>Nombre</label>
                                            <span>{patientDetails.nombres} {patientDetails.apellidos}</span>
                                        </div>
                                        <div className="dam-field">
                                            <label>Email</label>
                                            <span>{patientDetails.email}</span>
                                        </div>
                                        <div className="dam-field">
                                            <label>Teléfono</label>
                                            <span>{patientDetails.telefono || 'N/A'}</span>
                                        </div>
                                        <div className="dam-field">
                                            <label>DUI</label>
                                            <span>{patientDetails.dui || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sección médica */}
                            <div className="dam-section">
                                <h3>Sección Médica</h3>
                                <div className="dam-medical-grid">
                                    <div className="dam-medical-field">
                                        <label>Receta Médica</label>
                                        <textarea
                                            value={recetaMedica}
                                            onChange={(e) => setRecetaMedica(e.target.value)}
                                            placeholder="Ingresa la receta médica aquí..."
                                            rows="3"
                                        />
                                    </div>
                                    <div className="dam-medical-field">
                                        <label>Notas del Médico</label>
                                        <textarea
                                            value={notasMedico}
                                            onChange={(e) => setNotasMedico(e.target.value)}
                                            placeholder="Agregar observaciones médicas..."
                                            rows="3"
                                        />
                                    </div>
                                    <div className="dam-medical-field">
                                        <label>Diagnóstico</label>
                                        <textarea
                                            value={diagnostico}
                                            onChange={(e) => setDiagnostico(e.target.value)}
                                            placeholder="Ingresa el diagnóstico aquí..."
                                            rows="3"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveNotasMedico}
                                    disabled={isSavingNotes || (!recetaMedica.trim() && !notasMedico.trim() && !diagnostico.trim())}
                                    className="dam-save-notes-btn"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    {isSavingNotes ? 'Guardando...' : 'Guardar Información Médica'}
                                </button>
                            </div>

                            {/* Actualizar estado */}
                            <div className="dam-section">
                                <h3>Actualizar Estado</h3>
                                <div className="dam-status-grid">
                                    <button
                                        onClick={() => handleStatusUpdate(selectedAppointment.id, 'programada')}
                                        className={`dam-status-btn status-programada ${selectedAppointment.status === 'programada' ? 'active' : ''}`}
                                        disabled={isUpdatingStatus}
                                    >
                                        Programada
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedAppointment.id, 'terminada')}
                                        className={`dam-status-btn status-terminada ${selectedAppointment.status === 'terminada' ? 'active' : ''}`}
                                        disabled={isUpdatingStatus}
                                    >
                                        Terminada
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedAppointment.id, 'cancelada')}
                                        className={`dam-status-btn status-cancelada ${selectedAppointment.status === 'cancelada' ? 'active' : ''}`}
                                        disabled={isUpdatingStatus}
                                    >
                                        Cancelada
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedAppointment.id, 'perdida')}
                                        className={`dam-status-btn status-perdida ${selectedAppointment.status === 'perdida' ? 'active' : ''}`}
                                        disabled={isUpdatingStatus}
                                    >
                                        Perdida
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="dam-actions">
                            {userType === 'admin' && (
                                <button className="dam-btn dam-btn-assign" onClick={handleAssignDoctor}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="8.5" cy="7" r="4"></circle>
                                        <line x1="20" y1="8" x2="20" y2="14"></line>
                                        <line x1="23" y1="11" x2="17" y2="11"></line>
                                    </svg>
                                    Asignar Médico
                                </button>
                            )}
                            <button className="dam-btn dam-btn-edit" onClick={handleEditAppointment}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Editar Cita
                            </button>
                            <button className="dam-btn dam-btn-ghost" onClick={() => setShowDetailModal(false)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Doctor Modal */}
            {showAssignDoctor && selectedAppointment && userType === 'admin' && (
                <div className="adm-overlay" onClick={() => setShowAssignDoctor(false)}>
                    <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="adm-header">
                            <h2>Asignar Médico</h2>
                            <button className="adm-close" onClick={() => setShowAssignDoctor(false)}>
                                ×
                            </button>
                        </div>
                        <div className="adm-body">
                            {isLoadingStaff ? (
                                <div className="adm-loading">Cargando médicos...</div>
                            ) : (
                                <div className="adm-grid">
                                    {staffList.map(doctor => (
                                        <div
                                            key={doctor.uid}
                                            className={`adm-card ${selectedAppointment.doctorId === doctor.uid ? 'adm-active' : ''}`}
                                            onClick={() => handleSaveDoctor(doctor.uid, `${doctor.nombres} ${doctor.apellidos}`)}
                                        >
                                            <div className="adm-avatar">
                                                {doctor.photoURL ? (
                                                    <img src={doctor.photoURL} alt={doctor.nombres} />
                                                ) : (
                                                    <span>{doctor.nombres.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="adm-info">
                                                <span className="adm-name">{doctor.nombres} {doctor.apellidos}</span>
                                                {doctor.especialidad && <span className="adm-specialty">{doctor.especialidad}</span>}
                                            </div>
                                            {selectedAppointment.doctorId === doctor.uid && (
                                                <span className="adm-badge-current">Actual</span>
                                            )}
                                        </div>
                                    ))}
                                    {staffList.length === 0 && (
                                        <p className="adm-empty">No hay médicos disponibles.</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="adm-actions">
                            <button className="adm-btn-ghost" onClick={() => setShowAssignDoctor(false)}>
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
                    patientData={patientDetails}
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
