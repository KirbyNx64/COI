import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
import './Login.css';
import './ConfirmationModal.css';
import { signUp, signIn, resetPassword, signOut } from '../services/authService';
import ConfirmationModal from './ConfirmationModal';

registerLocale('es', es);

const Login = ({ onLogin }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [registrationStep, setRegistrationStep] = useState(1);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Step 1 Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Step 2 Data
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [dui, setDui] = useState('');
    const [genero, setGenero] = useState('');
    const [direccion, setDireccion] = useState('');
    const [telefono, setTelefono] = useState('');

    // Emergency Contact
    const [emergenciaNombre, setEmergenciaNombre] = useState('');
    const [emergenciaTelefono, setEmergenciaTelefono] = useState('');
    const [emergenciaParentesco, setEmergenciaParentesco] = useState('');

    // Patient Type
    const [tipoPaciente, setTipoPaciente] = useState('primera-vez');

    // Password visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showResetPasswordField, setShowResetPasswordField] = useState(false);

    const validateField = (name, value) => {
        if (value) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setIsLoading(true);

        try {
            if (isLoginView) {
                // LOGIN LOGIC
                if (!email || !password) {
                    setError('Por favor, completa todos los campos.');
                    setIsLoading(false);
                    return;
                }

                const { user, error: signInError } = await signIn(email, password);

                if (signInError) {
                    if (signInError.code === 'auth/email-not-verified') {
                        setError('Por favor, verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.');
                    } else if (signInError.code === 'auth/user-not-found') {
                        setError('No existe una cuenta con este correo.');
                    } else if (signInError.code === 'auth/wrong-password') {
                        setError('Contraseña incorrecta.');
                    } else if (signInError.code === 'auth/invalid-credential') {
                        setError('Correo o contraseña incorrectos.');
                    } else {
                        setError(signInError.message || 'Error al iniciar sesión.');
                    }
                    setIsLoading(false);
                    return;
                }

                if (user) {
                    onLogin(user);
                }
            } else {
                // REGISTRATION LOGIC
                if (registrationStep === 1) {
                    const errors = {};
                    if (!email) errors.email = 'Ingresa tu correo electrónico';
                    if (!password) errors.password = 'Crea una contraseña';
                    if (!confirmPassword) errors.confirmPassword = 'Confirma tu contraseña';

                    if (Object.keys(errors).length > 0) {
                        setFieldErrors(errors);
                        setIsLoading(false);
                        return;
                    }

                    if (password.length < 6) {
                        setFieldErrors({ password: 'La contraseña debe tener al menos 6 caracteres' });
                        setIsLoading(false);
                        return;
                    }

                    if (password !== confirmPassword) {
                        setFieldErrors({ confirmPassword: 'Las contraseñas no coinciden' });
                        setIsLoading(false);
                        return;
                    }
                    setRegistrationStep(2);
                    setIsLoading(false);
                } else {
                    // Finalize Registration
                    const errors = {};
                    if (!nombres) errors.nombres = 'Ingresa tus nombres';
                    if (!apellidos) errors.apellidos = 'Ingresa tus apellidos';
                    if (!fechaNacimiento) errors.fechaNacimiento = 'Selecciona tu fecha de nacimiento';
                    if (!dui) errors.dui = 'Ingresa tu número de DUI';
                    if (!genero) errors.genero = 'Selecciona tu género';
                    if (!direccion) errors.direccion = 'Ingresa tu dirección completa';
                    if (!telefono) errors.telefono = 'Ingresa tu número de teléfono';
                    if (!emergenciaNombre) errors.emergenciaNombre = 'Ingresa el nombre del contacto';
                    if (!emergenciaTelefono) errors.emergenciaTelefono = 'Ingresa el teléfono del contacto';
                    if (!emergenciaParentesco) errors.emergenciaParentesco = 'Selecciona el parentesco';

                    // Validate minimum age of 18 years
                    if (fechaNacimiento) {
                        const birthDate = new Date(fechaNacimiento);
                        const today = new Date();
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();

                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                        }

                        if (age < 18) {
                            errors.fechaNacimiento = 'Debes tener al menos 18 años para registrarte';
                        }
                    }

                    // Validate phone numbers (exactly 8 digits)
                    if (telefono && telefono.length !== 8) {
                        errors.telefono = 'El teléfono debe tener exactamente 8 dígitos';
                    }
                    if (emergenciaTelefono && emergenciaTelefono.length !== 8) {
                        errors.emergenciaTelefono = 'El teléfono debe tener exactamente 8 dígitos';
                    }

                    // Validate DUI format (must be complete: ########-#)
                    if (dui && dui.length !== 10) {
                        errors.dui = 'El DUI debe tener el formato completo (########-#)';
                    }

                    if (Object.keys(errors).length > 0) {
                        setFieldErrors(errors);
                        setIsLoading(false);
                        return;
                    }

                    const registrationData = {
                        nombres,
                        apellidos,
                        fechaNacimiento,
                        dui,
                        genero,
                        direccion,
                        telefono,
                        emergenciaNombre,
                        emergenciaTelefono,
                        emergenciaParentesco,
                        tipoPaciente
                    };

                    sessionStorage.setItem('justRegistered', 'true');
                    const { user, error: signUpError } = await signUp(email, password, registrationData);

                    if (signUpError) {
                        sessionStorage.removeItem('justRegistered');
                        if (signUpError.code === 'auth/email-already-in-use') {
                            setError('Este correo ya está registrado.');
                        } else {
                            setError(signUpError.message || 'Error al registrar usuario.');
                        }
                        setIsLoading(false);
                        return;
                    }

                    setError('');
                    setShowSuccessModal(true);
                    setIsLoading(false);
                    window.scrollTo(0, 0);
                }
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
            setIsLoading(false);
        }
    };

    const handleSuccessModalClose = async () => {
        setShowSuccessModal(false);
        setIsLoading(false);
        sessionStorage.removeItem('justRegistered');
        await signOut();
        setIsLoginView(true);
        setRegistrationStep(1);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setNombres('');
        setApellidos('');
        setFechaNacimiento('');
        setDui('');
        setGenero('');
        setDireccion('');
        setTelefono('');
        setEmergenciaNombre('');
        setEmergenciaTelefono('');
        setEmergenciaParentesco('');
        window.scrollTo(0, 0);
    };

    const handleTabChange = (isLogin) => {
        setIsLoginView(isLogin);
        setError('');
        setFieldErrors({});
        setRegistrationStep(1);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetMessage('');
        if (!resetEmail) {
            setResetMessage('Por favor, ingresa tu correo electrónico.');
            return;
        }
        setIsLoading(true);
        const { error } = await resetPassword(resetEmail);
        setIsLoading(false);
        if (error) {
            setResetMessage('Error al enviar el correo de recuperación.');
        } else {
            setResetMessage('¡Correo enviado! Revisa tu bandeja de entrada.');
            setTimeout(() => {
                setShowResetPassword(false);
                setResetEmail('');
                setResetMessage('');
            }, 3000);
        }
    };

    const handleDuiChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 9) value = value.slice(0, 9);
        if (value.length > 8) {
            value = value.slice(0, 8) + '-' + value.slice(8, 9);
        }
        setDui(value);
        validateField('dui', value);
    };

    const handlePhoneChange = (setter, fieldName) => (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 8) {
            setter(value);
            validateField(fieldName, value);
        }
    };

    const ErrorSpan = ({ field }) => {
        if (!fieldErrors[field]) return null;
        return (
            <span className="lgn-field-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {fieldErrors[field]}
            </span>
        );
    };

    return (
        <div className="login-container">
            <div className={`login-card ${(!isLoginView && registrationStep === 2) ? 'wide' : ''}`}>
                <div className="login-header">
                    <img
                        src={`${import.meta.env.BASE_URL}logo.webp`}
                        alt="Clínica Dental Dr. Cesar Vásquez"
                        className="login-logo"
                    />
                </div>

                {showSuccessModal ? (
                    <div className="registration-success-card">
                        <div className="modal-icon-container">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="modal-success-icon">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2 className="modal-title">¡Registro completado con éxito!</h2>
                        <p className="modal-message">
                            Te hemos enviado un correo de verificación a <strong>{email}</strong>.
                            Por favor, confirma tu cuenta para poder agendar tus citas.
                        </p>
                        <p className="modal-message" style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '-1rem' }}>
                            (Si no lo recibes en unos minutos, revisa tu carpeta de <strong>correo no deseado o spam</strong>)
                        </p>
                        <div className="modal-actions" style={{ maxWidth: '300px', margin: '2rem auto 0' }}>
                            <button className="login-button" onClick={handleSuccessModalClose}>
                                Volver al Inicio de Sesión
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {registrationStep === 1 && (
                            <div className="auth-tabs">
                                <button
                                    className={`auth-tab ${isLoginView ? 'active' : ''}`}
                                    onClick={() => handleTabChange(true)}
                                >
                                    INICIAR SESIÓN
                                </button>
                                <button
                                    className={`auth-tab ${!isLoginView ? 'active' : ''}`}
                                    onClick={() => handleTabChange(false)}
                                >
                                    REGISTRARSE
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="login-form" noValidate>
                            {(isLoginView || registrationStep === 1) && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="email">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', opacity: 0.7 }}>
                                                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Correo Electrónico
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); validateField('email', e.target.value); }}
                                            placeholder="ejemplo@correo.com"
                                            className={fieldErrors.email ? 'lgn-input-error' : ''}
                                            required
                                        />
                                        <ErrorSpan field="email" />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="password">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', opacity: 0.7 }}>
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Contraseña
                                        </label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                value={password}
                                                onChange={(e) => { setPassword(e.target.value); validateField('password', e.target.value); }}
                                                placeholder="••••••••"
                                                className={fieldErrors.password ? 'lgn-input-error' : ''}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                            >
                                                {showPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <ErrorSpan field="password" />
                                    </div>

                                    {!isLoginView && (
                                        <div className="form-group">
                                            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                                            <div className="password-input-wrapper">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    id="confirmPassword"
                                                    value={confirmPassword}
                                                    onChange={(e) => { setConfirmPassword(e.target.value); validateField('confirmPassword', e.target.value); }}
                                                    placeholder="••••••••"
                                                    className={fieldErrors.confirmPassword ? 'lgn-input-error' : ''}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="password-toggle"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                >
                                                    {showConfirmPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                            <circle cx="12" cy="12" r="3"></circle>
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                            <ErrorSpan field="confirmPassword" />
                                        </div>
                                    )}
                                </>
                            )}

                            {!isLoginView && registrationStep === 2 && (
                                <div className="registration-step-2">
                                    <h3>Datos Personales</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', opacity: 0.7 }}>
                                                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Nombres
                                            </label>
                                            <input
                                                type="text"
                                                value={nombres}
                                                onChange={e => { setNombres(e.target.value); validateField('nombres', e.target.value); }}
                                                placeholder="Tus nombres"
                                                className={fieldErrors.nombres ? 'lgn-input-error' : ''}
                                                required
                                            />
                                            <ErrorSpan field="nombres" />
                                        </div>
                                        <div className="form-group">
                                            <label>Apellidos</label>
                                            <input
                                                type="text"
                                                value={apellidos}
                                                onChange={e => { setApellidos(e.target.value); validateField('apellidos', e.target.value); }}
                                                placeholder="Tus apellidos"
                                                className={fieldErrors.apellidos ? 'lgn-input-error' : ''}
                                                required
                                            />
                                            <ErrorSpan field="apellidos" />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', opacity: 0.7 }}>
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Fecha de Nacimiento
                                            </label>
                                            <DatePicker
                                                selected={fechaNacimiento ? new Date(fechaNacimiento + 'T00:00:00') : null}
                                                onChange={(date) => {
                                                    if (date) {
                                                        const year = date.getFullYear();
                                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                                        const day = String(date.getDate()).padStart(2, '0');
                                                        const formattedDate = `${year}-${month}-${day}`;
                                                        setFechaNacimiento(formattedDate);
                                                        validateField('fechaNacimiento', formattedDate);
                                                    }
                                                }}
                                                maxDate={new Date()}
                                                dateFormat="dd/MM/yyyy"
                                                locale="es"
                                                placeholderText="DD/MM/AAAA"
                                                className={`date-picker-input ${fieldErrors.fechaNacimiento ? 'lgn-input-error' : ''}`}
                                                showYearDropdown
                                                scrollableYearDropdown
                                                yearDropdownItemNumber={100}
                                                autoComplete="off"
                                                onChangeRaw={(e) => e.preventDefault()}
                                            />
                                            <ErrorSpan field="fechaNacimiento" />
                                        </div>
                                        <div className="form-group">
                                            <label>
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', opacity: 0.7 }}>
                                                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <circle cx="8" cy="10" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M5 16C5 14.8954 5.89543 14 7 14H9C10.1046 14 11 14.8954 11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <line x1="14" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <line x1="14" y1="13" x2="19" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                DUI
                                            </label>
                                            <input
                                                type="text"
                                                value={dui}
                                                onChange={handleDuiChange}
                                                placeholder="00000000-0"
                                                maxLength="10"
                                                className={fieldErrors.dui ? 'lgn-input-error' : ''}
                                                required
                                            />
                                            <ErrorSpan field="dui" />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Género</label>
                                        <select
                                            value={genero}
                                            onChange={e => { setGenero(e.target.value); validateField('genero', e.target.value); }}
                                            className={`${!genero ? 'placeholder-selected' : ''} ${fieldErrors.genero ? 'lgn-input-error' : ''}`}
                                        >
                                            <option value="">Seleccione una opción</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                        </select>
                                        <ErrorSpan field="genero" />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', opacity: 0.7 }}>
                                                <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Dirección
                                        </label>
                                        <input
                                            type="text"
                                            value={direccion}
                                            onChange={e => { setDireccion(e.target.value); validateField('direccion', e.target.value); }}
                                            placeholder="Calle, colonia, ciudad"
                                            className={fieldErrors.direccion ? 'lgn-input-error' : ''}
                                            required
                                        />
                                        <ErrorSpan field="direccion" />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', opacity: 0.7 }}>
                                                <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.5953 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5864 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            value={telefono}
                                            onChange={handlePhoneChange(setTelefono, 'telefono')}
                                            placeholder="0000 0000"
                                            maxLength="8"
                                            className={fieldErrors.telefono ? 'lgn-input-error' : ''}
                                            required
                                        />
                                        <ErrorSpan field="telefono" />
                                    </div>

                                    <div className="divider"></div>
                                    <h3>Contacto de Emergencia</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Nombre Completo</label>
                                            <input
                                                type="text"
                                                value={emergenciaNombre}
                                                onChange={e => { setEmergenciaNombre(e.target.value); validateField('emergenciaNombre', e.target.value); }}
                                                placeholder="Nombre del contacto"
                                                className={fieldErrors.emergenciaNombre ? 'lgn-input-error' : ''}
                                                required
                                            />
                                            <ErrorSpan field="emergenciaNombre" />
                                        </div>
                                        <div className="form-group">
                                            <label>Teléfono</label>
                                            <input
                                                type="tel"
                                                value={emergenciaTelefono}
                                                onChange={handlePhoneChange(setEmergenciaTelefono, 'emergenciaTelefono')}
                                                placeholder="0000 0000"
                                                maxLength="8"
                                                className={fieldErrors.emergenciaTelefono ? 'lgn-input-error' : ''}
                                                required
                                            />
                                            <ErrorSpan field="emergenciaTelefono" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Parentesco</label>
                                        <select
                                            value={emergenciaParentesco}
                                            onChange={e => { setEmergenciaParentesco(e.target.value); validateField('emergenciaParentesco', e.target.value); }}
                                            className={`${!emergenciaParentesco ? 'placeholder-selected' : ''} ${fieldErrors.emergenciaParentesco ? 'lgn-input-error' : ''}`}
                                        >
                                            <option value="">Seleccione una opción</option>
                                            <option value="Esposo(a) / Cónyuge">Esposo(a) / Cónyuge</option>
                                            <option value="Padre / Madre">Padre / Madre</option>
                                            <option value="Hijo / Hija">Hijo / Hija</option>
                                            <option value="Hermano / Hermana">Hermano / Hermana</option>
                                            <option value="Abuelo / Abuela">Abuelo / Abuela</option>
                                            <option value="Tutor Legal">Tutor Legal</option>
                                            <option value="Otros">Otros</option>
                                        </select>
                                        <ErrorSpan field="emergenciaParentesco" />
                                    </div>

                                    <div className="divider"></div>
                                    <div className="form-group radio-group">
                                        <label>¿Es primera vez o paciente recurrente?</label>
                                        <div className="radio-options">
                                            <label className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="tipoPaciente"
                                                    value="primera-vez"
                                                    checked={tipoPaciente === 'primera-vez'}
                                                    onChange={e => setTipoPaciente(e.target.value)}
                                                />
                                                Primera vez
                                            </label>
                                            <label className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="tipoPaciente"
                                                    value="recurrente"
                                                    checked={tipoPaciente === 'recurrente'}
                                                    onChange={e => setTipoPaciente(e.target.value)}
                                                />
                                                Recurrente
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <p className="lgn-error-msg">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {error}
                                </p>
                            )}

                            <div className="button-group">
                                {!isLoginView && registrationStep === 2 && (
                                    <button type="button" className="login-button secondary" onClick={() => setRegistrationStep(1)}>
                                        Atrás
                                    </button>
                                )}
                                <button type="submit" className="login-button" disabled={isLoading}>
                                    {isLoading ? <span className="lgn-spinner"></span> : (isLoginView ? 'Ingresar' : (registrationStep === 1 ? 'Siguiente' : 'Finalizar Registro'))}
                                </button>
                            </div>

                            {isLoginView && (
                                <div className="forgot-password">
                                    <a href="#" onClick={(e) => { e.preventDefault(); setShowResetPassword(true); }}>¿Olvidaste tu contraseña?</a>
                                </div>
                            )}
                        </form>
                    </>
                )}

                {/* Password Reset Modal */}
                {showResetPassword && (
                    <div className="lgn-modal-overlay" onClick={() => setShowResetPassword(false)}>
                        <div className="lgn-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="lgn-modal-header">
                                <h3 className="lgn-modal-title">Recuperar Contraseña</h3>
                                <button className="lgn-modal-close" onClick={() => setShowResetPassword(false)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div className="lgn-modal-body">
                                <p className="lgn-modal-message">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
                                <form onSubmit={handleResetPassword} className="lgn-reset-form">
                                    <div className="form-group">
                                        <label htmlFor="resetEmail">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', opacity: 0.7 }}>
                                                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Correo Electrónico
                                        </label>
                                        <input
                                            type="email"
                                            id="resetEmail"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            placeholder="ejemplo@correo.com"
                                            required
                                        />
                                    </div>
                                    {resetEmail && resetMessage && (
                                        <div className={resetMessage.includes('Error') ? 'lgn-error-msg' : 'lgn-success-msg-info'}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                                                {resetMessage.includes('Error') ? (
                                                    <>
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="12" y1="8" x2="12" y2="12" />
                                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                                    </>
                                                ) : (
                                                    <polyline points="20 6 9 17 4 12" />
                                                )}
                                            </svg>
                                            {resetMessage}
                                        </div>
                                    )}
                                    <div className="lgn-modal-actions">
                                        <button type="button" className="lgn-btn-light" onClick={() => setShowResetPassword(false)}>
                                            Cancelar
                                        </button>
                                        <button type="submit" className="lgn-btn-primary" disabled={isLoading}>
                                            {isLoading ? <span className="lgn-spinner"></span> : 'Enviar Enlace'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
