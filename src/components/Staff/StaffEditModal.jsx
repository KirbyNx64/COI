import React from 'react';
import './StaffModals.css';

const StaffEditModal = ({
    isOpen,
    onClose,
    member,
    editedMember,
    isSaving,
    isUploadingPhoto,
    saveError,
    onFieldChange,
    onPhotoUpload,
    onSaveChanges,
    onDeactivate
}) => {
    if (!isOpen || !member || !editedMember) return null;

    return (
        <div className="sem-overlay" onClick={onClose}>
            <div className="sem-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sem-header">
                    <h2>Editar Datos del Personal</h2>
                    <button className="sem-close" onClick={onClose}>&times;</button>
                </div>

                <div className="sem-body">
                    {saveError && <div className="sem-error">{saveError}</div>}

                    {/* Sección de foto */}
                    <div className="sem-avatar-section">
                        <input
                            type="file"
                            id="sem-photo-upload"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={onPhotoUpload}
                            style={{ display: 'none' }}
                            disabled={isUploadingPhoto || isSaving}
                        />
                        <label htmlFor="sem-photo-upload" className="sem-avatar-label">
                            {isUploadingPhoto ? (
                                <div className="sem-upload-spinner" style={{ width: '40px', height: '40px' }}></div>
                            ) : editedMember.photoURL ? (
                                <>
                                    <img src={editedMember.photoURL} alt={editedMember.nombres} />
                                    <div className="sem-photo-overlay">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                            <circle cx="12" cy="13" r="4"></circle>
                                        </svg>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="sem-avatar-placeholder">{editedMember.nombres?.charAt(0) || 'U'}</span>
                                    <div className="sem-photo-overlay">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                            <circle cx="12" cy="13" r="4"></circle>
                                        </svg>
                                    </div>
                                </>
                            )}
                        </label>
                        <div className="sem-avatar-info">
                            <h3>Foto de Perfil</h3>
                            <p>Haz clic en la imagen para cambiarla (JPG, PNG, max 5MB)</p>
                        </div>
                    </div>

                    {/* Formulario */}
                    <div className="sem-form-grid">
                        <div className="sem-form-group">
                            <label>Nombres</label>
                            <input
                                type="text"
                                value={editedMember.nombres || ''}
                                onChange={(e) => onFieldChange('nombres', e.target.value)}
                                className="sem-input"
                            />
                        </div>
                        <div className="sem-form-group">
                            <label>Apellidos</label>
                            <input
                                type="text"
                                value={editedMember.apellidos || ''}
                                onChange={(e) => onFieldChange('apellidos', e.target.value)}
                                className="sem-input"
                            />
                        </div>
                        <div className="sem-form-group">
                            <label>Email (Solo lectura)</label>
                            <input
                                type="email"
                                value={member.email || ''}
                                disabled
                                className="sem-input sem-disabled"
                            />
                        </div>
                        <div className="sem-form-group">
                            <label>Rol</label>
                            <select
                                value={editedMember.role || ''}
                                onChange={(e) => onFieldChange('role', e.target.value)}
                                className="sem-input"
                            >
                                <option value="doctor">Médico</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <div className="sem-form-group">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                value={editedMember.telefono || ''}
                                onChange={(e) => onFieldChange('telefono', e.target.value)}
                                className="sem-input"
                                placeholder="Ej: 7000-0000"
                            />
                        </div>
                        <div className="sem-form-group">
                            <label>Cargo / Especialidad</label>
                            <input
                                type="text"
                                value={editedMember.cargo || ''}
                                onChange={(e) => onFieldChange('cargo', e.target.value)}
                                className="sem-input"
                                placeholder="Ej: Odontólogo General"
                            />
                        </div>
                    </div>

                    {/* Zona de peligro */}
                    <div className="sem-danger-zone">
                        <h3>Acciones Avanzadas</h3>
                        <p>Desactivar la cuenta impedirá que el usuario acceda al sistema.</p>
                        <button
                            className="sem-deactivate-btn"
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

                <div className="sem-actions">
                    <button className="sem-btn sem-btn-primary" onClick={onSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button className="sem-btn sem-btn-ghost" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffEditModal;
