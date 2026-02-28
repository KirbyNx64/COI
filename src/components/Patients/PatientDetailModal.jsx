import React from 'react';
import './PatientDetailModal.css';

const PatientDetailModal = ({
    isOpen,
    onClose,
    patient,
    editedPatient,
    isEditMode,
    isSaving,
    saveError,
    onEditClick,
    onCancelEdit,
    onFieldChange,
    onSaveChanges,
    onScheduleAppointment,
    onViewHistory,
    formatDate,
    handleCopyUid,
    copiedUid
}) => {
    if (!isOpen || !patient || !editedPatient) return null;

    const handleEditDuiChange = (value) => {
        let cleaned = value.replace(/\D/g, '').substring(0, 9);
        if (cleaned.length > 8) {
            cleaned = cleaned.substring(0, 8) + '-' + cleaned.substring(8);
        }
        onFieldChange('dui', cleaned);
    };

    return (
        <div className="pdm-overlay" onClick={() => !isEditMode && onClose()}>
            <div className="pdm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pdm-header">
                    <h2>{isEditMode ? 'Editar Paciente' : 'Detalles del Paciente'}</h2>
                    <button
                        className="pdm-close"
                        onClick={() => !isEditMode && onClose()}
                        disabled={isEditMode}
                    >
                        ×
                    </button>
                </div>

                <div className="pdm-body">
                    {saveError && (
                        <div className="pdm-save-error">{saveError}</div>
                    )}

                    {/* Información Personal */}
                    <div className="pdm-section">
                        <h3>Información Personal</h3>
                        <div className="pdm-grid">
                            <div className="pdm-field">
                                <label>Nombres</label>
                                {isEditMode ? (
                                    <input
                                        type="text"
                                        value={editedPatient.nombres || ''}
                                        onChange={(e) => onFieldChange('nombres', e.target.value)}
                                        className="pdm-edit-input"
                                    />
                                ) : (
                                    <span>{patient.nombres}</span>
                                )}
                            </div>
                            <div className="pdm-field">
                                <label>Apellidos</label>
                                {isEditMode ? (
                                    <input
                                        type="text"
                                        value={editedPatient.apellidos || ''}
                                        onChange={(e) => onFieldChange('apellidos', e.target.value)}
                                        className="pdm-edit-input"
                                    />
                                ) : (
                                    <span>{patient.apellidos}</span>
                                )}
                            </div>
                            <div className="pdm-field">
                                <label>Fecha de Nacimiento</label>
                                {isEditMode ? (
                                    <input
                                        type="date"
                                        value={editedPatient.fechaNacimiento || ''}
                                        onChange={(e) => onFieldChange('fechaNacimiento', e.target.value)}
                                        className="pdm-edit-input"
                                    />
                                ) : (
                                    <span>{formatDate(patient.fechaNacimiento)}</span>
                                )}
                            </div>
                            <div className="pdm-field">
                                <label>Género</label>
                                {isEditMode ? (
                                    <select
                                        value={editedPatient.genero || ''}
                                        onChange={(e) => onFieldChange('genero', e.target.value)}
                                        className="pdm-edit-input"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                ) : (
                                    <span>{patient.genero || 'N/A'}</span>
                                )}
                            </div>
                            <div className="pdm-field">
                                <label>DUI</label>
                                {isEditMode ? (
                                    <input
                                        type="text"
                                        value={editedPatient.dui || ''}
                                        onChange={(e) => handleEditDuiChange(e.target.value)}
                                        className="pdm-edit-input"
                                        placeholder="########-#"
                                        maxLength="10"
                                    />
                                ) : (
                                    <span>{patient.dui || 'N/A'}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Información de Contacto */}
                    <div className="pdm-section">
                        <h3>Información de Contacto</h3>
                        <div className="pdm-grid">
                            <div className="pdm-field">
                                <label>Email</label>
                                {isEditMode ? (
                                    <input
                                        type="email"
                                        value={editedPatient.email || ''}
                                        onChange={(e) => onFieldChange('email', e.target.value)}
                                        className="pdm-edit-input"
                                        placeholder="ejemplo@email.com"
                                    />
                                ) : (
                                    <span>{patient.email}</span>
                                )}
                            </div>
                            <div className="pdm-field">
                                <label>Teléfono</label>
                                {isEditMode ? (
                                    <input
                                        type="text"
                                        value={editedPatient.telefono || ''}
                                        onChange={(e) => onFieldChange('telefono', e.target.value)}
                                        className="pdm-edit-input"
                                        placeholder="12345678"
                                    />
                                ) : (
                                    <span>{patient.telefono || 'N/A'}</span>
                                )}
                            </div>
                            <div className="pdm-field pdm-full">
                                <label>Dirección</label>
                                {isEditMode ? (
                                    <input
                                        type="text"
                                        value={editedPatient.direccion || ''}
                                        onChange={(e) => onFieldChange('direccion', e.target.value)}
                                        className="pdm-edit-input"
                                        placeholder="Dirección completa"
                                    />
                                ) : (
                                    <span>{patient.direccion || 'N/A'}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contacto de Emergencia */}
                    <div className="pdm-section">
                        <h3>Contacto de Emergencia</h3>
                        <div className="pdm-grid">
                            <div className="pdm-field">
                                <label>Nombre</label>
                                {isEditMode ? (
                                    <input
                                        type="text"
                                        value={editedPatient.emergenciaNombre || ''}
                                        onChange={(e) => onFieldChange('emergenciaNombre', e.target.value)}
                                        className="pdm-edit-input"
                                        placeholder="Nombre completo"
                                    />
                                ) : (
                                    <span>{patient.emergenciaNombre || 'N/A'}</span>
                                )}
                            </div>
                            <div className="pdm-field">
                                <label>Teléfono</label>
                                {isEditMode ? (
                                    <input
                                        type="text"
                                        value={editedPatient.emergenciaTelefono || ''}
                                        onChange={(e) => onFieldChange('emergenciaTelefono', e.target.value)}
                                        className="pdm-edit-input"
                                        placeholder="12345678"
                                    />
                                ) : (
                                    <span>{patient.emergenciaTelefono || 'N/A'}</span>
                                )}
                            </div>
                            <div className="pdm-field">
                                <label>Parentesco</label>
                                {isEditMode ? (
                                    <input
                                        type="text"
                                        value={editedPatient.emergenciaParentesco || ''}
                                        onChange={(e) => onFieldChange('emergenciaParentesco', e.target.value)}
                                        className="pdm-edit-input"
                                        placeholder="Ej: Madre, Hermano"
                                    />
                                ) : (
                                    <span>{patient.emergenciaParentesco || 'N/A'}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Información Adicional */}
                    <div className="pdm-section">
                        <h3>Información Adicional</h3>
                        <div className="pdm-grid">
                            <div className="pdm-field">
                                <label>Tipo de Paciente</label>
                                {isEditMode ? (
                                    <select
                                        value={editedPatient.tipoPaciente || ''}
                                        onChange={(e) => onFieldChange('tipoPaciente', e.target.value)}
                                        className="pdm-edit-input"
                                    >
                                        <option value="primera-vez">Primera vez</option>
                                        <option value="subsecuente">Subsecuente</option>
                                    </select>
                                ) : (
                                    <span className={`pdm-patient-type ${patient.tipoPaciente}`}>
                                        {patient.tipoPaciente === 'primera-vez' ? 'Primera vez' : 'Subsecuente'}
                                    </span>
                                )}
                            </div>
                            <div className="pdm-field">
                                <label>Fecha de Registro</label>
                                <span>{formatDate(patient.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Información Técnica */}
                    <div className="pdm-section pdm-section-technical">
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                <line x1="8" y1="21" x2="16" y2="21"></line>
                                <line x1="12" y1="17" x2="12" y2="21"></line>
                            </svg>
                            Información Técnica
                        </h3>
                        <div className="pdm-grid">
                            <div className="pdm-field pdm-full">
                                <label>UID del Usuario</label>
                                <div className="pdm-uid-row">
                                    <span className="pdm-technical-value">{patient.id || 'N/A'}</span>
                                    <button
                                        className={`pdm-copy-btn ${copiedUid ? 'pdm-copied' : ''}`}
                                        onClick={() => handleCopyUid(patient.id)}
                                        title="Copiar UID"
                                    >
                                        {copiedUid ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                            </svg>
                                        )}
                                        {copiedUid ? '¡Copiado!' : 'Copiar'}
                                    </button>
                                </div>
                            </div>
                            <div className="pdm-field">
                                <label>Fecha de Creación</label>
                                <span className="pdm-technical-value">
                                    {patient.createdAt ? new Date(patient.createdAt).toLocaleString('es-SV', {
                                        year: 'numeric', month: '2-digit', day: '2-digit',
                                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                                    }) : 'N/A'}
                                </span>
                            </div>
                            {patient.updatedAt && (
                                <div className="pdm-field">
                                    <label>Última Actualización</label>
                                    <span className="pdm-technical-value">
                                        {new Date(patient.updatedAt).toLocaleString('es-SV', {
                                            year: 'numeric', month: '2-digit', day: '2-digit',
                                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pdm-actions">
                    {isEditMode ? (
                        <>
                            <button
                                className="pdm-btn pdm-btn-save"
                                onClick={onSaveChanges}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                            <button
                                className="pdm-btn pdm-btn-ghost"
                                onClick={onCancelEdit}
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="pdm-btn pdm-btn-primary"
                                onClick={() => onScheduleAppointment(patient)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                Programar Cita
                            </button>
                            <button
                                className="pdm-btn pdm-btn-primary"
                                onClick={() => onViewHistory(patient)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                Historial Médico
                            </button>
                            <button
                                className="pdm-btn pdm-btn-primary"
                                onClick={onEditClick}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                </svg>
                                Editar
                            </button>
                            <button
                                className="pdm-btn pdm-btn-ghost"
                                onClick={onClose}
                            >
                                Cerrar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDetailModal;
