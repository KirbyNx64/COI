import React from 'react';

const SuccessModal = ({ isOpen, onClose, message, submessage }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
                <div className="success-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h3>{message || 'Operación exitosa'}</h3>
                {submessage && <p>{submessage}</p>}
                <button className="success-button" onClick={onClose}>
                    Aceptar
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
