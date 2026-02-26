import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { createAppointment, updateAppointment, countScheduledAppointments, getAvailableTimeSlots, hasAppointmentOnDate } from '../services/appointmentService';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
import './AppointmentForm.css';
import './ConfirmationModal.css';

registerLocale('es', es);

function AppointmentForm({ userData }) {
    const navigate = useNavigate();
    const location = useLocation();
    const editingAppointment = location.state?.editingAppointment;
    const isEditMode = !!editingAppointment;

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

    // Pre-llenar formulario si estamos editando
    useEffect(() => {
        if (editingAppointment) {
            // Convertir el label del motivo de vuelta a su valor
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

            const motivoValue = motivosOptions.find(m => m.label === editingAppointment.reason)?.value || '';

            setFormData({
                motivo: motivoValue,
                clinica: editingAppointment.clinica || '',
                fecha: editingAppointment.date || '',
                hora: editingAppointment.time || '',
                notas: editingAppointment.notas || ''
            });
        }
    }, [editingAppointment]);

    // Load available hours when date and clinic are selected
    useEffect(() => {
        const loadAvailableHours = async () => {
            if (formData.fecha && formData.clinica) {
                setLoadingHours(true);

                // In edit mode, pass the current time so it's included even if full
                const currentTime = isEditMode ? editingAppointment?.time : null;

                const { availableSlots, error } = await getAvailableTimeSlots(
                    formData.fecha,
                    formData.clinica,
                    currentTime
                );

                if (error) {
                    console.error('Error loading available hours:', error);
                    setAvailableHours(horariosDisponibles); // Fallback to all hours
                } else {
                    setAvailableHours(availableSlots);

                    // If selected hour is no longer available (and not in edit mode), clear it
                    if (formData.hora && !availableSlots.includes(formData.hora) && !isEditMode) {
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
    }, [formData.fecha, formData.clinica, isEditMode, editingAppointment?.time]);

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
                setErrors({ general: 'Debes iniciar sesión para agendar una cita' });
                setIsSubmitting(false);
                return;
            }

            const patientName = userData ? `${userData.nombres || ''} ${userData.apellidos || ''}`.trim() : 'Paciente';
            const reasonLabel = motivosOptions.find(m => m.value === formData.motivo)?.label || formData.motivo;

            // Check appointment limit only when creating a new appointment (not editing)
            if (!isEditMode) {
                const { count, error: countError } = await countScheduledAppointments(user.uid);

                if (countError) {
                    console.error('Error checking appointment limit:', countError);
                    setErrors({ general: 'Error al verificar tus citas. Por favor, intenta de nuevo.' });
                    setIsSubmitting(false);
                    return;
                }

                if (count >= 2) {
                    setErrors({ general: 'Ya tienes 2 citas programadas. Debes cancelar o completar una cita existente antes de agendar una nueva.' });
                    setIsSubmitting(false);
                    return;
                }
            }

            // Check if user already has an appointment on the selected date
            const excludeId = isEditMode ? editingAppointment.id : null;
            const { hasAppointment, error: dateError } = await hasAppointmentOnDate(user.uid, formData.fecha, excludeId);

            if (dateError) {
                console.error('Error checking appointment on date:', dateError);
                setErrors({ general: 'Error al verificar disponibilidad. Por favor, intenta de nuevo.' });
                setIsSubmitting(false);
                return;
            }

            if (hasAppointment) {
                setErrors({ general: 'Ya tienes una cita programada para este día. No puedes agendar más de una cita por día.' });
                setIsSubmitting(false);
                return;
            }

            if (isEditMode) {
                // Actualizar cita existente en Firebase
                const updates = {
                    date: formData.fecha,
                    time: formData.hora,
                    reason: reasonLabel,
                    clinica: formData.clinica,
                    notas: formData.notas
                };

                const { error } = await updateAppointment(editingAppointment.id, updates);

                if (error) {
                    console.error('Error updating appointment:', error);
                    setErrors({ general: 'Error al actualizar la cita. Por favor, intenta de nuevo.' });
                    setIsSubmitting(false);
                    return;
                }

                navigate('/', { state: { message: 'Cita actualizada exitosamente' } });
            } else {
                // Crear nueva cita en Firebase
                const appointmentData = {
                    patientName,
                    patientDui: userData?.dui || '',
                    date: formData.fecha,
                    time: formData.hora,
                    reason: reasonLabel,
                    clinica: formData.clinica,
                    notas: formData.notas,
                    status: 'programada'
                };

                const { appointmentId, error } = await createAppointment(user.uid, appointmentData);

                if (error) {
                    console.error('Error creating appointment:', error);
                    setErrors({ general: 'Error al crear la cita. Por favor, intenta de nuevo.' });
                    setIsSubmitting(false);
                    return;
                }

                navigate('/cita-confirmada', { state: { appointment: formData } });
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
        <div className="apt-container">
            <div className="apt-header">
                <h2>{isEditMode ? 'Editar Cita' : 'Agenda tu Cita'}</h2>
                <div className="apt-header-line"></div>
                <p>
                    {isEditMode
                        ? 'Modifica los datos de tu cita y guarda los cambios'
                        : 'Completa el formulario y te notificaremos vía correo electrónico o celular para confirmar tu cita'
                    }
                </p>
            </div>

            <form onSubmit={handleSubmit} className="apt-form" noValidate>
                {/* Información de la Cita */}
                <div className="apt-section">
                    <div className="apt-section-header">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="apt-section-icon">
                            <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13 2V9H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <h3>Información de la Cita</h3>
                    </div>

                    <div className="apt-row">
                        <div className="apt-group">
                            <label htmlFor="motivo" className="apt-label">
                                <span>Motivo de la cita</span> <span className="apt-required">*</span>
                            </label>
                            <div className="apt-input-wrapper">
                                <select
                                    id="motivo"
                                    name="motivo"
                                    value={formData.motivo}
                                    onChange={handleChange}
                                    className={`apt-select ${errors.motivo ? 'apt-error' : ''} ${!formData.motivo ? 'apt-placeholder' : ''}`}
                                >
                                    {motivosOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.motivo && (
                                <span className="apt-error-msg">⚠ {errors.motivo}</span>
                            )}
                        </div>
                    </div>

                    <div className="apt-row">
                        <div className="apt-group">
                            <label htmlFor="clinica" className="apt-label">
                                <span>Clínica de preferencia</span> <span className="apt-required">*</span>
                            </label>
                            <div className="apt-input-wrapper">
                                <select
                                    id="clinica"
                                    name="clinica"
                                    value={formData.clinica}
                                    onChange={handleChange}
                                    className={`apt-select ${errors.clinica ? 'apt-error' : ''} ${!formData.clinica ? 'apt-placeholder' : ''}`}
                                >
                                    {clinicasOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.clinica && (
                                <span className="apt-error-msg">⚠ {errors.clinica}</span>
                            )}
                        </div>
                    </div>

                    <div className="apt-row apt-two-cols">
                        <div className="apt-group">
                            <label htmlFor="fecha" className="apt-label">
                                <span>Fecha de la cita</span> <span className="apt-required">*</span>
                            </label>
                            <div className="apt-input-wrapper">
                                <DatePicker
                                    selected={formData.fecha ? new Date(formData.fecha + 'T00:00:00') : null}
                                    onChange={(date) => {
                                        if (date) {
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
                                    dateFormat="dd-MM-yyyy"
                                    locale="es"
                                    placeholderText="Selecciona una fecha"
                                    className={`apt-date-picker ${errors.fecha ? 'apt-error' : ''}`}
                                    calendarClassName="apt-custom-calendar"
                                    autoComplete="off"
                                    onChangeRaw={(e) => e.preventDefault()}
                                />
                            </div>
                            {!formData.fecha && !errors.fecha && (
                                <span className="apt-hint">Haz clic para seleccionar una fecha</span>
                            )}
                            {errors.fecha && (
                                <span className="apt-error-msg">⚠ {errors.fecha}</span>
                            )}
                        </div>

                        <div className="apt-group">
                            <label htmlFor="hora" className="apt-label">
                                <span>Hora de la cita</span> <span className="apt-required">*</span>
                            </label>
                            <div className="apt-input-wrapper">
                                <select
                                    id="hora"
                                    name="hora"
                                    value={formData.hora}
                                    onChange={handleChange}
                                    className={`apt-select ${errors.hora ? 'apt-error' : ''} ${!formData.hora ? 'apt-placeholder' : ''}`}
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
                                            ? 'Cargando horas...'
                                            : !formData.fecha || !formData.clinica
                                                ? 'Selecciona una hora'
                                                : availableHours.length === 0
                                                    ? 'Sin disponibilidad'
                                                    : 'Selecciona una hora'}
                                    </option>
                                    {availableHours.map(hora => (
                                        <option key={hora} value={hora}>
                                            {hora}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.hora && (
                                <span className="apt-error-msg">⚠ {errors.hora}</span>
                            )}
                            {formData.fecha && formData.clinica && !loadingHours && availableHours.length === 0 && (
                                <span className="apt-info-msg">
                                    ℹ️ No hay horas libres para este día.
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notas Adicionales */}
                <div className="apt-section">
                    <div className="apt-section-header">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="apt-section-icon">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <h3>Notas Adicionales</h3>
                    </div>

                    <div className="apt-row">
                        <div className="apt-group">
                            <label htmlFor="notas" className="apt-label">
                                Información adicional (opcional)
                            </label>
                            <textarea
                                id="notas"
                                name="notas"
                                value={formData.notas}
                                onChange={handleChange}
                                placeholder="Comparte información relevante con el médico..."
                                className="apt-textarea"
                                rows="4"
                            />
                        </div>
                    </div>
                </div>

                {/* Display general errors */}
                {errors.general && (
                    <div className="apt-general-error">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>{errors.general}</span>
                    </div>
                )}

                <button
                    type="submit"
                    className="apt-submit-btn"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <div className="apt-spinner-box">
                            <span className="apt-spinner"></span>
                            <span>Procesando...</span>
                        </div>
                    ) : (
                        <div className="apt-btn-content">
                            <span>{isEditMode ? 'Guardar Cambios' : 'Agendar Cita Ahora'}</span>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    )}
                </button>
            </form>

            {/* Warning Modal */}
            {showWarningModal && (
                <div className="apt-modal-overlay" onClick={() => setShowWarningModal(false)}>
                    <div className="apt-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="apt-modal-icon-box">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" />
                                <line x1="12" y1="8" x2="12" y2="12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                                <line x1="12" y1="16" x2="12.01" y2="16" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3>Atención</h3>
                        <p>{warningMessage}</p>
                        <button className="apt-modal-btn" onClick={() => setShowWarningModal(false)}>
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AppointmentForm;
