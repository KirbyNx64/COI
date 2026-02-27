import { jsPDF } from 'jspdf';

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

const loadLogoDataUrl = async () => {
    try {
        const logoPath = `${import.meta.env.BASE_URL}logo.png`;
        const response = await fetch(logoPath);
        if (!response.ok) return null;

        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('Failed to load logo:', e);
        return null;
    }
};

export const generateAppointmentPDF = async (appointment, isReceipt = false) => {
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

        const logoDataUrl = await loadLogoDataUrl();
        if (logoDataUrl) {
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
        }

        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        const title = isReceipt ? 'COMPROBANTE DE CITA' : 'CONFIRMACIÓN DE CITA';
        const titleWidth = pdf.getTextWidth(title);
        pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
        yPosition += 10;

        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

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

        if (clinicaInfo.address) {
            const addressLines = pdf.splitTextToSize(`Dirección: ${clinicaInfo.address}`, contentWidth);
            pdf.text(addressLines, margin, yPosition);
            yPosition += addressLines.length * 6;
        }

        yPosition += 5;
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Detalles de la Cita', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(11);

        const details = [
            { label: 'Paciente:', value: appointment.patientName || 'Usuario' },
            { label: 'Motivo:', value: motivosMap[appointment.motivo] || appointment.reason || 'No especificado' },
            { label: 'Clínica:', value: getClinicaLabel(appointment.clinica) },
            { label: 'Fecha:', value: appointment.fecha || appointment.date },
            { label: 'Hora:', value: appointment.hora || appointment.time }
        ];

        if (isReceipt) {
            details.push({ label: 'Estado:', value: getStatusLabel(appointment.status) });
        }

        details.forEach(detail => {
            pdf.setFont('helvetica', 'bold');
            pdf.text(detail.label, margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(detail.value || 'N/A', margin + 40, yPosition);
            yPosition += 7;
        });

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

        if (isReceipt && appointment.notasMedico && appointment.notasMedico.trim()) {
            yPosition += 6;
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 102, 204);
            pdf.text('Notas del Médico:', margin, yPosition);
            yPosition += 6;
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            const notasMedicoLines = pdf.splitTextToSize(appointment.notasMedico, contentWidth);
            pdf.text(notasMedicoLines, margin, yPosition);
            yPosition += notasMedicoLines.length * 6;
        }

        yPosition += 10;
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        const fechaGeneracion = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        pdf.text(`Comprobante generado el: ${fechaGeneracion}`, margin, yPosition);

        const arrayBuffer = pdf.output('arraybuffer');
        const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `comprobante-cita-${appointment.fecha || appointment.date}.pdf`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(pdfUrl);
        }, 1000);

        return { success: true };
    } catch (error) {
        console.error('Error generating PDF:', error);
        return { success: false, error };
    }
};
