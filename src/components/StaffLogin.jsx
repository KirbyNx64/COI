import { useReducer } from 'react';
import { signInStaff, createStaffProfile } from '../services/staffService';
import './StaffLogin.css';

const initialState = {
    mode: 'login', // 'login' or 'register'
    loading: false,
    error: '',
    successMessage: '',
    fieldErrors: {},
    // Login form fields
    email: '',
    password: '',
    // Registration form fields
    regEmail: '',
    regPassword: '',
    confirmPassword: '',
    nombres: '',
    apellidos: '',
    cargo: '',
    role: 'doctor',
    telefono: ''
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_FIELD':
            return {
                ...state,
                [action.field]: action.value,
                fieldErrors: {
                    ...state.fieldErrors,
                    [action.field]: ''
                }
            };
        case 'SET_MODE':
            return {
                ...initialState,
                mode: action.payload
            };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'SET_SUCCESS':
            return { ...state, successMessage: action.payload, loading: false };
        case 'SET_FIELD_ERRORS':
            return { ...state, fieldErrors: action.payload, loading: false };
        case 'CLEAR_REG_FORM':
            return {
                ...state,
                regEmail: '',
                regPassword: '',
                confirmPassword: '',
                nombres: '',
                apellidos: '',
                cargo: '',
                role: 'doctor',
                telefono: ''
            };
        default:
            return state;
    }
}

