import React, { useState } from 'react';
import './StaffModals.css';

const AddStaffModal = ({
    isOpen,
    onClose,
    onAddStaff,
    isSaving,
    saveError
}) => {
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        email: '',
        password: '',
        role: 'doctor',
        cargo: '',
        telefono: ''
    });

    const [validationError, setValidationError] = useState('');

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setValidationError('');
    };

    const handleSubmit = () => {
        if (!formData.nombres || !formData.apellidos || !formData.email || !formData.password) {
            setValidationError('Por favor, completa todos los campos obligatorios.');
            return;
        }

        if (formData.password.length < 6) {
            setValidationError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        onAddStaff(formData);
    };

    const errorMsg = saveError || validationError;

    return (
        <div className="asm-overlay" onClick={onClose}>
            <div className="asm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="asm-header">
                    <h2>Agregar Nuevo Personal</h2>
                    <button className="asm-close" onClick={onClose}>&times;</button>
                </div>

                <div className="asm-body">
                    {errorMsg && <div className="asm-error">{errorMsg}</div>}

                    <div className="asm-form-grid">
                        <div className="asm-form-group">
                            <label>Nombres *</label>
                            <input
                                type="text"
                                value={formData.nombres}
                                onChange={(e) => handleChange('nombres', e.target.value)}
                                className="asm-input"
                                placeholder="Ej: Juan Antonio"
                            />
                        </div>
                        <div className="asm-form-group">
                            <label>Apellidos *</label>
                            <input
                                type="text"
                                value={formData.apellidos}
                                onChange={(e) => handleChange('apellidos', e.target.value)}
                                className="asm-input"
                                placeholder="Ej: López Pérez"
                            />
                        </div>
                        <div className="asm-form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="asm-input"
                                placeholder="correo@ejemplo.com"
                            />
                        </div>
                        <div className="asm-form-group">
                            <label>Contraseña *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                className="asm-input"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                        <div className="asm-form-group">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                value={formData.telefono}
                                onChange={(e) => handleChange('telefono', e.target.value)}
                                className="asm-input"
                                placeholder="Ej: 7000-0000"
                            />
                        </div>
                        <div className="asm-form-group">
                            <label>Cargo / Especialidad</label>
                            <input
                                type="text"
                                value={formData.cargo}
                                onChange={(e) => handleChange('cargo', e.target.value)}
                                className="asm-input"
                                placeholder="Ej: Odontólogo General"
                            />
                        </div>
                        <div className="asm-form-group full">
                            <label>Rol en el Sistema *</label>
                            <select
                                value={formData.role}
                                onChange={(e) => handleChange('role', e.target.value)}
                                className="asm-input"
                            >
                                <option value="doctor">Médico / Doctor</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="asm-actions">
                    <button className="asm-btn asm-btn-primary" onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </button>
                    <button className="asm-btn asm-btn-ghost" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddStaffModal;
