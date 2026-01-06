import React, { useState } from 'react';
import { signInStaff, createStaffProfile } from '../services/staffService';
import './StaffLogin.css';

const StaffLogin = ({ onLogin }) => {
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    // Login form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Registration form fields
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [cargo, setCargo] = useState('');
    const [role, setRole] = useState('doctor');
    const [telefono, setTelefono] = useState('');

    const validateField = (name, value) => {
        if (value) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setLoading(true);

        // Validate fields
        const errors = {};
        if (!email) errors.email = 'Ingresa tu correo electrónico';
        if (!password) errors.password = 'Ingresa tu contraseña';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setLoading(false);
            return;
        }

        try {
            // Sign in with Firebase
            const { user, staffProfile, error: signInError } = await signInStaff(email, password);

            if (signInError) {
                // Handle specific error codes
                if (signInError.code === 'auth/not-staff') {
                    setError('Esta cuenta no tiene permisos de personal.');
                } else if (signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/wrong-password' || signInError.code === 'auth/user-not-found') {
                    setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
                } else if (signInError.code === 'auth/too-many-requests') {
                    setError('Demasiados intentos fallidos. Por favor, intenta más tarde.');
                } else {
                    setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
                }
                setLoading(false);
                return;
            }

            if (user && staffProfile) {
                // Successful login - call parent's onLogin callback with user and staffProfile
                onLogin(user, staffProfile);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Error inesperado. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setSuccessMessage('');
        setLoading(true);

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
            setFieldErrors(errors);
            setLoading(false);
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
                if (createError.code === 'auth/email-already-in-use') {
                    setError('Este correo electrónico ya está registrado.');
                } else if (createError.code === 'auth/invalid-email') {
                    setError('El correo electrónico no es válido.');
                } else if (createError.code === 'auth/weak-password') {
                    setError('La contraseña es demasiado débil.');
                } else {
                    setError('Error al crear la cuenta. Por favor, intenta de nuevo.');
                }
                setLoading(false);
                return;
            }

            if (success) {
                // Show success message
                setSuccessMessage('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');

                // Clear registration form
                setRegEmail('');
                setRegPassword('');
                setConfirmPassword('');
                setNombres('');
                setApellidos('');
                setCargo('');
                setRole('doctor');
                setTelefono('');

                // Switch to login mode after 2 seconds
                setTimeout(() => {
                    setMode('login');
                    setSuccessMessage('');
                }, 2000);
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('Error inesperado. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
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
                        onClick={() => {
                            setMode('login');
                            setError('');
                            setSuccessMessage('');
                            setFieldErrors({});
                        }}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        type="button"
                        className={`mode-button ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => {
                            setMode('register');
                            setError('');
                            setSuccessMessage('');
                            setFieldErrors({});
                        }}
                    >
                        Registrar Personal
                    </button>
                </div>

                {/* Success Message */}
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
                                onChange={(e) => { setEmail(e.target.value); validateField('email', e.target.value); }}
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
                                onChange={(e) => { setPassword(e.target.value); validateField('password', e.target.value); }}
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
                                    onChange={(e) => { setNombres(e.target.value); validateField('nombres', e.target.value); }}
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
                                    onChange={(e) => { setApellidos(e.target.value); validateField('apellidos', e.target.value); }}
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
                                onChange={(e) => { setRegEmail(e.target.value); validateField('regEmail', e.target.value); }}
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
                                    onChange={(e) => { setRegPassword(e.target.value); validateField('regPassword', e.target.value); }}
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
                                    onChange={(e) => { setConfirmPassword(e.target.value); validateField('confirmPassword', e.target.value); }}
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
                                    onChange={(e) => { setCargo(e.target.value); validateField('cargo', e.target.value); }}
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
                                    onChange={(e) => { setTelefono(e.target.value); validateField('telefono', e.target.value); }}
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
                                onChange={(e) => setRole(e.target.value)}
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
