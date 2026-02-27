import { useReducer, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { createAppointmentForPatient, getAvailableTimeSlots } from '../services/appointmentService';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
import './AppointmentForm.css';

registerLocale('es', es);

const initialState = {
    formData: {
        motivo: '',
        clinica: '',
        fecha: '',
        hora: '',
        notas: ''
    },
    errors: {},
    isSubmitting: false,
    availableHours: [
        '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
        '1:00 PM', '2:00 PM', '3:00 PM'
    ],
    loadingHours: false,
    showWarningModal: false,
    warningMessage: ''
};

function reducer(state, action) {
    switch (action.type) {
        case 'UPDATE_FORM':
            return {
                ...state,
                formData: { ...state.formData, [action.name]: action.value },
                errors: { ...state.errors, [action.name]: '' }
            };
        case 'SET_ERRORS':
            return { ...state, errors: action.payload };
        case 'SET_SUBMITTING':
            return { ...state, isSubmitting: action.payload };
        case 'SET_AVAILABLE_HOURS':
            return {
                ...state,
                availableHours: action.payload,
                formData: {
                    ...state.formData,
                    hora: (state.formData.hora && !action.payload.includes(state.formData.hora)) ? '' : state.formData.hora
                }
            };
        case 'SET_LOADING_HOURS':
            return { ...state, loadingHours: action.payload };
        case 'SHOW_WARNING':
            return { ...state, showWarningModal: true, warningMessage: action.message };
        case 'HIDE_WARNING':
            return { ...state, showWarningModal: false, warningMessage: '' };
        default:
            return state;
    }
}

function StaffAppointmentForm({ patientData, onSuccess, onCancel }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        formData, errors, isSubmitting, availableHours,
        loadingHours, showWarningModal, warningMessage
    } = state;

    useEffect(() => {
        const loadAvailableHours = async () => {
            if (formData.fecha && formData.clinica) {
                dispatch({ type: 'SET_LOADING_HOURS', payload: true });

                const { availableSlots, error } = await getAvailableTimeSlots(
                    formData.fecha,
                    formData.clinica,
                    null
                );

                if (error) {
                    console.error('Error loading available hours:', error);
                    // Keep existing fallback
                } else {
                    dispatch({ type: 'SET_AVAILABLE_HOURS', payload: availableSlots });
                }
                dispatch({ type: 'SET_LOADING_HOURS', payload: false });
            } else {
                dispatch({ type: 'SET_AVAILABLE_HOURS', payload: initialState.availableHours });
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'fecha' && value) {
            const selectedDate = new Date(value + 'T00:00:00');
            if (selectedDate.getDay() === 0) {
                dispatch({ type: 'SHOW_WARNING', message: 'No se pueden agendar citas los domingos. Por favor, selecciona otro día.' });
                return;
            }
        }
        dispatch({ type: 'UPDATE_FORM', name, value });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.motivo) newErrors.motivo = 'Por favor selecciona el motivo de la cita';
        if (!formData.clinica) newErrors.clinica = 'Por favor selecciona una clínica';
        if (!formData.fecha) {
            newErrors.fecha = 'Por favor selecciona una fecha';
        } else {
            const selectedDate = new Date(formData.fecha + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                newErrors.fecha = 'La fecha no puede ser en el pasado';
            } else if (selectedDate.getTime() === today.getTime()) {
                newErrors.fecha = 'No se pueden agendar citas para el día de hoy';
            }
            if (selectedDate.getDay() === 0) newErrors.fecha = 'No se pueden agendar citas los domingos';
        }
        if (!formData.hora) newErrors.hora = 'Por favor selecciona una hora';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            dispatch({ type: 'SET_ERRORS', payload: newErrors });
            return;
        }

        dispatch({ type: 'SET_SUBMITTING', payload: true });

        try {
            const user = auth.currentUser;
            if (!user) {
                dispatch({ type: 'SET_ERRORS', payload: { general: 'Debes iniciar sesión como personal para agendar citas' } });
                dispatch({ type: 'SET_SUBMITTING', payload: false });
                return;
            }

            const patientName = `${patientData.nombres || ''} ${patientData.apellidos || ''}`.trim();
            const reasonLabel = motivosOptions.find(m => m.value === formData.motivo)?.label || formData.motivo;

            const appointmentData = {
                patientName,
                patientDui: patientData.dui || '',
                date: formData.fecha,
                time: formData.hora,
                reason: reasonLabel,
                clinica: formData.clinica,
                notas: formData.notas,
                status: 'programada'
            };

            const { error } = await createAppointmentForPatient(patientData.id, appointmentData, user.uid);
            if (error) {
                dispatch({ type: 'SET_ERRORS', payload: { general: 'Error al crear la cita. Por favor, intenta de nuevo.' } });
                dispatch({ type: 'SET_SUBMITTING', payload: false });
                return;
            }
            if (onSuccess) onSuccess();
        } catch (err) {
            dispatch({ type: 'SET_ERRORS', payload: { general: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.' } });
            dispatch({ type: 'SET_SUBMITTING', payload: false });
        }
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return (
        <div className="appointment-form-container">
            <div className="form-header">
                <p className="patient-info">
                    <strong>Paciente</strong> {patientData.nombres} {patientData.apellidos}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="appointment-form" noValidate>
                <div className="stf-apt-scroll-body">
                    <div className="form-section">
                        <h3>Información de la Cita</h3>
                        <div className="form-grid">
                            <FormSelect
                                label="Motivo de la cita"
                                id="motivo"
                                name="motivo"
                                value={formData.motivo}
                                options={motivosOptions}
                                onChange={handleChange}
                                error={errors.motivo}
                            />
                            <FormSelect
                                label="Clínica de preferencia"
                                id="clinica"
                                name="clinica"
                                value={formData.clinica}
                                options={clinicasOptions}
                                onChange={handleChange}
                                error={errors.clinica}
                            />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="fecha">Fecha de la cita <span className="required">*</span></label>
                                <DatePicker
                                    selected={formData.fecha ? new Date(formData.fecha + 'T00:00:00') : null}
                                    onChange={(date) => {
                                        if (date) {
                                            if (date.getDay() === 0) {
                                                dispatch({ type: 'SHOW_WARNING', message: 'No se pueden agendar citas los domingos. Por favor, selecciona otro día.' });
                                                return;
                                            }
                                            const formattedDate = date.toISOString().split('T')[0];
                                            dispatch({ type: 'UPDATE_FORM', name: 'fecha', value: formattedDate });
                                        } else {
                                            dispatch({ type: 'UPDATE_FORM', name: 'fecha', value: '' });
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
                                {errors.fecha && <span className="error-message">{errors.fecha}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="hora">Hora de la cita <span className="required">*</span></label>
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
                                            dispatch({ type: 'SHOW_WARNING', message: 'Por favor, selecciona una clínica y una fecha antes de elegir la hora.' });
                                        }
                                    }}
                                >
                                    <option value="">
                                        {loadingHours ? 'Cargando horas disponibles...' : (!formData.fecha || !formData.clinica ? 'Selecciona una hora' : availableHours.length === 0 ? 'No hay horas disponibles' : 'Selecciona una hora')}
                                    </option>
                                    {availableHours.map(hora => <option key={hora} value={hora}>{hora}</option>)}
                                </select>
                                {errors.hora && <span className="error-message">{errors.hora}</span>}
                                {formData.fecha && formData.clinica && !loadingHours && availableHours.length === 0 && (
                                    <span className="info-message">ℹ️ Todas las horas están ocupadas para esta fecha.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Notas Adicionales</h3>
                        <div className="form-group">
                            <label htmlFor="notas">Información adicional (opcional)</label>
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

                    {errors.general && <div className="general-error">{errors.general}</div>}
                </div>

                <div className="form-actions">
                    <button type="button" className="stf-cancel-btn" onClick={onCancel} disabled={isSubmitting}>Cancelar</button>
                    <button type="submit" className="stf-save-btn btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? <><span className="spinner"></span> Agendando...</> : <><CalendarIcon /> Agendar Cita</>}
                    </button>
                </div>
            </form>

            {showWarningModal && (
                <WarningModal message={warningMessage} onClose={() => dispatch({ type: 'HIDE_WARNING' })} />
            )}
        </div>
    );
}

// Helpers
const FormSelect = ({ label, id, name, value, options, onChange, error }) => (
    <div className="form-group">
        <label htmlFor={id}>{label} <span className="required">*</span></label>
        <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            className={`${error ? 'error' : ''} ${!value ? 'placeholder' : ''}`}
        >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <span className="error-message">{error}</span>}
    </div>
);

const WarningModal = ({ message, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content error-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Atención</h3>
            <p className="modal-message">{message}</p>
            <div className="modal-actions">
                <button className="modal-btn modal-btn-confirm" onClick={onClose}>Entendido</button>
            </div>
        </div>
    </div>
);

const CalendarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '18px', height: '18px', marginRight: '8px', verticalAlign: 'middle' }} aria-hidden="true">
        <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default StaffAppointmentForm;
