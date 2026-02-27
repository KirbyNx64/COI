import React from 'react';

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
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content new-patient-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Agregar Nuevo Paciente</h2>
                    <button className="modal-close" onClick={onCancel}>
                        ×
                    </button>
                </div>

                <div className="new-patient-content">
                    {createError && (
                        <div className="error-banner">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {createError}
                        </div>
                    )}

                    <div className="info-banner">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        Se enviará un correo electrónico al paciente para que establezca su contraseña.
                    </div>

                    <form className="new-patient-form">
                        <div className="form-section">
                            <h3>Información Personal</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nombres <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={newPatientData.nombres}
                                        onChange={(e) => onFieldChange('nombres', e.target.value)}
                                        placeholder="Nombres del paciente"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Apellidos <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={newPatientData.apellidos}
                                        onChange={(e) => onFieldChange('apellidos', e.target.value)}
                                        placeholder="Apellidos del paciente"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fecha de Nacimiento</label>
                                    <input
                                        type="date"
                                        value={newPatientData.fechaNacimiento}
                                        onChange={(e) => onFieldChange('fechaNacimiento', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Género</label>
                                    <select
                                        value={newPatientData.genero}
                                        onChange={(e) => onFieldChange('genero', e.target.value)}
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>DUI</label>
                                    <input
                                        type="text"
                                        value={newPatientData.dui}
                                        onChange={(e) => handleDuiChange(e.target.value)}
                                        placeholder="########-#"
                                        maxLength="10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Información de Contacto</h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Email <span className="required">*</span></label>
                                    <input
                                        type="email"
                                        value={newPatientData.email}
                                        onChange={(e) => onFieldChange('email', e.target.value)}
                                        placeholder="ejemplo@email.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Teléfono</label>
                                    <input
                                        type="text"
                                        value={newPatientData.telefono}
                                        onChange={(e) => onFieldChange('telefono', e.target.value)}
                                        placeholder="12345678"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Dirección</label>
                                    <input
                                        type="text"
                                        value={newPatientData.direccion}
                                        onChange={(e) => onFieldChange('direccion', e.target.value)}
                                        placeholder="Dirección completa"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Contacto de Emergencia</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nombre</label>
                                    <input
                                        type="text"
                                        value={newPatientData.emergenciaNombre}
                                        onChange={(e) => onFieldChange('emergenciaNombre', e.target.value)}
                                        placeholder="Nombre completo"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Teléfono</label>
                                    <input
                                        type="text"
                                        value={newPatientData.emergenciaTelefono}
                                        onChange={(e) => onFieldChange('emergenciaTelefono', e.target.value)}
                                        placeholder="12345678"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Parentesco</label>
                                    <input
                                        type="text"
                                        value={newPatientData.emergenciaParentesco}
                                        onChange={(e) => onFieldChange('emergenciaParentesco', e.target.value)}
                                        placeholder="Ej: Madre, Hermano"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="modal-actions">
                    <button
                        className="save-button"
                        onClick={onCreatePatient}
                        disabled={isCreating}
                    >
                        {isCreating ? 'Creando...' : 'Crear Paciente'}
                    </button>
                    <button
                        className="cancel-button"
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
