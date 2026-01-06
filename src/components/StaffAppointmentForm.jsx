import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { createAppointmentForPatient, getAvailableTimeSlots } from '../services/appointmentService';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
import './AppointmentForm.css';

registerLocale('es', es);

function StaffAppointmentForm({ patientData, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        motivo: '',
        clinica: '',
        fecha: '',
        hora: '',
        notas: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableHours, setAvailableHours] = useState([]);
    const [loadingHours, setLoadingHours] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

    // Load available hours when date and clinic are selected
    useEffect(() => {
        const loadAvailableHours = async () => {
            if (formData.fecha && formData.clinica) {
                setLoadingHours(true);

                const { availableSlots, error } = await getAvailableTimeSlots(
                    formData.fecha,
                    formData.clinica,
                    null
                );

                if (error) {
                    console.error('Error loading available hours:', error);
                    setAvailableHours(horariosDisponibles); // Fallback to all hours
                } else {
                    setAvailableHours(availableSlots);

                    // If selected hour is no longer available, clear it
                    if (formData.hora && !availableSlots.includes(formData.hora)) {
                        setFormData(prev => ({ ...prev, hora: '' }));
                    }
                }

                setLoadingHours(false);
            } else {
                // Reset to all hours if date or clinic not selected
                setAvailableHours(horariosDisponibles);
            }
        };

        loadAvailableHours();
    }, [formData.fecha, formData.clinica]);

    const motivosOptions = [
        { value: '', label: 'Selecciona un motivo' },
        { value: 'evaluacion', label: 'Evaluación' },
        { value: 'control', label: 'Control de rutina' },
        { value: 'dolor', label: 'Dolor en alguna pieza' },
        { value: 'endodoncia', label: 'Endodoncia' },
        { value: 'limpieza', label: 'Limpieza' },
        { value: 'rellenos', label: 'Rellenos' },
        { value: 'cirugia', label: 'Cirugía de cordal' },
        { value: 'otro', label: 'Otro' }
    ];

    const clinicasOptions = [
        { value: '', label: 'Selecciona una clínica' },
        { value: 'santa-tecla', label: 'Santa Tecla' },
        { value: 'soyapango', label: 'Soyapango' },
        { value: 'san-martin', label: 'San Martín' },
        { value: 'escalon', label: 'Escalón' },
        { value: 'usulutan', label: 'Usulután' }
    ];

    const horariosDisponibles = [
        '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
        '1:00 PM', '2:00 PM', '3:00 PM'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Check if selecting a Sunday for the date field
        if (name === 'fecha' && value) {
            const selectedDate = new Date(value + 'T00:00:00');
            if (selectedDate.getDay() === 0) {
                // Show warning and don't update the date
                setWarningMessage('No se pueden agendar citas los domingos. Por favor, selecciona otro día.');
                setShowWarningModal(true);
                return;
            }
        }

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

        // Validar campos requeridos
        if (!formData.motivo) {
            newErrors.motivo = 'Por favor selecciona el motivo de la cita';
        }

        if (!formData.clinica) {
            newErrors.clinica = 'Por favor selecciona una clínica';
        }

        if (!formData.fecha) {
            newErrors.fecha = 'Por favor selecciona una fecha';
        } else {
            // Validar que la fecha no sea en el pasado ni el día actual
            const selectedDate = new Date(formData.fecha + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                newErrors.fecha = 'La fecha no puede ser en el pasado';
            } else if (selectedDate.getTime() === today.getTime()) {
                newErrors.fecha = 'No se pueden agendar citas para el día de hoy';
            }

            // Validar que no sea domingo (0 = domingo)
            if (selectedDate.getDay() === 0) {
                newErrors.fecha = 'No se pueden agendar citas los domingos';
            }
        }

        if (!formData.hora) {
            newErrors.hora = 'Por favor selecciona una hora';
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
                setErrors({ general: 'Debes iniciar sesión como personal para agendar citas' });
                setIsSubmitting(false);
                return;
            }

            const patientName = `${patientData.nombres || ''} ${patientData.apellidos || ''}`.trim();
            const reasonLabel = motivosOptions.find(m => m.value === formData.motivo)?.label || formData.motivo;

            // Create appointment for patient
            const appointmentData = {
                patientName,
                date: formData.fecha,
                time: formData.hora,
                reason: reasonLabel,
                clinica: formData.clinica,
                notas: formData.notas,
                status: 'programada'
            };

            const { appointmentId, error } = await createAppointmentForPatient(
                patientData.id,
                appointmentData,
                user.uid
            );

            if (error) {
                console.error('Error creating appointment:', error);
                setErrors({ general: 'Error al crear la cita. Por favor, intenta de nuevo.' });
                setIsSubmitting(false);
                return;
            }

            // Success - call onSuccess callback
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setErrors({ general: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.' });
            setIsSubmitting(false);
        }
    };

    // Obtener fecha mínima (mañana - no se permite agendar el día de hoy)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
        <div className="appointment-form-container">
            <div className="form-header">
                <h2>Programar Cita para Paciente</h2>
                <p className="patient-info">
                    <strong>Paciente:</strong> {patientData.nombres} {patientData.apellidos}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="appointment-form" noValidate>
                {/* Información de la Cita */}
                <div className="form-section">
                    <h3>Información de la Cita</h3>

                    <div className="form-row">
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
                                {motivosOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.motivo && (
                                <span className="error-message">{errors.motivo}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="clinica">
                                Clínica de preferencia <span className="required">*</span>
                            </label>
                            <select
                                id="clinica"
                                name="clinica"
                                value={formData.clinica}
                                onChange={handleChange}
                                className={`${errors.clinica ? 'error' : ''} ${!formData.clinica ? 'placeholder' : ''}`}
                            >
                                {clinicasOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.clinica && (
                                <span className="error-message">{errors.clinica}</span>
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
                                filterDate={(date) => date.getDay() !== 0} // Block Sundays
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
                                onMouseDown={(e) => {
                                    if (!formData.fecha || !formData.clinica) {
                                        e.preventDefault();
                                        setWarningMessage('Por favor, selecciona una clínica y una fecha antes de elegir la hora.');
                                        setShowWarningModal(true);
                                    }
                                }}
                            >
                                <option value="">
                                    {loadingHours
                                        ? 'Cargando horas disponibles...'
                                        : !formData.fecha || !formData.clinica
                                            ? 'Selecciona una hora'
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
                            {formData.fecha && formData.clinica && !loadingHours && availableHours.length === 0 && (
                                <span className="info-message" style={{ color: '#0066cc', fontSize: '0.9rem', marginTop: '0.25rem', display: 'block' }}>
                                    ℹ️ Todas las horas están ocupadas para esta fecha. Por favor, selecciona otro día.
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notas Adicionales */}
                <div className="form-section">
                    <h3>Notas Adicionales</h3>

                    <div className="form-group">
                        <label htmlFor="notas">
                            Información adicional (opcional)
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
                </div>

                {/* Display general errors */}
                {errors.general && (
                    <div className="error-message" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee', borderRadius: '8px', color: '#c00' }}>
                        {errors.general}
                    </div>
                )}

                <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
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
                                Agendando...
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Agendar Cita
                            </>
                        )}
                    </button>
                </div>
            </form>

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
        </div>
    );
}

export default StaffAppointmentForm;
