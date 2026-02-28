import React from 'react';
import './PatientHomeModals.css';

const PrescriptionModal = ({ isOpen, onClose, appointments }) => {
    if (!isOpen) return null;

    const prescriptions = [...appointments]
        .filter(app => app.recetaMedica && app.recetaMedica.trim())
        .sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB - dateA;
        })
        .slice(0, 5);

    return (
        <div className="prm-overlay" onClick={onClose}>
            <div className="prm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="prm-header">
                    <h2 className="prm-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="18" x2="12" y2="12"></line>
                            <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                        Tus Recetas Médicas
                    </h2>
                    <button className="prm-close" onClick={onClose} aria-label="Cerrar">&times;</button>
                </div>

                <div className="prm-body">
                    {prescriptions.map((app, index) => (
                        <div key={app.id} className={`prm-item ${index === 0 ? 'latest' : ''}`}>
                            <div className="prm-item-meta">
                                <span className="prm-date">Cita del {app.date}</span>
                                <span className="prm-badge">{index === 0 ? 'Más reciente' : 'Anterior'}</span>
                            </div>
                            <pre className="prm-content">{app.recetaMedica}</pre>
                        </div>
                    ))}
                    {prescriptions.length === 0 && (
                        <p className="prm-empty">No tienes recetas médicas registradas aún.</p>
                    )}
                </div>

                <div className="prm-footer">
                    <button className="prm-btn-close" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionModal;
