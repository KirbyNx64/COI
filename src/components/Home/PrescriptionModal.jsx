import React from 'react';

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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="prescription-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="18" x2="12" y2="12"></line>
                            <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                        Tus Recetas Médicas
                    </h2>
                    <button className="close-modal-btn" onClick={onClose} aria-label="Cerrar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    {prescriptions.map((app, index) => (
                        <div key={app.id} className={`prescription-item ${index === 0 ? 'latest' : ''}`}>
                            <div className="item-meta">
                                <span className="item-date">Cita del {app.date}</span>
                                <span className="item-badge">{index === 0 ? 'Más reciente' : 'Anterior'}</span>
                            </div>
                            <pre className="prescription-content">{app.recetaMedica}</pre>
                        </div>
                    ))}
                    {prescriptions.length === 0 && (
                        <p className="empty-message">No tienes recetas médicas registradas aún.</p>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="modal-close-btn btn-green" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionModal;
