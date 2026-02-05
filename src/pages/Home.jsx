import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { subscribeToUserAppointments, updateAppointmentStatus } from '../services/appointmentService';
import { jsPDF } from 'jspdf';
import ConfirmationModal from '../components/ConfirmationModal';
import './Home.css';

function Home({ userData }) {
    const navigate = useNavigate();
    const [scheduledAppointments, setScheduledAppointments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setIsLoading(false);
            return;
        }

        // Subscribe to real-time updates from Firebase
        const unsubscribe = subscribeToUserAppointments(user.uid, (appointments) => {
            // Sort appointments by date and time (closest first)
            const sortedAppointments = appointments.sort((a, b) => {
                const dateA = new Date(`${a.date} ${a.time} `);
                const dateB = new Date(`${b.date} ${b.time} `);
                return dateA - dateB; // Ascending order (closest first)
            });
            setScheduledAppointments(sortedAppointments);
            setIsLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const getStatusLabel = (status) => {
        const labels = {
            'programada': 'Programada',
            'terminada': 'Terminada',
            'cancelada': 'Cancelada',
            'perdida': 'Perdida'
        };
        return labels[status] || status;
    };

    const getClinicaLabel = (clinica) => {
        const labels = {
            'santa-tecla': 'Santa Tecla',
            'soyapango': 'Soyapango',
            'san-martin': 'San Martín',
            'escalon': 'Escalón',
            'usulutan': 'Usulután'
        };
        return labels[clinica] || clinica;
    };

    const handleCancelAppointment = (appointmentId) => {
        setAppointmentToCancel(appointmentId);
        setIsModalOpen(true);
    };

    const confirmCancellation = async () => {
        if (!appointmentToCancel) return;

        try {
            // Update appointment status in Firebase
            const { error } = await updateAppointmentStatus(appointmentToCancel, 'cancelada');

            if (error) {
                console.error('Error cancelling appointment:', error);
                alert('Error al cancelar la cita. Por favor, intenta de nuevo.');
            }

            // Close modal and clear state
            setIsModalOpen(false);
            setAppointmentToCancel(null);
        } catch (err) {
            console.error('Unexpected error:', err);
            alert('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
            setIsModalOpen(false);
            setAppointmentToCancel(null);
        }
    };

    const handleDownloadReceipt = async (appointment) => {
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = 210;
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let yPosition = margin;

            // Logo
            try {
                const logoPath = `${import.meta.env.BASE_URL}logo.png`;
                const response = await fetch(logoPath);
                if (response.ok) {
                    const blob = await response.blob();
                    const logoDataUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                    const logoImage = new Image();
                    await new Promise((resolve) => {
                        logoImage.onload = resolve;
                        logoImage.src = logoDataUrl;
                    });
                    const logoWidth = 40;
                    const logoHeight = (logoImage.height * logoWidth) / logoImage.width;
                    const logoX = (pageWidth - logoWidth) / 2;
                    pdf.addImage(logoDataUrl, 'PNG', logoX, yPosition, logoWidth, logoHeight);
                    yPosition += logoHeight + 15;
                }
            } catch (error) {
                console.warn('No se pudo cargar el logo:', error);
            }

            // Título
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            const title = 'COMPROBANTE DE CITA';
            const titleWidth = pdf.getTextWidth(title);
            pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
            yPosition += 10;

            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;

            // Detalles de la cita
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Detalles de la Cita', margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');

            // Paciente
            pdf.setFont('helvetica', 'bold');
            pdf.text('Paciente:', margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(appointment.patientName || 'Usuario', margin + 30, yPosition);
            yPosition += 7;

            // Motivo
            pdf.setFont('helvetica', 'bold');
            pdf.text('Motivo:', margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(appointment.reason || 'No especificado', margin + 30, yPosition);
            yPosition += 7;

            // Clínica
            pdf.setFont('helvetica', 'bold');
            pdf.text('Clínica:', margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(getClinicaLabel(appointment.clinica), margin + 30, yPosition);
            yPosition += 7;

            // Fecha
            pdf.setFont('helvetica', 'bold');
            pdf.text('Fecha:', margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(appointment.date, margin + 30, yPosition);
            yPosition += 7;

            // Hora
            pdf.setFont('helvetica', 'bold');
            pdf.text('Hora:', margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(appointment.time, margin + 30, yPosition);
            yPosition += 7;

            // Estado
            pdf.setFont('helvetica', 'bold');
            pdf.text('Estado:', margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(getStatusLabel(appointment.status), margin + 30, yPosition);
            yPosition += 10;

            // Notas
            if (appointment.notas && appointment.notas.trim()) {
                pdf.setFont('helvetica', 'bold');
                pdf.text('Notas adicionales:', margin, yPosition);
                yPosition += 6;
                pdf.setFont('helvetica', 'normal');
                const notasLines = pdf.splitTextToSize(appointment.notas, contentWidth);
                pdf.text(notasLines, margin, yPosition);
                yPosition += notasLines.length * 6 + 10;
            }

            // Notas del médico
            if (appointment.notasMedico && appointment.notasMedico.trim()) {
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0, 102, 204); // Blue color for doctor's notes
                pdf.text('Notas del Médico:', margin, yPosition);
                yPosition += 6;
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(0, 0, 0); // Back to black
                const notasMedicoLines = pdf.splitTextToSize(appointment.notasMedico, contentWidth);
                pdf.text(notasMedicoLines, margin, yPosition);
                yPosition += notasMedicoLines.length * 6 + 10;
            }

            // Línea separadora
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;

            // Información adicional
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(100, 100, 100);
            const fechaGeneracion = new Date().toLocaleDateString('es-SV', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            pdf.text(`Comprobante generado el: ${fechaGeneracion}`, margin, yPosition);

            // Guardar PDF
            const arrayBuffer = pdf.output('arraybuffer');
            const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            const fileName = `comprobante-cita-${appointment.date}.pdf`;
            link.href = pdfUrl;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(pdfUrl);
            }, 1500);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Hubo un error al generar el comprobante. Por favor intenta de nuevo.');
        }
    };

    const handleEditAppointment = (appointment) => {
        // Navegar al formulario con los datos de la cita
        navigate('/cita', { state: { editingAppointment: appointment } });
    };

    return (
        <div className="home-page">
            <div className="container">
                {/* Sección Mi Cita */}
                <section className="my-appointments-section">
                    <div className="section-header">
                        <h2 className="section-title">Mis Citas</h2>
                        {scheduledAppointments.length > 3 && (
                            <Link to="/mis-citas" className="view-more-button">
                                Ver todas
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </Link>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="spinner" style={{
                                width: '40px',
                                height: '40px',
                                border: '4px solid #f3f3f3',
                                borderTop: '4px solid #3498db',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto'
                            }}></div>
                            <p style={{ marginTop: '1rem', color: '#666' }}>Cargando citas...</p>
                        </div>
                    ) : scheduledAppointments.length > 0 ? (
                        <>
                            <div className="appointments-grid">
                                {scheduledAppointments.slice(0, 3).map((appointment) => (
                                    <div key={appointment.id} className="appointment-card">
                                        <div className="appointment-header">
                                            <div className="appointment-header-left">
                                                <div className="appointment-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                                    </svg>
                                                </div>
                                                <button
                                                    className="download-receipt-btn"
                                                    onClick={() => handleDownloadReceipt(appointment)}
                                                    title="Descargar comprobante"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 15L12 3M12 15L8 11M12 15L16 11M2 17L2 18C2 19.6569 3.34315 21 5 21L19 21C20.6569 21 22 19.6569 22 18L22 17"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <span className={`appointment-status status-${appointment.status}`}>
                                                {getStatusLabel(appointment.status)}
                                            </span>
                                        </div>
                                        <div className="appointment-details">
                                            <h3>Paciente: {appointment.patientName || 'Usuario'}</h3>
                                            <div className="appointment-info">
                                                <div className="info-item">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                                    </svg>
                                                    <span>{appointment.date}</span>
                                                </div>
                                                <div className="info-item">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                    </svg>
                                                    <span>{appointment.time}</span>
                                                </div>
                                            </div>
                                            {appointment.reason && (
                                                <p className="appointment-reason">
                                                    <strong>Motivo:</strong> {appointment.reason}
                                                </p>
                                            )}
                                            {appointment.clinica && (
                                                <p className="appointment-reason">
                                                    <strong>Clínica:</strong> {getClinicaLabel(appointment.clinica)}
                                                </p>
                                            )}
                                            {appointment.notas && appointment.notas.trim() && (
                                                <p className="appointment-reason appointment-notes">
                                                    <strong>Notas:</strong> {appointment.notas}
                                                </p>
                                            )}
                                            {appointment.notasMedico && appointment.notasMedico.trim() && (
                                                <div className="appointment-doctor-notes" style={{
                                                    backgroundColor: '#f0f9ff',
                                                    padding: '0.75rem',
                                                    borderRadius: '6px',
                                                    borderLeft: '3px solid #0066cc',
                                                    marginTop: '0.5rem'
                                                }}>
                                                    <strong style={{ color: '#0066cc' }}>Notas del Médico:</strong>
                                                    <p style={{ margin: '0.25rem 0 0 0', color: '#333' }}>
                                                        {appointment.notasMedico}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Botones de acción - solo para citas programadas */}
                                        {appointment.status === 'programada' && (
                                            <div className="appointment-actions">
                                                <button
                                                    className="btn-action btn-edit"
                                                    onClick={() => handleEditAppointment(appointment)}
                                                    title="Editar cita"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                    Editar
                                                </button>
                                                <button
                                                    className="btn-action btn-cancel"
                                                    onClick={() => handleCancelAppointment(appointment.id)}
                                                    title="Cancelar cita"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                                    </svg>
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </div>
                            <h3>No tienes citas programadas</h3>
                            <p>Agenda tu próxima cita con nosotros</p>
                            <Link to="/cita" className="cta-button">
                                Agendar Cita
                            </Link>
                        </div>
                    )}
                </section>

                {/* Sección Historial Clínico */}
                <section className="medical-history-section">
                    <h2 className="section-title">Historial Clínico</h2>
                    <div className="content-card">
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <div className="card-content">
                            <h3>Tu Historial Médico</h3>
                            <p>Aquí podrás consultar tu historial clínico completo, incluyendo diagnósticos, tratamientos realizados y notas del doctor.</p>
                            <button className="secondary-button" disabled>
                                Próximamente disponible
                            </button>
                        </div>
                    </div>
                </section>

                {/* Sección Recetas */}
                <section className="prescriptions-section">
                    <h2 className="section-title">Recetas</h2>
                    <div className="content-card">
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="12" y1="18" x2="12" y2="12"></line>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                            </svg>
                        </div>
                        <div className="card-content">
                            <h3>Tus Recetas Médicas</h3>
                            <p>Accede a todas tus recetas médicas, medicamentos prescritos y recomendaciones del doctor.</p>
                            <button className="secondary-button" disabled>
                                Próximamente disponible
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setAppointmentToCancel(null);
                }}
                onConfirm={confirmCancellation}
                title="Cancelar Cita"
                message="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer."
            />
        </div>
    );
}

export default Home;
