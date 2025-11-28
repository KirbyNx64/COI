import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">{title}</h3>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button className="modal-btn modal-btn-cancel" onClick={onClose}>
                        No, mantener
                    </button>
                    <button className="modal-btn modal-btn-confirm" onClick={onConfirm}>
                        Sí, cancelar cita
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
