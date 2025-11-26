import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AppointmentForm.css';

function AppointmentForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        motivo: '',
        clinica: '',
        fecha: '',
        hora: '',
        notas: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'
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
            // Validar que la fecha no sea en el pasado
            const selectedDate = new Date(formData.fecha + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                newErrors.fecha = 'La fecha no puede ser en el pasado';
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

        // Simular envío de formulario
        setTimeout(() => {
            console.log('Datos de la cita:', formData);
            setIsSubmitting(false);

            // Redirigir a la página de confirmación con los datos
            navigate('/cita-confirmada', { state: { appointment: formData } });
        }, 1500);
    };

    // Obtener fecha mínima (hoy)
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="appointment-form-container">
            <div className="form-header">
                <h2>Agenda tu Cita</h2>
                <p>Completa el formulario y te notificaremos vía correo electrónico o celular para confirmar tu cita</p>
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
                                min={today}
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
                            >
                                <option value="">Selecciona una hora</option>
                                {horariosDisponibles.map(hora => (
                                    <option key={hora} value={hora}>
                                        {hora}
                                    </option>
                                ))}
                            </select>
                            {errors.hora && (
                                <span className="error-message">⚠ {errors.hora}</span>
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
        </div>
    );
}

export default AppointmentForm;
