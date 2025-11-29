import React, { useState } from 'react';
import './StaffLogin.css';

const StaffLogin = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    // Staff users for testing (in production, this would come from backend)
    const staffUsers = [
        {
            email: 'admin@clinica.com',
            password: 'admin123',
            type: 'admin',
            nombre: 'María González',
            cargo: 'Administradora'
        },
        {
            email: 'doctor@clinica.com',
            password: 'doctor123',
            type: 'doctor',
            nombre: 'Dr. César Vásquez',
            cargo: 'Odontólogo'
        }
    ];

    const validateField = (name, value) => {
        if (value) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Validate fields
        const errors = {};
        if (!email) errors.email = 'Ingresa tu correo electrónico';
        if (!password) errors.password = 'Ingresa tu contraseña';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        // Validate credentials against staff users
        const user = staffUsers.find(u => u.email === email && u.password === password);

        if (user) {
            // Successful login
            onLogin(email, password, null, user.type, {
                nombre: user.nombre,
                cargo: user.cargo
            });
        } else {
            setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
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

                <form onSubmit={handleSubmit} className="staff-login-form" noValidate>
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

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="staff-login-button">
                        Ingresar
                    </button>

                    <div className="staff-login-info">
                        <p className="info-text">
                            <strong>Usuarios de prueba:</strong><br />
                            Admin: admin@clinica.com / admin123<br />
                            Doctor: doctor@clinica.com / doctor123
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StaffLogin;
