import React from 'react';
import './NewPatientModal.css';

const NewPatientModal = ({
    isOpen,
    onClose,
    newPatientData,
    isCreating,
    createError,
    onFieldChange,
    onCreatePatient,
    onCancel
}) => {
    if (!isOpen) return null;

    const handleDuiChange = (value) => {
        let cleaned = value.replace(/\D/g, '').substring(0, 9);
        if (cleaned.length > 8) {
            cleaned = cleaned.substring(0, 8) + '-' + cleaned.substring(8);
        }
        onFieldChange('dui', cleaned);
    };

    return (
        <div className="npm-overlay" onClick={onCancel}>
            <div className="npm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="npm-header">
                    <h2>Agregar Nuevo Paciente</h2>
                    <button className="npm-close" onClick={onCancel}>×</button>
                </div>

                <div className="npm-body">
                    {createError && (
                        <div className="npm-error-banner">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {createError}
                        </div>
                    )}

                    <div className="npm-info-banner">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        Se enviará un correo electrónico al paciente para que establezca su contraseña.
                    </div>

                    <form className="npm-form" onSubmit={(e) => e.preventDefault()}>
                        {/* Información Personal */}
                        <div className="npm-section">
                            <h3>Información Personal</h3>
                            <div className="npm-grid">
                                <div className="npm-form-group">
                                    <label>Nombres <span className="npm-required">*</span></label>
                                    <input
                                        type="text"
                                        className="npm-input"
                                        value={newPatientData.nombres}
                                        onChange={(e) => onFieldChange('nombres', e.target.value)}
                                        placeholder="Nombres del paciente"
                                        required
                                    />
                                </div>
                                <div className="npm-form-group">
                                    <label>Apellidos <span className="npm-required">*</span></label>
                                    <input
                                        type="text"
                                        className="npm-input"
                                        value={newPatientData.apellidos}
                                        onChange={(e) => onFieldChange('apellidos', e.target.value)}
                                        placeholder="Apellidos del paciente"
                                        required
                                    />
                                </div>
                                <div className="npm-form-group">
                                    <label>Fecha de Nacimiento</label>
                                    <input
                                        type="date"
                                        className="npm-input"
                                        value={newPatientData.fechaNacimiento}
                                        onChange={(e) => onFieldChange('fechaNacimiento', e.target.value)}
                                    />
                                </div>
                                <div className="npm-form-group">
                                    <label>Género</label>
                                    <select
                                        className="npm-input"
                                        value={newPatientData.genero}
                                        onChange={(e) => onFieldChange('genero', e.target.value)}
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div className="npm-form-group">
                                    <label>DUI</label>
                                    <input
                                        type="text"
                                        className="npm-input"
                                        value={newPatientData.dui}
                                        onChange={(e) => handleDuiChange(e.target.value)}
                                        placeholder="########-#"
                                        maxLength="10"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Información de Contacto */}
                        <div className="npm-section">
                            <h3>Información de Contacto</h3>
                            <div className="npm-grid">
                                <div className="npm-form-group full">
                                    <label>Email <span className="npm-required">*</span></label>
                                    <input
                                        type="email"
                                        className="npm-input"
                                        value={newPatientData.email}
                                        onChange={(e) => onFieldChange('email', e.target.value)}
                                        placeholder="ejemplo@email.com"
                                        required
                                    />
                                </div>
                                <div className="npm-form-group">
                                    <label>Teléfono</label>
                                    <input
                                        type="text"
                                        className="npm-input"
                                        value={newPatientData.telefono}
                                        onChange={(e) => onFieldChange('telefono', e.target.value)}
                                        placeholder="12345678"
                                    />
                                </div>
                                <div className="npm-form-group full">
                                    <label>Dirección</label>
                                    <input
                                        type="text"
                                        className="npm-input"
                                        value={newPatientData.direccion}
                                        onChange={(e) => onFieldChange('direccion', e.target.value)}
                                        placeholder="Dirección completa"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contacto de Emergencia */}
                        <div className="npm-section">
                            <h3>Contacto de Emergencia</h3>
                            <div className="npm-grid">
                                <div className="npm-form-group">
                                    <label>Nombre</label>
                                    <input
                                        type="text"
                                        className="npm-input"
                                        value={newPatientData.emergenciaNombre}
                                        onChange={(e) => onFieldChange('emergenciaNombre', e.target.value)}
                                        placeholder="Nombre completo"
                                    />
                                </div>
                                <div className="npm-form-group">
                                    <label>Teléfono</label>
                                    <input
                                        type="text"
                                        className="npm-input"
                                        value={newPatientData.emergenciaTelefono}
                                        onChange={(e) => onFieldChange('emergenciaTelefono', e.target.value)}
                                        placeholder="12345678"
                                    />
                                </div>
                                <div className="npm-form-group">
                                    <label>Parentesco</label>
                                    <input
                                        type="text"
                                        className="npm-input"
                                        value={newPatientData.emergenciaParentesco}
                                        onChange={(e) => onFieldChange('emergenciaParentesco', e.target.value)}
                                        placeholder="Ej: Madre, Hermano"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="npm-actions">
                    <button
                        className="npm-btn npm-btn-primary"
                        onClick={onCreatePatient}
                        disabled={isCreating}
                    >
                        {isCreating ? 'Creando...' : 'Crear Paciente'}
                    </button>
                    <button
                        className="npm-btn npm-btn-ghost"
                        onClick={onCancel}
                        disabled={isCreating}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewPatientModal;
