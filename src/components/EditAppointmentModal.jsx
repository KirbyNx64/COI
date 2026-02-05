import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { updateAppointmentDetails, getAvailableTimeSlots } from '../services/appointmentService';
import { getPatientById } from '../services/staffService';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
import './EditAppointmentModal.css';

registerLocale('es', es);

function EditAppointmentModal({ appointment, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        fecha: appointment.date || '',
        hora: appointment.time || '',
        clinica: appointment.clinica || '',
        motivo: appointment.reason || '',
        notas: appointment.notas || '',
        notasMedico: appointment.notasMedico || ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableHours, setAvailableHours] = useState([]);
    const [loadingHours, setLoadingHours] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [patientDetails, setPatientDetails] = useState(null);

    const horariosDisponibles = [
        '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
        '1:00 PM', '2:00 PM', '3:00 PM'
    ];

    // Load available hours when date changes
    useEffect(() => {
        const loadAvailableHours = async () => {
            if (formData.fecha) {
                setLoadingHours(true);

                const { availableSlots, error } = await getAvailableTimeSlots(
                    formData.fecha,
                    formData.clinica,
                    appointment.time // Include current time to allow keeping it
                );

                if (error) {
                    console.error('Error loading available hours:', error);
                    setAvailableHours(horariosDisponibles);
                } else {
                    setAvailableHours(availableSlots);

                    // If selected hour is no longer available, clear it
                    if (formData.hora && !availableSlots.includes(formData.hora)) {
                        setFormData(prev => ({ ...prev, hora: '' }));
                    }
                }

                setLoadingHours(false);
            } else {
                setAvailableHours(horariosDisponibles);
            }
        };

        loadAvailableHours();
    }, [formData.fecha, formData.clinica, appointment.time]);

    // Load patient details on mount
    useEffect(() => {
        const loadPatientDetails = async () => {
            if (appointment.userId) {
                const { patient, error } = await getPatientById(appointment.userId);
                if (!error && patient) {
                    setPatientDetails(patient);
                }
            }
        };

        loadPatientDetails();
    }, [appointment.userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fecha) {
            newErrors.fecha = 'Por favor selecciona una fecha';
        } else {
            // Validate date is not in the past or today
            const selectedDate = new Date(formData.fecha + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                newErrors.fecha = 'La fecha no puede ser en el pasado';
            } else if (selectedDate.getTime() === today.getTime()) {
                newErrors.fecha = 'No se pueden agendar citas para el día de hoy';
            }

            // Validate not Sunday
            if (selectedDate.getDay() === 0) {
                newErrors.fecha = 'No se pueden agendar citas los domingos';
            }
        }

        if (!formData.hora) {
            newErrors.hora = 'Por favor selecciona una hora';
        }

        if (!formData.clinica) {
            newErrors.clinica = 'Por favor selecciona una clínica';
        }

        if (!formData.motivo || formData.motivo.trim() === '') {
            newErrors.motivo = 'Por favor ingresa el motivo de la cita';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validateForm();

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                setErrors({ general: 'Debes iniciar sesión como personal para editar citas' });
                setIsSubmitting(false);
                return;
            }

            // Prepare updates object (only include changed fields)
            const updates = {};
            if (formData.fecha !== appointment.date) updates.date = formData.fecha;
            if (formData.hora !== appointment.time) updates.time = formData.hora;
            if (formData.clinica !== appointment.clinica) updates.clinica = formData.clinica;
            if (formData.motivo !== appointment.reason) updates.reason = formData.motivo;
            if (formData.notas !== appointment.notas) updates.notas = formData.notas;
            if (formData.notasMedico !== appointment.notasMedico) updates.notasMedico = formData.notasMedico;

            // If nothing changed, just close the modal
            if (Object.keys(updates).length === 0) {
                if (onSuccess) onSuccess();
                return;
            }

            const { error } = await updateAppointmentDetails(
                appointment.id,
                updates,
                user.uid
            );

            if (error) {
                console.error('Error updating appointment:', error);
                setErrors({ general: error.message || 'Error al actualizar la cita. Por favor, intenta de nuevo.' });
                setIsSubmitting(false);
                return;
            }

            // Success
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setErrors({ general: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.' });
            setIsSubmitting(false);
        }
    };

    // Get minimum date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

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

    return (
        <>
            <div className="modal-overlay" onClick={onCancel}>
                <div className="modal-content edit-appointment-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Editar Cita</h2>
                        <button className="modal-close" onClick={onCancel}>
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="edit-appointment-form" noValidate>
                        {/* Read-only Information */}
                        <div className="form-section readonly-section">
                            <h3>Información del Paciente</h3>
                            <div className="readonly-grid">
                                <div className="readonly-item">
                                    <label>Paciente:</label>
                                    <span>{appointment.patientName}</span>
                                </div>
                                {patientDetails && patientDetails.dui && (
                                    <div className="readonly-item">
                                        <label>DUI:</label>
                                        <span>{patientDetails.dui}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div className="form-section">
                            <h3>Modificar Detalles</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="clinica">
                                        Clínica <span className="required">*</span>
                                    </label>
                                    <select
                                        id="clinica"
                                        name="clinica"
                                        value={formData.clinica}
                                        onChange={handleChange}
                                        className={`${errors.clinica ? 'error' : ''} ${!formData.clinica ? 'placeholder' : ''}`}
                                    >
                                        <option value="">Selecciona una clínica</option>
                                        <option value="santa-tecla">Santa Tecla</option>
                                        <option value="soyapango">Soyapango</option>
                                        <option value="san-martin">San Martín</option>
                                        <option value="escalon">Escalón</option>
                                        <option value="usulutan">Usulután</option>
                                    </select>
                                    {errors.clinica && (
                                        <span className="error-message">{errors.clinica}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="motivo">
                                        Motivo de la cita <span className="required">*</span>
                                    </label>
                                    <select
                                        id="motivo"
                                        name="motivo"
                                        value={formData.motivo}
                                        onChange={handleChange}
                                        className={`${errors.motivo ? 'error' : ''} ${!formData.motivo ? 'placeholder' : ''}`}
                                    >
                                        <option value="">Selecciona el motivo</option>
                                        <option value="Control de rutina">Control de rutina</option>
                                        <option value="Dolor de muelas">Dolor de muelas</option>
                                        <option value="Limpieza dental">Limpieza dental</option>
                                        <option value="Extracción">Extracción</option>
                                        <option value="Ortodoncia">Ortodoncia</option>
                                        <option value="Emergencia">Emergencia</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                    {errors.motivo && (
                                        <span className="error-message">{errors.motivo}</span>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="fecha">
                                        Fecha de la cita <span className="required">*</span>
                                    </label>
                                    <DatePicker
                                        selected={formData.fecha ? new Date(formData.fecha + 'T00:00:00') : null}
                                        onChange={(date) => {
                                            if (date) {
                                                // Check if it's a Sunday
                                                if (date.getDay() === 0) {
                                                    setWarningMessage('No se pueden agendar citas los domingos. Por favor, selecciona otro día.');
                                                    setShowWarningModal(true);
                                                    return;
                                                }

                                                const year = date.getFullYear();
                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                const day = String(date.getDate()).padStart(2, '0');
                                                const formattedDate = `${year}-${month}-${day}`;

                                                setFormData(prev => ({ ...prev, fecha: formattedDate }));
                                                if (errors.fecha) {
                                                    setErrors(prev => ({ ...prev, fecha: '' }));
                                                }
                                            } else {
                                                setFormData(prev => ({ ...prev, fecha: '' }));
                                            }
                                        }}
                                        minDate={tomorrow}
                                        filterDate={(date) => date.getDay() !== 0}
                                        dateFormat="dd/MM/yyyy"
                                        locale="es"
                                        placeholderText="Selecciona una fecha"
                                        className={`date-picker-input ${errors.fecha ? 'error' : ''}`}
                                        calendarClassName="custom-calendar"
                                        autoComplete="off"
                                        onChangeRaw={(e) => e.preventDefault()}
                                    />
                                    {!formData.fecha && !errors.fecha && (
                                        <span className="field-hint">Haz clic para seleccionar una fecha</span>
                                    )}
                                    {errors.fecha && (
                                        <span className="error-message">{errors.fecha}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="hora">
                                        Hora de la cita <span className="required">*</span>
                                    </label>
                                    <select
                                        id="hora"
                                        name="hora"
                                        value={formData.hora}
                                        onChange={handleChange}
                                        className={`${errors.hora ? 'error' : ''} ${!formData.hora ? 'placeholder' : ''}`}
                                        disabled={loadingHours}
                                    >
                                        <option value="">
                                            {loadingHours
                                                ? 'Cargando horas disponibles...'
                                                : availableHours.length === 0
                                                    ? 'No hay horas disponibles'
                                                    : 'Selecciona una hora'}
                                        </option>
                                        {availableHours.map(hora => (
                                            <option key={hora} value={hora}>
                                                {hora}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.hora && (
                                        <span className="error-message">{errors.hora}</span>
                                    )}
                                    {formData.fecha && !loadingHours && availableHours.length === 0 && (
                                        <span className="info-message" style={{ color: '#0066cc', fontSize: '0.9rem', marginTop: '0.25rem', display: 'block' }}>
                                            ℹ️ Todas las horas están ocupadas para esta fecha. Por favor, selecciona otro día.
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="notas">
                                    Notas adicionales (opcional)
                                </label>
                                <textarea
                                    id="notas"
                                    name="notas"
                                    value={formData.notas}
                                    onChange={handleChange}
                                    placeholder="Información adicional que consideres importante..."
                                    rows="4"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="notasMedico">
                                    Notas del médico (opcional)
                                </label>
                                <textarea
                                    id="notasMedico"
                                    name="notasMedico"
                                    value={formData.notasMedico}
                                    onChange={handleChange}
                                    placeholder="Observaciones médicas sobre la cita..."
                                    rows="4"
                                />
                            </div>
                        </div>

                        {/* Display general errors */}
                        {errors.general && (
                            <div className="error-message" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee', borderRadius: '8px', color: '#c00' }}>
                                {errors.general}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary btn-submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner"></span>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Warning Modal */}
            {showWarningModal && (
                <div className="modal-overlay" onClick={() => setShowWarningModal(false)}>
                    <div className="modal-content error-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Atención</h3>
                        <p className="modal-message">
                            {warningMessage}
                        </p>
                        <div className="modal-actions">
                            <button className="modal-btn modal-btn-confirm" onClick={() => setShowWarningModal(false)}>
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default EditAppointmentModal;
