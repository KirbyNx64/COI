import { useLocation, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import './AppointmentConfirmation.css';

function AppointmentConfirmation() {
    const location = useLocation();
    const { appointment } = location.state || {};

    // Mapeo de motivos
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

    // Mapeo de clínicas con información completa
    const clinicasMap = {
        'santa-tecla': {
            name: 'Clínica Dental Dr. César Vásquez',
            location: 'Santa Tecla',
            phones: ['+503 6987 7192', '+503 2522 0893'],
            address: 'Centro comercial Daniel Hernández, nivel 2, local 12, Santa Tecla, La Libertad.'
        },
        'soyapango': {
            name: 'Clínica Dental Dr. César Vásquez Soyapango',
            location: 'Soyapango',
            phones: ['+503 6052 5078'],
            address: 'Plaza San Miguel, Local #43, nivel 2, Soyapango, San Salvador.'
        },
        'san-martin': {
            name: 'Clínica Dental Dr. César Vásquez San Martín',
            location: 'San Martín',
            phones: ['+503 7531 6018', '+503 2221 6018'],
            address: 'Plaza Tineca, local 10, Colonia San Luis, Calle Miguel Román Peña, San Martín, San Salvador.'
        },
        'escalon': {
            name: 'Clínica Dental OsDent',
            location: 'Escalón',
            phones: ['+503 6822 9372'],
            address: '79 av norte y paseo Gral Escalón, edificio 4104, local 7 y 8 segunda planta, San Salvador.'
        },
        'usulutan': {
            name: 'Clínica Dental Dr. César Vásquez Usulután',
            location: 'Usulután',
            phones: ['+503 6050 1327', '+503 2662 4230'],
            address: 'Avenida Guandique 6 y 19 calle pte, Edificio "Las Margaritas" Nivel 1 Local #7 y #8. Ex Departamental del MINED, media cuadra debajo de la Escuela Basilio Blandón, Frente a Tabú-2 Express'
        }
    };

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

    const loadLogoDataUrl = async () => {
        const logoPath = `${import.meta.env.BASE_URL}logo.png`;
        const response = await fetch(logoPath);
        if (!response.ok) {
            throw new Error('No se pudo obtener el logo');
        }
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleDownloadPDF = async () => {
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = 210; // A4 width in mm
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let yPosition = margin;

            // Cargar y agregar logo
            try {
                const logoDataUrl = await loadLogoDataUrl();
                const logoImage = new Image();
                await new Promise((resolve, reject) => {
                    logoImage.onload = resolve;
                    logoImage.onerror = reject;
                    logoImage.src = logoDataUrl;
                });
                const logoWidth = 40;
                const logoHeight = (logoImage.height * logoWidth) / logoImage.width;
                const logoX = (pageWidth - logoWidth) / 2;

                pdf.addImage(logoDataUrl, 'PNG', logoX, yPosition, logoWidth, logoHeight);
                yPosition += logoHeight + 15;
            } catch (error) {
                console.warn('No se pudo cargar el logo:', error);
                // Continuar sin logo
            }

            // Título
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            const title = 'COMPROBANTE DE CITA';
            const titleWidth = pdf.getTextWidth(title);
            pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
            yPosition += 10;

            // Línea separadora
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;

            // Información de la clínica
            const clinicaInfo = clinicasMap[appointment.clinica] || { name: appointment.clinica, location: '', phones: [], address: '' };

            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Información de la Clínica', margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');
            pdf.text(clinicaInfo.name || 'Clínica Dental Dr. César Vásquez', margin, yPosition);
            yPosition += 6;

            if (clinicaInfo.location) {
                pdf.setFont('helvetica', 'italic');
                pdf.text(`Ubicación: ${clinicaInfo.location}`, margin, yPosition);
                yPosition += 6;
            }

            if (clinicaInfo.phones && clinicaInfo.phones.length > 0) {
                pdf.setFont('helvetica', 'normal');
                pdf.text(`Teléfono: ${clinicaInfo.phones.join(' / ')}`, margin, yPosition);
                yPosition += 6;
            }

            if (clinicaInfo.address) {
                pdf.setFont('helvetica', 'normal');
                const addressLines = pdf.splitTextToSize(`Dirección: ${clinicaInfo.address}`, contentWidth);
                pdf.text(addressLines, margin, yPosition);
                yPosition += addressLines.length * 6;
            }

            yPosition += 5;

            // Línea separadora
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

            // Motivo
            const motivoLabel = motivosMap[appointment.motivo] || appointment.motivo;
            pdf.setFont('helvetica', 'bold');
            pdf.text('Motivo:', margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(motivoLabel, margin + 30, yPosition);
            yPosition += 7;

            // Clínica
            pdf.setFont('helvetica', 'bold');
            pdf.text('Clínica:', margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(clinicaInfo.name || appointment.clinica, margin + 30, yPosition);
            yPosition += 7;

            // Fecha
            pdf.setFont('helvetica', 'bold');
            pdf.text('Fecha:', margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            const fechaFormateada = new Date(appointment.fecha + 'T00:00:00').toLocaleDateString('es-SV', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            pdf.text(fechaFormateada, margin + 30, yPosition);
            yPosition += 7;

            // Hora
            pdf.setFont('helvetica', 'bold');
            pdf.text('Hora:', margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(appointment.hora, margin + 30, yPosition);
            yPosition += 7;

            // Notas (si existen)
            if (appointment.notas && appointment.notas.trim()) {
                yPosition += 3;
                pdf.setFont('helvetica', 'bold');
                pdf.text('Notas adicionales:', margin, yPosition);
                yPosition += 6;
                pdf.setFont('helvetica', 'normal');
                const notasLines = pdf.splitTextToSize(appointment.notas, contentWidth);
                pdf.text(notasLines, margin, yPosition);
                yPosition += notasLines.length * 6;
            }

            yPosition += 10;

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
            yPosition += 6;

            pdf.text('Este comprobante es una confirmación de tu solicitud de cita.', margin, yPosition);
            yPosition += 6;
            pdf.text('Te contactaremos pronto para confirmar los detalles.', margin, yPosition);

            // Guardar PDF asegurando el tipo correcto
            const arrayBuffer = pdf.output('arraybuffer');
            const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            const fileName = `comprobante-cita-${appointment.fecha}.pdf`;
            link.href = pdfUrl;
            link.setAttribute('href', pdfUrl);
            link.download = fileName;
            link.setAttribute('download', fileName);
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

    return (
        <div className="confirmation-page">
            <div className="container">
                <div className="confirmation-card">
                    <div className="success-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1>¡Cita Agendada Exitosamente!</h1>
                    <p className="confirmation-message">
                        Hemos recibido tu solicitud. Te contactaremos pronto para confirmar los detalles.
                    </p>

                    <div className="appointment-details">
                        <h3>Detalles de la Cita</h3>
                        <div className="detail-row">
                            <span className="label">Motivo:</span>
                            <span className="value">{motivosMap[appointment.motivo] || appointment.motivo}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Clínica:</span>
                            <span className="value">{clinicasMap[appointment.clinica]?.name || appointment.clinica}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Fecha:</span>
                            <span className="value">
                                {new Date(appointment.fecha + 'T00:00:00').toLocaleDateString('es-SV', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Hora:</span>
                            <span className="value">{appointment.hora}</span>
                        </div>
                        {appointment.notas && (
                            <div className="detail-row">
                                <span className="label">Notas:</span>
                                <span className="value">{appointment.notas}</span>
                            </div>
                        )}
                    </div>

                    <div className="actions">
                        <Link to="/" className="btn-secondary">Volver al Inicio</Link>
                        <button onClick={handleDownloadPDF} className="btn-primary">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'text-bottom' }}>
                                <path d="M12 15L12 3M12 15L8 11M12 15L16 11M2 17L2 18C2 19.6569 3.34315 21 5 21L19 21C20.6569 21 22 19.6569 22 18L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Descargar Comprobante
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AppointmentConfirmation;
