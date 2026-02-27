import React, { useState } from 'react';

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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content staff-edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Agregar Nuevo Personal</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {(saveError || validationError) && (
                        <div className="save-error-message">
                            {saveError || validationError}
                        </div>
                    )}

                    <div className="edit-form-grid">
                        <div className="form-group">
                            <label>Nombres *</label>
                            <input
                                type="text"
                                value={formData.nombres}
                                onChange={(e) => handleChange('nombres', e.target.value)}
                                className="edit-input"
                                placeholder="Ej: Juan Antonio"
                            />
                        </div>
                        <div className="form-group">
                            <label>Apellidos *</label>
                            <input
                                type="text"
                                value={formData.apellidos}
                                onChange={(e) => handleChange('apellidos', e.target.value)}
                                className="edit-input"
                                placeholder="Ej: López Pérez"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="edit-input"
                                placeholder="correo@ejemplo.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Contraseña *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                className="edit-input"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                value={formData.telefono}
                                onChange={(e) => handleChange('telefono', e.target.value)}
                                className="edit-input"
                                placeholder="Ej: 7000-0000"
                            />
                        </div>
                        <div className="form-group">
                            <label>Cargo / Especialidad</label>
                            <input
                                type="text"
                                value={formData.cargo}
                                onChange={(e) => handleChange('cargo', e.target.value)}
                                className="edit-input"
                                placeholder="Ej: Odontólogo General"
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Rol en el Sistema *</label>
                            <select
                                value={formData.role}
                                onChange={(e) => handleChange('role', e.target.value)}
                                className="edit-input"
                            >
                                <option value="doctor">Médico / Doctor</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="save-button" onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </button>
                    <button className="cancel-button" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddStaffModal;
