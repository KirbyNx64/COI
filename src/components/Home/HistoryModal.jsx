import React from 'react';
import './PatientHomeModals.css';

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
        <div className="hsm-overlay" onClick={onClose}>
            <div className="hsm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="hsm-header">
                    <h2 className="hsm-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        Mi Historial Médico
                    </h2>
                    <button className="hsm-close" onClick={onClose} aria-label="Cerrar">&times;</button>
                </div>

                <div className="hsm-body">
                    {historyItems.map((app) => (
                        <div key={app.id} className="hsm-item">
                            <div className="hsm-item-meta">
                                <span className="hsm-date">{app.date} - {app.time}</span>
                                <span className="hsm-location">{app.clinica ? getClinicaLabel(app.clinica) : ''}</span>
                            </div>
                            <div className="hsm-item-row">
                                <label>Motivo:</label>
                                <p>{app.reason || 'N/A'}</p>
                            </div>
                            {app.diagnostico ? (
                                <div className="hsm-diagnosis">
                                    <label>DIAGNÓSTICO:</label>
                                    <p>{app.diagnostico}</p>
                                </div>
                            ) : (
                                <p className="hsm-empty" style={{ padding: 0, textAlign: 'left' }}>Diagnóstico no registrado aún.</p>
                            )}
                        </div>
                    ))}
                    {historyItems.length === 0 && (
                        <p className="hsm-empty">No tienes registros médicos con diagnóstico aún.</p>
                    )}
                </div>

                <div className="hsm-footer">
                    <button className="hsm-btn-close" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
