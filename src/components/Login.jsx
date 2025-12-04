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
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');

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
                    // Keep loading state true - don't set to false
                    // The app will navigate and unmount this component
                    onLogin(user);
                    // Don't call setIsLoading(false) here
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
                        setErrorModalMessage('Por favor, revisa los campos marcados en rojo.');
                        setShowErrorModal(true);
                        setIsLoading(false);
                        return;
                    }

                    if (password.length < 6) {
                        setFieldErrors({ password: 'La contraseña debe tener al menos 6 caracteres' });
                        setErrorModalMessage('Por favor, revisa los campos marcados en rojo.');
                        setShowErrorModal(true);
                        setIsLoading(false);
                        return;
                    }

                    if (password !== confirmPassword) {
                        setFieldErrors({ confirmPassword: 'Las contraseñas no coinciden' });
                        setErrorModalMessage('Por favor, revisa los campos marcados en rojo.');
                        setShowErrorModal(true);
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
                        setErrorModalMessage('Por favor, revisa los campos marcados en rojo.');
                        setShowErrorModal(true);
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

                    // Mark that user is about to register to prevent auto-login
                    console.log('Setting justRegistered flag BEFORE signUp');
                    sessionStorage.setItem('justRegistered', 'true');
                    console.log('Flag set:', sessionStorage.getItem('justRegistered'));

                    const { user, error: signUpError } = await signUp(email, password, registrationData);

                    if (signUpError) {
                        // Clear the flag if registration failed
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
                }
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
            setIsLoading(false);
        }
        // Don't use finally block - we want to keep loading state on successful login
    };

    const handleSuccessModalClose = async () => {
        setShowSuccessModal(false);

        // Clear the registration flag
        sessionStorage.removeItem('justRegistered');

        // Sign out the user to prevent auto-login
        await signOut();

        setIsLoginView(true);
        setRegistrationStep(1);
        setEmail('');
        setPassword('');
        setConfirmPassword('');

        // Scroll to top when returning to login view
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
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length > 9) value = value.slice(0, 9); // Limit to 9 digits

        if (value.length > 8) {
            value = value.slice(0, 8) + '-' + value.slice(8, 9);
        }
        setDui(value);
        validateField('dui', value);
    };

    const handlePhoneChange = (setter, fieldName) => (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length <= 8) {
            setter(value);
            validateField(fieldName, value);
        }
    };

    return (
        <div className="login-container">
            <div className={`login-card ${!isLoginView && registrationStep === 2 ? 'wide' : ''}`}>
                <div className="login-header">
                    <img
                        src={`${import.meta.env.BASE_URL}logo.webp`}
                        alt="Clínica Dental Dr. Cesar Vásquez"
                        className="login-logo"
                    />
                </div>

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
                    {/* LOGIN VIEW OR REGISTRATION STEP 1 */}
                    {(isLoginView || registrationStep === 1) && (
                        <>
                            <div className="form-group">
                                <label htmlFor="email">Correo Electrónico</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); validateField('email', e.target.value); }}
                                    placeholder="ejemplo@correo.com"
                                    className={fieldErrors.email ? 'input-error' : ''}
                                    required
                                />
                                {fieldErrors.email && <span className="field-error-message">{fieldErrors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Contraseña</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); validateField('password', e.target.value); }}
                                        placeholder="••••••••"
                                        className={fieldErrors.password ? 'input-error' : ''}
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
                                {fieldErrors.password && <span className="field-error-message">{fieldErrors.password}</span>}
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
                                            className={fieldErrors.confirmPassword ? 'input-error' : ''}
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
                                    {fieldErrors.confirmPassword && <span className="field-error-message">{fieldErrors.confirmPassword}</span>}
                                </div>
                            )}
                        </>
                    )}

                    {/* REGISTRATION STEP 2 */}
                    {!isLoginView && registrationStep === 2 && (
                        <div className="registration-step-2">
                            <h3>Datos Personales</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nombres</label>
                                    <input
                                        type="text"
                                        value={nombres}
                                        onChange={e => { setNombres(e.target.value); validateField('nombres', e.target.value); }}
                                        placeholder="Ingresa tus nombres"
                                        className={fieldErrors.nombres ? 'input-error' : ''}
                                        required
                                    />
                                    {fieldErrors.nombres && <span className="field-error-message">{fieldErrors.nombres}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Apellidos</label>
                                    <input
                                        type="text"
                                        value={apellidos}
                                        onChange={e => { setApellidos(e.target.value); validateField('apellidos', e.target.value); }}
                                        placeholder="Ingresa tus apellidos"
                                        className={fieldErrors.apellidos ? 'input-error' : ''}
                                        required
                                    />
                                    {fieldErrors.apellidos && <span className="field-error-message">{fieldErrors.apellidos}</span>}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fecha de Nacimiento</label>
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
                                            } else {
                                                setFechaNacimiento('');
                                            }
                                        }}
                                        maxDate={new Date()}
                                        dateFormat="dd/MM/yyyy"
                                        locale="es"
                                        placeholderText="Fecha de nacimiento"
                                        className={`date-picker-input ${fieldErrors.fechaNacimiento ? 'input-error' : ''}`}
                                        showYearDropdown
                                        scrollableYearDropdown
                                        yearDropdownItemNumber={100}
                                        autoComplete="off"
                                        onChangeRaw={(e) => e.preventDefault()}
                                    />
                                    {!fechaNacimiento && !fieldErrors.fechaNacimiento && (
                                        <span className="field-hint">Haz clic para seleccionar tu fecha de nacimiento</span>
                                    )}
                                    {fieldErrors.fechaNacimiento && <span className="field-error-message">{fieldErrors.fechaNacimiento}</span>}
                                </div>
                                <div className="form-group">
                                    <label>DUI</label>
                                    <div className="input-with-icon">
                                        <input
                                            type="text"
                                            value={dui}
                                            onChange={handleDuiChange}
                                            placeholder="00000000-0"
                                            maxLength="10"
                                            className={fieldErrors.dui ? 'input-error' : ''}
                                            required
                                        />
                                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="8" cy="10" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M5 16C5 14.8954 5.89543 14 7 14H9C10.1046 14 11 14.8954 11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <line x1="14" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <line x1="14" y1="13" x2="19" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    {fieldErrors.dui && <span className="field-error-message">{fieldErrors.dui}</span>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Género</label>
                                <select
                                    value={genero}
                                    onChange={e => { setGenero(e.target.value); validateField('genero', e.target.value); }}
                                    required
                                    className={`${!genero ? 'placeholder-selected' : ''} ${fieldErrors.genero ? 'input-error' : ''}`}
                                >
                                    <option value="">Seleccione una opción</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                </select>
                                {fieldErrors.genero && <span className="field-error-message">{fieldErrors.genero}</span>}
                            </div>

                            <div className="form-group">
                                <label>Dirección</label>
                                <div className="input-with-icon">
                                    <input
                                        type="text"
                                        value={direccion}
                                        onChange={e => { setDireccion(e.target.value); validateField('direccion', e.target.value); }}
                                        placeholder="Calle, colonia, ciudad"
                                        className={fieldErrors.direccion ? 'input-error' : ''}
                                        required
                                    />
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                {fieldErrors.direccion && <span className="field-error-message">{fieldErrors.direccion}</span>}
                            </div>

                            <div className="form-group">
                                <label>Teléfono</label>
                                <div className="input-with-icon">
                                    <input
                                        type="tel"
                                        value={telefono}
                                        onChange={handlePhoneChange(setTelefono, 'telefono')}
                                        placeholder="00000000"
                                        maxLength="8"
                                        className={fieldErrors.telefono ? 'input-error' : ''}
                                        required
                                    />
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.5953 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5864 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                {fieldErrors.telefono && <span className="field-error-message">{fieldErrors.telefono}</span>}
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
                                        placeholder="Nombre completo del contacto"
                                        className={fieldErrors.emergenciaNombre ? 'input-error' : ''}
                                        required
                                    />
                                    {fieldErrors.emergenciaNombre && <span className="field-error-message">{fieldErrors.emergenciaNombre}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Teléfono</label>
                                    <div className="input-with-icon">
                                        <input
                                            type="tel"
                                            value={emergenciaTelefono}
                                            onChange={handlePhoneChange(setEmergenciaTelefono, 'emergenciaTelefono')}
                                            placeholder="00000000"
                                            maxLength="8"
                                            className={fieldErrors.emergenciaTelefono ? 'input-error' : ''}
                                            required
                                        />
                                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.5953 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5864 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    {fieldErrors.emergenciaTelefono && <span className="field-error-message">{fieldErrors.emergenciaTelefono}</span>}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Parentesco</label>
                                <select
                                    value={emergenciaParentesco}
                                    onChange={e => { setEmergenciaParentesco(e.target.value); validateField('emergenciaParentesco', e.target.value); }}
                                    required
                                    className={`${!emergenciaParentesco ? 'placeholder-selected' : ''} ${fieldErrors.emergenciaParentesco ? 'input-error' : ''}`}
                                >
                                    <option value="">Seleccione una opción</option>
                                    <option value="Esposo(a) / Cónyuge">Esposo(a) / Cónyuge</option>
                                    <option value="Padre / Madre">Padre / Madre</option>
                                    <option value="Hijo / Hija">Hijo / Hija</option>
                                    <option value="Hermano / Hermana">Hermano / Hermana</option>
                                    <option value="Abuelo / Abuela">Abuelo / Abuela</option>
                                    <option value="Nieto / Nieta">Nieto / Nieta</option>
                                    <option value="Tutor Legal">Tutor Legal</option>
                                    <option value="Apoderado de Salud">Apoderado de Salud</option>
                                    <option value="Tío / Tía">Tío / Tía</option>
                                    <option value="Sobrino / Sobrina">Sobrino / Sobrina</option>
                                    <option value="Primo / Prima">Primo / Prima</option>
                                    <option value="Amigo / Amiga">Amigo / Amiga</option>
                                </select>
                                {fieldErrors.emergenciaParentesco && <span className="field-error-message">{fieldErrors.emergenciaParentesco}</span>}
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

                    {error && <p className="error-message">{error}</p>}

                    <div className="button-group">
                        {!isLoginView && registrationStep === 2 && (
                            <button type="button" className="login-button secondary" onClick={() => setRegistrationStep(1)}>
                                Atrás
                            </button>
                        )}
                        <button type="submit" className="login-button" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Cargando...
                                </>
                            ) : (isLoginView ? 'Ingresar' : (registrationStep === 1 ? 'Siguiente' : 'Finalizar Registro'))}
                        </button>
                    </div>

                    {isLoginView && (
                        <div className="forgot-password">
                            <a href="#" onClick={(e) => { e.preventDefault(); setShowResetPassword(true); }}>¿Olvidaste tu contraseña?</a>
                        </div>
                    )}
                </form>

                {/* Password Reset Modal */}
                {showResetPassword && (
                    <div className="modal-overlay" onClick={() => setShowResetPassword(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>Recuperar Contraseña</h3>
                            <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
                            <form onSubmit={handleResetPassword}>
                                <div className="form-group">
                                    <label htmlFor="resetEmail">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        id="resetEmail"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="ejemplo@correo.com"
                                        required
                                    />
                                </div>
                                {resetMessage && <p className={resetMessage.includes('Error') ? 'error-message' : 'success-message'}>{resetMessage}</p>}
                                <div className="button-group">
                                    <button type="button" className="login-button secondary" onClick={() => setShowResetPassword(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="login-button" disabled={isLoading}>
                                        {isLoading ? 'Enviando...' : 'Enviar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="modal-overlay" onClick={handleSuccessModalClose}>
                        <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
                            <h3 className="modal-title">¡Registro exitoso!</h3>
                            <p className="modal-message">
                                Hemos enviado un correo de verificación a tu dirección de email.
                                Por favor, verifica tu correo antes de iniciar sesión.
                            </p>
                            <div className="modal-actions">
                                <button className="modal-btn modal-btn-confirm" onClick={handleSuccessModalClose}>
                                    Aceptar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Modal */}
                {showErrorModal && (
                    <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
                        <div className="modal-content error-modal" onClick={(e) => e.stopPropagation()}>
                            <h3 className="modal-title">Error en el formulario</h3>
                            <p className="modal-message">
                                {errorModalMessage}
                            </p>
                            <div className="modal-actions">
                                <button className="modal-btn modal-btn-confirm" onClick={() => setShowErrorModal(false)}>
                                    Aceptar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
