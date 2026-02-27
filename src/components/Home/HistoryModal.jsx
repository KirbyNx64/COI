import React from 'react';

const HistoryModal = ({ isOpen, onClose, appointments, getClinicaLabel }) => {
    if (!isOpen) return null;

    const historyItems = [...appointments]
        .filter(app => (app.status === 'terminada' || app.diagnostico))
        .sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB - dateA;
        });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="history-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        Mi Historial Médico (Diagnósticos)
                    </h2>
                    <button className="close-modal-btn" onClick={onClose} aria-label="Cerrar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    {historyItems.map((app) => (
                        <div key={app.id} className="history-item">
                            <div className="item-meta">
                                <span className="item-date">{app.date} - {app.time}</span>
                                <span className="item-location">{app.clinica ? getClinicaLabel(app.clinica) : ''}</span>
                            </div>
                            <div className="history-reason">
                                <label>Motivo:</label>
                                <p>{app.reason || 'N/A'}</p>
                            </div>
                            {app.diagnostico ? (
                                <div className="history-diagnosis">
                                    <label>DIAGNÓSTICO:</label>
                                    <p>{app.diagnostico}</p>
                                </div>
                            ) : (
                                <p className="history-unregistered">Diagnóstico no registrado aún.</p>
                            )}
                        </div>
                    ))}
                    {historyItems.length === 0 && (
                        <p className="history-empty-message">No tienes registros médicos terminados o con diagnóstico aún.</p>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="modal-close-btn btn-orange" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
