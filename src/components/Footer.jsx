import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    {/* Logo y descripción */}
                    <div className="footer-section">
                        <h3 className="footer-clinic-name">Clínica Dental Dr. César Vásquez</h3>
                        <p className="footer-description">
                            Odontólogos forjando mejores sonrisas
                        </p>
                    </div>

                    {/* Información de contacto */}
                    <div className="footer-section">
                        <h3>Contacto Principal</h3>
                        <div className="contact-info">
                            <div className="contact-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                <a href="https://wa.me/50369877192" target="_blank" rel="noopener noreferrer">
                                    +503 6987-7192
                                </a>
                            </div>
                            <div className="contact-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=clinicadrcesarvasquez@gmail.com" target="_blank" rel="noopener noreferrer">
                                    clinicadrcesarvasquez@gmail.com
                                </a>
                            </div>
                            <div className="contact-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <a href="https://maps.app.goo.gl/i2YfiyNUtEfRD2QE6" target="_blank" rel="noopener noreferrer">
                                    Centro comercial Daniel Hernández, nivel 2, local 12, Santa Tecla, La Libertad
                                </a>
                            </div>
                        </div>
                        <div className="social-links">
                            <a href="https://www.facebook.com/ClinicadentalDrCesarV/?locale=es_LA" target="_blank" rel="noopener noreferrer" className="social-link">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                </svg>
                            </a>
                            <a href="https://www.instagram.com/drcesarvasquez/#" target="_blank" rel="noopener noreferrer" className="social-link">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Horarios */}
                    <div className="footer-section">
                        <h3>Horarios</h3>
                        <div className="schedule">
                            <div className="schedule-item">
                                <span className="day">Lunes - Sábado</span>
                                <span className="time">7:30 AM - 12:00 PM</span>
                            </div>
                            <div className="schedule-item">
                                <span className="day"></span>
                                <span className="time">1:00 PM - 4:00 PM</span>
                            </div>
                            <div className="schedule-item">
                                <span className="day">Domingo</span>
                                <span className="time">Cerrado</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2025 Clínica Dental Dr. Cesar Vásquez. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
