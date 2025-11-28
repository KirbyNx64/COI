import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [registrationStep, setRegistrationStep] = useState(1);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

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

    const validateField = (name, value) => {
        if (value) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        if (isLoginView) {
            // LOGIN LOGIC
            if (email && password) {
                onLogin(email, password);
            } else {
                setError('Por favor, completa todos los campos.');
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
                    return;
                }

                if (password !== confirmPassword) {
                    setError('Las contraseñas no coinciden.');
                    return;
                }
                // Move to Step 2
                setRegistrationStep(2);
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

                if (Object.keys(errors).length > 0) {
                    setFieldErrors(errors);
                    return;
                }

                // Prepare registration data
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

                // Simulate registration success and auto-login with user data
                onLogin(email, password, registrationData);
            }
        }
    };

    const handleTabChange = (isLogin) => {
        setIsLoginView(isLogin);
        setError('');
        setRegistrationStep(1); // Reset step when switching tabs
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
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); validateField('password', e.target.value); }}
                                    placeholder="••••••••"
                                    className={fieldErrors.password ? 'input-error' : ''}
                                    required
                                />
                                {fieldErrors.password && <span className="field-error-message">{fieldErrors.password}</span>}
                            </div>

                            {!isLoginView && (
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); validateField('confirmPassword', e.target.value); }}
                                        placeholder="••••••••"
                                        className={fieldErrors.confirmPassword ? 'input-error' : ''}
                                        required
                                    />
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
                                        className={fieldErrors.apellidos ? 'input-error' : ''}
                                        required
                                    />
                                    {fieldErrors.apellidos && <span className="field-error-message">{fieldErrors.apellidos}</span>}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fecha de Nacimiento</label>
                                    <input
                                        type="date"
                                        value={fechaNacimiento}
                                        onChange={e => { setFechaNacimiento(e.target.value); validateField('fechaNacimiento', e.target.value); }}
                                        className={fieldErrors.fechaNacimiento ? 'input-error' : ''}
                                        required
                                    />
                                    {fieldErrors.fechaNacimiento && <span className="field-error-message">{fieldErrors.fechaNacimiento}</span>}
                                </div>
                                <div className="form-group">
                                    <label>DUI</label>
                                    <input
                                        type="text"
                                        value={dui}
                                        onChange={handleDuiChange}
                                        placeholder="00000000-0"
                                        maxLength="10"
                                        className={fieldErrors.dui ? 'input-error' : ''}
                                        required
                                    />
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
                                <input
                                    type="text"
                                    value={direccion}
                                    onChange={e => { setDireccion(e.target.value); validateField('direccion', e.target.value); }}
                                    className={fieldErrors.direccion ? 'input-error' : ''}
                                    required
                                />
                                {fieldErrors.direccion && <span className="field-error-message">{fieldErrors.direccion}</span>}
                            </div>

                            <div className="form-group">
                                <label>Teléfono</label>
                                <input
                                    type="tel"
                                    value={telefono}
                                    onChange={handlePhoneChange(setTelefono, 'telefono')}
                                    placeholder="00000000"
                                    maxLength="8"
                                    className={fieldErrors.telefono ? 'input-error' : ''}
                                    required
                                />
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
                                        className={fieldErrors.emergenciaNombre ? 'input-error' : ''}
                                        required
                                    />
                                    {fieldErrors.emergenciaNombre && <span className="field-error-message">{fieldErrors.emergenciaNombre}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Teléfono</label>
                                    <input
                                        type="tel"
                                        value={emergenciaTelefono}
                                        onChange={handlePhoneChange(setEmergenciaTelefono, 'emergenciaTelefono')}
                                        maxLength="8"
                                        className={fieldErrors.emergenciaTelefono ? 'input-error' : ''}
                                        required
                                    />
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
                        <button type="submit" className="login-button">
                            {isLoginView ? 'Ingresar' : (registrationStep === 1 ? 'Siguiente' : 'Finalizar Registro')}
                        </button>
                    </div>

                    {isLoginView && (
                        <div className="forgot-password">
                            <a href="#">¿Olvidaste tu contraseña?</a>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;
