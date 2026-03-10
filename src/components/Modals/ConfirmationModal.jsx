import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    details = null,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger' // 'danger', 'info', 'warning'
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirmation-overlay" onClick={onClose}>
            <div className={`confirmation-modal ${type} ${details ? 'has-details' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="confirmation-header">
                    <div className="icon-container">
                        {type === 'danger' && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        )}
                        {type === 'warning' && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        )}
                    </div>
                    <h2>{title}</h2>
                </div>
                <div className="confirmation-body">
                    {details ? (
                        <div className="confirmation-details">
                            <p className="confirmation-lead">{message}</p>
                            {details.fileName && (
                                <div className="confirmation-file-card">
                                    <span className="file-label">Archivo seleccionado</span>
                                    <span className="file-name">{details.fileName}</span>
                                </div>
                            )}
                            {Array.isArray(details.counts) && details.counts.length > 0 && (
                                <div className="confirmation-counts">
                                    {details.counts.map((item) => (
                                        <div className="count-chip" key={item.label}>
                                            <span className="count-chip-label">{item.label}</span>
                                            <span className="count-chip-value">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {details.footer && <p className="confirmation-footer-note">{details.footer}</p>}
                        </div>
                    ) : (
                        <p>{message}</p>
                    )}
                </div>
                <div className="confirmation-actions">
                    <button className="confirm-btn" onClick={onConfirm}>
                        {confirmText}
                    </button>
                    <button className="cancel-btn" onClick={onClose}>
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