const StaffLogin = ({ onLogin }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        mode, loading, error, successMessage, fieldErrors,
        email, password, regEmail, regPassword, confirmPassword,
        nombres, apellidos, cargo, role, telefono
    } = state;

    const handleFieldChange = (field, value) => {
        dispatch({ type: 'SET_FIELD', field, value });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        dispatch({ type: 'SET_FIELD_ERRORS', payload: {} });
        dispatch({ type: 'SET_LOADING', payload: true });

        // Validate fields
        const errors = {};
        if (!email) errors.email = 'Ingresa tu correo electrónico';
        if (!password) errors.password = 'Ingresa tu contraseña';

        if (Object.keys(errors).length > 0) {
            dispatch({ type: 'SET_FIELD_ERRORS', payload: errors });
            return;
        }

        try {
            // Sign in with Firebase
            const { user, staffProfile, error: signInError } = await signInStaff(email, password);

            if (signInError) {
                // Handle specific error codes
                let errorMessage = 'Error al iniciar sesión. Por favor, intenta de nuevo.';
                if (signInError.code === 'auth/not-staff') {
                    errorMessage = 'Esta cuenta no tiene permisos de personal.';
                } else if (signInError.code === 'auth/account-inactive') {
                    errorMessage = signInError.message || 'Tu cuenta ha sido desactivada. Por favor contacta al administrador.';
                } else if (signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/wrong-password' || signInError.code === 'auth/user-not-found') {
                    errorMessage = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
                } else if (signInError.code === 'auth/too-many-requests') {
                    errorMessage = 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
                }
                dispatch({ type: 'SET_ERROR', payload: errorMessage });
                return;
            }

            if (user && staffProfile) {
                // Successful login - call parent's onLogin callback
                onLogin(user, staffProfile);
            }
        } catch (err) {
            console.error('Login error:', err);
            dispatch({ type: 'SET_ERROR', payload: 'Error inesperado. Por favor, intenta de nuevo.' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        dispatch({ type: 'SET_FIELD_ERRORS', payload: {} });
        dispatch({ type: 'SET_LOADING', payload: true });

        // Validate fields
        const errors = {};
        if (!regEmail) errors.regEmail = 'Ingresa el correo electrónico';
        if (!regPassword) errors.regPassword = 'Ingresa la contraseña';
        if (!confirmPassword) errors.confirmPassword = 'Confirma la contraseña';
        if (regPassword && confirmPassword && regPassword !== confirmPassword) {
            errors.confirmPassword = 'Las contraseñas no coinciden';
        }
        if (regPassword && regPassword.length < 6) {
            errors.regPassword = 'La contraseña debe tener al menos 6 caracteres';
        }
        if (!nombres) errors.nombres = 'Ingresa los nombres';
        if (!apellidos) errors.apellidos = 'Ingresa los apellidos';
        if (!cargo) errors.cargo = 'Ingresa el cargo';
        if (!telefono) errors.telefono = 'Ingresa el teléfono';

        if (Object.keys(errors).length > 0) {
            dispatch({ type: 'SET_FIELD_ERRORS', payload: errors });
            return;
        }

        try {
            // Create staff profile with Firebase
            const { success, error: createError } = await createStaffProfile(
                regEmail,
                regPassword,
                {
                    nombres,
                    apellidos,
                    cargo,
                    role,
                    telefono
                }
            );

            if (createError) {
                // Handle specific error codes
                let errorMessage = 'Error al crear la cuenta. Por favor, intenta de nuevo.';
                if (createError.code === 'auth/email-already-in-use') {
                    errorMessage = 'Este correo electrónico ya está registrado.';
                } else if (createError.code === 'auth/invalid-email') {
                    errorMessage = 'El correo electrónico no es válido.';
                } else if (createError.code === 'auth/weak-password') {
                    errorMessage = 'La contraseña es demasiado débil.';
                }
                dispatch({ type: 'SET_ERROR', payload: errorMessage });
                return;
            }

            if (success) {
                // Show success message
                dispatch({ type: 'SET_SUCCESS', payload: '¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.' });

                // Clear registration form
                dispatch({ type: 'CLEAR_REG_FORM' });

                // Switch to login mode after 2 seconds
                setTimeout(() => {
                    dispatch({ type: 'SET_MODE', payload: 'login' });
                }, 2000);
            }
        } catch (err) {
            console.error('Registration error:', err);
            dispatch({ type: 'SET_ERROR', payload: 'Error inesperado. Por favor, intenta de nuevo.' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    return (
        <div className="staff-login-container">
            <div className="staff-login-card">
                <div className="staff-login-header">
                    <img
                        src={`${import.meta.env.BASE_URL}logo.webp`}
                        alt="Clínica Dental Dr. Cesar Vásquez"
                        className="staff-login-logo"
                    />
                </div>

                {/* Mode Toggle */}
                <div className="mode-toggle">
                    <button
                        type="button"
                        className={`mode-button ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => dispatch({ type: 'SET_MODE', payload: 'login' })}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        type="button"
                        className={`mode-button ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => dispatch({ type: 'SET_MODE', payload: 'register' })}
                    >
                        Registrar Personal
                    </button>
                </div>

                {/* Success Message Banner */}
                {successMessage && (
                    <div className="success-message-banner">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        {successMessage}
                    </div>
                )}

                {/* Login Form */}
                {mode === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="staff-login-form" noValidate>
                        <div className="form-group">
                            <label htmlFor="email">Correo Electrónico</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                placeholder="ejemplo@correo.com"
                                className={fieldErrors.email ? 'input-error' : ''}
                                disabled={loading}
                                required
                            />
                            {fieldErrors.email && <span className="field-error-message">{fieldErrors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Contraseña</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => handleFieldChange('password', e.target.value)}
                                placeholder="••••••••"
                                className={fieldErrors.password ? 'input-error' : ''}
                                disabled={loading}
                                required
                            />
                            {fieldErrors.password && <span className="field-error-message">{fieldErrors.password}</span>}
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <button type="submit" className="staff-login-button" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Cargando...
                                </>
                            ) : (
                                'Ingresar'
                            )}
                        </button>
                    </form>
                )}

                {/* Registration Form */}
                {mode === 'register' && (
                    <form onSubmit={handleRegisterSubmit} className="staff-login-form staff-register-form" noValidate>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="nombres">Nombres</label>
                                <input
                                    type="text"
                                    id="nombres"
                                    value={nombres}
                                    onChange={(e) => handleFieldChange('nombres', e.target.value)}
                                    placeholder="Juan Carlos"
                                    className={fieldErrors.nombres ? 'input-error' : ''}
                                    disabled={loading}
                                    required
                                />
                                {fieldErrors.nombres && <span className="field-error-message">{fieldErrors.nombres}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="apellidos">Apellidos</label>
                                <input
                                    type="text"
                                    id="apellidos"
                                    value={apellidos}
                                    onChange={(e) => handleFieldChange('apellidos', e.target.value)}
                                    placeholder="García López"
                                    className={fieldErrors.apellidos ? 'input-error' : ''}
                                    disabled={loading}
                                    required
                                />
                                {fieldErrors.apellidos && <span className="field-error-message">{fieldErrors.apellidos}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="regEmail">Correo Electrónico</label>
                            <input
                                type="email"
                                id="regEmail"
                                value={regEmail}
                                onChange={(e) => handleFieldChange('regEmail', e.target.value)}
                                placeholder="ejemplo@correo.com"
                                className={fieldErrors.regEmail ? 'input-error' : ''}
                                disabled={loading}
                                required
                            />
                            {fieldErrors.regEmail && <span className="field-error-message">{fieldErrors.regEmail}</span>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="regPassword">Contraseña</label>
                                <input
                                    type="password"
                                    id="regPassword"
                                    value={regPassword}
                                    onChange={(e) => handleFieldChange('regPassword', e.target.value)}
                                    placeholder="••••••••"
                                    className={fieldErrors.regPassword ? 'input-error' : ''}
                                    disabled={loading}
                                    required
                                />
                                {fieldErrors.regPassword && <span className="field-error-message">{fieldErrors.regPassword}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                                    placeholder="••••••••"
                                    className={fieldErrors.confirmPassword ? 'input-error' : ''}
                                    disabled={loading}
                                    required
                                />
                                {fieldErrors.confirmPassword && <span className="field-error-message">{fieldErrors.confirmPassword}</span>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="cargo">Cargo</label>
                                <input
                                    type="text"
                                    id="cargo"
                                    value={cargo}
                                    onChange={(e) => handleFieldChange('cargo', e.target.value)}
                                    placeholder="Ej: Odontólogo, Asistente"
                                    className={fieldErrors.cargo ? 'input-error' : ''}
                                    disabled={loading}
                                    required
                                />
                                {fieldErrors.cargo && <span className="field-error-message">{fieldErrors.cargo}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="telefono">Teléfono</label>
                                <input
                                    type="tel"
                                    id="telefono"
                                    value={telefono}
                                    onChange={(e) => handleFieldChange('telefono', e.target.value)}
                                    placeholder="7777-7777"
                                    className={fieldErrors.telefono ? 'input-error' : ''}
                                    disabled={loading}
                                    required
                                />
                                {fieldErrors.telefono && <span className="field-error-message">{fieldErrors.telefono}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="role">Rol</label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => handleFieldChange('role', e.target.value)}
                                className="form-select"
                                disabled={loading}
                            >
                                <option value="doctor">Doctor</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <button type="submit" className="staff-login-button" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Creando cuenta...
                                </>
                            ) : (
                                'Crear Cuenta'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default StaffLogin;
