import React from 'react';

const StaffEditModal = ({
    isOpen,
    onClose,
    member,
    editedMember,
    isSaving,
    saveError,
    onFieldChange,
    onSaveChanges,
    onDeactivate
}) => {
    if (!isOpen || !member || !editedMember) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content staff-edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Editar Datos del Personal</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {saveError && <div className="save-error-message">{saveError}</div>}

                    <div className="edit-form-grid">
                        <div className="form-group">
                            <label>Nombres</label>
                            <input
                                type="text"
                                value={editedMember.nombres || ''}
                                onChange={(e) => onFieldChange('nombres', e.target.value)}
                                className="edit-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Apellidos</label>
                            <input
                                type="text"
                                value={editedMember.apellidos || ''}
                                onChange={(e) => onFieldChange('apellidos', e.target.value)}
                                className="edit-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email (Solo lectura)</label>
                            <input
                                type="email"
                                value={member.email || ''}
                                disabled
                                className="edit-input disabled"
                            />
                        </div>
                        <div className="form-group">
                            <label>Rol</label>
                            <select
                                value={editedMember.role || ''}
                                onChange={(e) => onFieldChange('role', e.target.value)}
                                className="edit-input"
                            >
                                <option value="doctor">Médico</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                value={editedMember.telefono || ''}
                                onChange={(e) => onFieldChange('telefono', e.target.value)}
                                className="edit-input"
                                placeholder="Ej: 7000-0000"
                            />
                        </div>
                        <div className="form-group">
                            <label>Cargo / Especialidad</label>
                            <input
                                type="text"
                                value={editedMember.cargo || ''}
                                onChange={(e) => onFieldChange('cargo', e.target.value)}
                                className="edit-input"
                                placeholder="Ej: Odontólogo General"
                            />
                        </div>
                    </div>

                    <div className="danger-zone">
                        <h3>Acciones Avanzadas</h3>
                        <p>Desactivar la cuenta impedirá que el usuario acceda al sistema.</p>
                        <button
                            className="deactivate-btn"
                            onClick={onDeactivate}
                            disabled={isSaving}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                                <line x1="12" y1="2" x2="12" y2="12"></line>
                            </svg>
                            {member.status === 'inactive' ? 'Activar Cuenta' : 'Desactivar Cuenta'}
                        </button>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="save-button" onClick={onSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button className="cancel-button" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffEditModal;
