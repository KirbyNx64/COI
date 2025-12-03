import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { createAppointment, updateAppointment, countScheduledAppointments, getAvailableTimeSlots, hasAppointmentOnDate } from '../services/appointmentService';
import './AppointmentForm.css';
import './ConfirmationModal.css';

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
        <div className="appointment-form-container">
            <div className="form-header">
                <h2>{isEditMode ? 'Editar Cita' : 'Agenda tu Cita'}</h2>
                <p>
                    {isEditMode
                        ? 'Modifica los datos de tu cita y guarda los cambios'
                        : 'Completa el formulario y te notificaremos vía correo electrónico o celular para confirmar tu cita'
                    }
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
                                <span className="error-message">⚠ {errors.motivo}</span>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
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
                                <span className="error-message">⚠ {errors.clinica}</span>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="fecha">
                                Fecha de la cita <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="fecha"
                                name="fecha"
                                value={formData.fecha}
                                onChange={handleChange}
                                onFocus={(e) => {
                                    e.target.type = "date";
                                    e.target.showPicker && e.target.showPicker();
                                }}
                                onBlur={(e) => {
                                    if (!e.target.value) e.target.type = "text";
                                }}
                                placeholder="Selecciona una fecha"
                                min={minDate}
                                className={errors.fecha ? 'error' : ''}
                            />
                            {errors.fecha && (
                                <span className="error-message">⚠ {errors.fecha}</span>
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
                                <span className="error-message">⚠ {errors.hora}</span>
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

                    <div className="form-row">
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
                </div>

                {/* Display general errors */}
                {errors.general && (
                    <div className="error-message" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee', borderRadius: '8px', color: '#c00' }}>
                        ⚠ {errors.general}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-primary btn-submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="spinner"></span>
                            Procesando...
                        </>
                    ) : isEditMode ? (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Guardar Cambios
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

export default AppointmentForm;
