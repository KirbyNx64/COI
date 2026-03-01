import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import './EmailVerified.css';

export default function EmailVerified() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // 'loading' | 'success' | 'error' | 'already'
    const [status, setStatus] = useState('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const mode = searchParams.get('mode');
        const oobCode = searchParams.get('oobCode');

        // If no oobCode (user navigated directly), show success static page
        if (!oobCode || mode !== 'verifyEmail') {
            setStatus('already');
            return;
        }

        applyActionCode(auth, oobCode)
            .then(() => setStatus('success'))
            .catch((err) => {
                console.error('applyActionCode error:', err);
                if (err.code === 'auth/invalid-action-code') {
                    setErrorMsg('El enlace de verificación ya fue usado o expiró. Inicia sesión y solicita uno nuevo.');
                } else {
                    setErrorMsg('Ocurrió un error al verificar el correo. Intenta de nuevo más tarde.');
                }
                setStatus('error');
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="ev-container">
            <div className="ev-card">

                {/* Clinic logo */}
                <div className="ev-logo-wrapper">
                    <img
                        src={`${import.meta.env.BASE_URL}logo.webp`}
                        alt="Clínica Dental Dr. César Vásquez"
                        className="ev-logo"
                    />
                </div>

                {/* ── LOADING ── */}
                {status === 'loading' && (
                    <div className="ev-state-wrapper">
                        <div className="ev-spinner-ring" />
                        <h1 className="ev-title">Verificando correo…</h1>
                        <p className="ev-subtitle">Por favor espera un momento.</p>
                    </div>
                )}

                {/* ── SUCCESS ── */}
                {(status === 'success' || status === 'already') && (
                    <>
                        <div className="ev-icon-wrapper">
                            <div className="ev-circle-bg">
                                <svg
                                    className="ev-check-icon"
                                    viewBox="0 0 52 52"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle className="ev-circle" cx="26" cy="26" r="25"
                                        stroke="#22c55e" strokeWidth="2" fill="none" />
                                    <path className="ev-check" d="M14.5 27L22 34.5L37.5 19"
                                        stroke="#22c55e" strokeWidth="3"
                                        strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="ev-title">¡Correo verificado!</h1>
                        <p className="ev-subtitle">
                            Tu dirección de correo electrónico ha sido verificada exitosamente.
                            Ya puedes acceder a tu cuenta.
                        </p>

                        <div className="ev-divider" />

                        <button
                            id="ev-back-to-login-btn"
                            className="ev-back-btn"
                            onClick={() => navigate('/')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 5l-7 7 7 7" />
                            </svg>
                            Ir a inicio de sesión
                        </button>
                    </>
                )}

                {/* ── ERROR ── */}
                {status === 'error' && (
                    <>
                        <div className="ev-icon-wrapper">
                            <div className="ev-circle-bg ev-circle-bg--error">
                                <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                                    stroke="#ef4444" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="ev-title ev-title--error">Enlace inválido</h1>
                        <p className="ev-subtitle">{errorMsg}</p>

                        <div className="ev-divider" />

                        <button
                            id="ev-back-to-login-btn"
                            className="ev-back-btn"
                            onClick={() => navigate('/')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 5l-7 7 7 7" />
                            </svg>
                            Volver a inicio de sesión
                        </button>
                    </>
                )}
            </div>

            {/* Decorative blobs */}
            <div className="ev-blob ev-blob-1" aria-hidden="true" />
            <div className="ev-blob ev-blob-2" aria-hidden="true" />
        </div>
    );
}
