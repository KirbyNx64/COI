import React from 'react';

const MedicalHistoryModal = ({
    isOpen,
    onClose,
    patient,
    isLoading,
    history,
    formatDate
}) => {
    if (!isOpen || !patient) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-text">
                        <h2>Historial Médico</h2>
                        <span className="patient-subtitle">{patient.nombres} {patient.apellidos}</span>
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="history-content">
                    {isLoading ? (
                        <div className="loading-history">
                            <div className="loading-spinner"></div>
                            <p>Cargando historial médico...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="empty-history">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <p>No se encontraron registros en el historial médico de este paciente.</p>
                        </div>
                    ) : (
                        <div className="history-timeline">
                            {history.map((entry) => (
                                <div key={entry.id} className={`history-card ${entry.status}`}>
                                    <div className="history-card-dot"></div>

                                    <div className="history-card-header">
                                        <div className="history-date-time">
                                            <span>{formatDate(entry.date)}</span>
                                            <span className="history-dot-separator">•</span>
                                            <span>{entry.time}</span>
                                        </div>
                                        <span className={`status-badge status-${entry.status}`}>
                                            {entry.status === 'terminada' ? 'Completada' :
                                                entry.status === 'cancelada' ? 'Cancelada' :
                                                    entry.status === 'perdida' ? 'No asistió' : 'Programada'}
                                        </span>
                                    </div>

                                    <div className="history-details-grid">
                                        <div className="history-detail-item">
                                            <span className="history-detail-label">Motivo</span>
                                            <span className="history-detail-value">{entry.reason || 'N/A'}</span>
                                        </div>
                                        <div className="history-detail-item">
                                            <span className="history-detail-label">Clínica</span>
                                            <span className="history-detail-value">{entry.clinica || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {(entry.diagnostico || entry.notasMedico || entry.recetaMedica) && (
                                        <div className="history-medical-info">
                                            {entry.diagnostico && (
                                                <div className="medical-box box-diagnosis">
                                                    <label>Diagnóstico</label>
                                                    <p>{entry.diagnostico}</p>
                                                </div>
                                            )}
                                            {entry.notasMedico && (
                                                <div className="medical-box box-observations">
                                                    <label>Observaciones</label>
                                                    <p>{entry.notasMedico}</p>
                                                </div>
                                            )}
                                            {entry.recetaMedica && (
                                                <div className="medical-box box-prescription">
                                                    <label>Receta Médica</label>
                                                    <pre>{entry.recetaMedica}</pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="modal-actions">
                    <button className="close-button" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MedicalHistoryModal;
