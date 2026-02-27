import { useLocation, Link } from 'react-router-dom';
import { generateAppointmentPDF } from '../utils/pdfGenerator';
import './AppointmentConfirmation.css';

const motivosMap = {
    'evaluacion': 'Evaluación',
    'control': 'Control de rutina',
    'dolor': 'Dolor en alguna pieza',
    'endodoncia': 'Endodoncia',
    'limpieza': 'Limpieza',
    'rellenos': 'Rellenos',
    'cirugia': 'Cirugía de cordal',
    'otro': 'Otro'
};

const clinicasMap = {
    'santa-tecla': { name: 'Clínica Dental Dr. César Vásquez' },
    'soyapango': { name: 'Clínica Dental Dr. César Vásquez Soyapango' },
    'san-martin': { name: 'Clínica Dental Dr. César Vásquez San Martín' },
    'escalon': { name: 'Clínica Dental OsDent' },
    'usulutan': { name: 'Clínica Dental Dr. César Vásquez Usulután' }
};

function AppointmentConfirmation() {
    const location = useLocation();
    const { appointment } = location.state || {};

    if (!appointment) {
        return (
            <div className="confirmation-page">
                <div className="container">
                    <div className="confirmation-card error">
                        <h2>No se encontró información de la cita</h2>
                        <p>Parece que has llegado aquí por error.</p>
                        <Link to="/cita" className="btn-primary">Agendar Cita</Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleDownloadPDF = async () => {
        const result = await generateAppointmentPDF(appointment);
        if (!result.success) {
            alert('Hubo un error al generar el comprobante. Por favor intenta de nuevo.');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('es-SV', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="cnf-page">
            <div className="cnf-container">
                <div className="cnf-card">
                    <div className="cnf-success-box">
                        <div className="cnf-success-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="cnf-title">¡Cita Agendada!</h1>
                    <p className="cnf-subtitle">
                        Hemos recibido tu solicitud. Te contactaremos pronto para confirmar los detalles finales.
                    </p>

                    <SummaryBox appointment={appointment} formatDate={formatDate} />

                    <div className="cnf-actions">
                        <Link to="/" className="cnf-btn cnf-btn-secondary">Volver al Inicio</Link>
                        <button onClick={handleDownloadPDF} className="cnf-btn cnf-btn-primary" aria-label="Descargar comprobante en PDF">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }} aria-hidden="true">
                                <path d="M12 15L12 3M12 15L8 11M12 15L16 11M2 17L2 18C2 19.6569 3.34315 21 5 21L19 21C20.6569 21 22 19.6569 22 18L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Descargar Comprobante</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryBox({ appointment, formatDate }) {
    return (
        <div className="cnf-details-container">
            <h3 className="cnf-details-title">Resumen de la Cita</h3>

            <div className="cnf-detail-grid">
                <DetailItem label="Motivo" value={motivosMap[appointment.motivo] || appointment.motivo} />
                <DetailItem label="Clínica" value={clinicasMap[appointment.clinica]?.name || appointment.clinica} />
                <DetailItem
                    label="Fecha"
                    value={formatDate(appointment.fecha)}
                    icon={<CalendarIcon />}
                />
                <DetailItem
                    label="Hora"
                    value={appointment.hora}
                    icon={<ClockIcon />}
                />
            </div>

            {appointment.notas && (
                <div className="cnf-notes-box">
                    <span className="cnf-label">Notas adicionales</span>
                    <p className="cnf-notes">{appointment.notas}</p>
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value, icon }) {
    return (
        <div className="cnf-detail-item">
            <span className="cnf-label">{label}</span>
            <div className={icon ? "cnf-value-box" : ""}>
                {icon}
                <span className="cnf-value">{value}</span>
            </div>
        </div>
    );
}

function CalendarIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cnf-inline-icon" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cnf-inline-icon" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

export default AppointmentConfirmation;
