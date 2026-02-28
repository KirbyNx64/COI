import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Get appointments by date range with optional filters
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {object} filters - Optional filters (status, clinic, searchTerm)
 * @returns {Promise<{appointments, error}>}
 */
export const getAppointmentsByDateRange = async (startDate, endDate, filters = {}) => {
    try {
        const constraints = [];

        // Date range — server-side
        if (startDate && endDate) {
            constraints.push(where('date', '>=', startDate));
            constraints.push(where('date', '<=', endDate));
        }

        // Status filter — server-side
        if (filters.status && filters.status !== 'all') {
            constraints.push(where('status', '==', filters.status));
        }

        // Clinic filter — server-side
        if (filters.clinic && filters.clinic !== 'all') {
            constraints.push(where('clinica', '==', filters.clinic));
        }

        const q = query(collection(db, 'appointments'), ...constraints);
        const querySnapshot = await getDocs(q);

        let appointments = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            appointments.push({ id: doc.id, ...data });
        });

        // Text search — client-side (Firestore doesn't support partial text search)
        if (filters.searchTerm && filters.searchTerm.trim() !== '') {
            const searchLower = filters.searchTerm.toLowerCase().replace(/-/g, '');
            appointments = appointments.filter(apt => {
                const patientName = (apt.patientName || '').toLowerCase();
                const reason = (apt.reason || '').toLowerCase();
                const dui = (apt.patientDui || apt.dui || '').toLowerCase().replace(/-/g, '');
                return patientName.includes(searchLower) ||
                    reason.includes(searchLower) ||
                    dui.includes(searchLower);
            });
        }

        // Sort by date descending — client-side (avoids composite index requirement)
        appointments.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB - dateA;
        });

        return { appointments, error: null };
    } catch (error) {
        console.error('Error getting appointments by date range:', error);
        return { appointments: [], error };
    }
};

/**
 * Generate report statistics from appointments
 * @param {Array} appointments - Array of appointments
 * @returns {object} Statistics object
 */
export const generateReportStatistics = (appointments) => {
    const stats = {
        total: appointments.length,
        byStatus: {
            programada: 0,
            terminada: 0,
            cancelada: 0,
            perdida: 0
        },
        byClinic: {}
    };

    appointments.forEach(apt => {
        // Count by status
        if (stats.byStatus.hasOwnProperty(apt.status)) {
            stats.byStatus[apt.status]++;
        }

        // Count by clinic
        if (apt.clinica) {
            stats.byClinic[apt.clinica] = (stats.byClinic[apt.clinica] || 0) + 1;
        }
    });

    // Calculate percentages
    stats.percentages = {
        programada: stats.total > 0 ? ((stats.byStatus.programada / stats.total) * 100).toFixed(1) : 0,
        terminada: stats.total > 0 ? ((stats.byStatus.terminada / stats.total) * 100).toFixed(1) : 0,
        cancelada: stats.total > 0 ? ((stats.byStatus.cancelada / stats.total) * 100).toFixed(1) : 0,
        perdida: stats.total > 0 ? ((stats.byStatus.perdida / stats.total) * 100).toFixed(1) : 0
    };

    return stats;
};

/**
 * Format appointments for export
 * @param {Array} appointments - Array of appointments
 * @returns {Array} Formatted appointments
 */
export const formatAppointmentsForExport = (appointments) => {
    return appointments.map(apt => ({
        Fecha: apt.date,
        Hora: apt.time,
        Paciente: apt.patientName || 'N/A',
        DUI: apt.patientDui || apt.dui || 'N/A',
        Clínica: getClinicaLabel(apt.clinica),
        Motivo: apt.reason || 'N/A',
        Estado: getStatusLabel(apt.status),
        Notas: apt.notas || ''
    }));
};

/**
 * Export appointments to PDF
 * @param {Array} appointments - Array of appointments
 * @param {object} filters - Applied filters
 * @param {object} stats - Report statistics
 */
export const exportToPDF = (appointments, filters, stats) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte de Citas', 14, 22);

    // Date range
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    let yPos = 32;

    if (filters.startDate && filters.endDate) {
        doc.text(`Periodo: ${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`, 14, yPos);
        yPos += 7;
    }

    // Applied filters
    const appliedFilters = [];
    if (filters.status && filters.status !== 'all') {
        appliedFilters.push(`Estado: ${getStatusLabel(filters.status)}`);
    }
    if (filters.clinic && filters.clinic !== 'all') {
        appliedFilters.push(`Clinica: ${getClinicaLabel(filters.clinic)}`);
    }

    if (appliedFilters.length > 0) {
        doc.text(`Filtros: ${appliedFilters.join(', ')}`, 14, yPos);
        yPos += 7;
    }

    // Statistics
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Resumen Estadistico', 14, yPos + 5);
    yPos += 12;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Total de citas: ${stats.total}`, 14, yPos);
    yPos += 6;
    doc.text(`Programadas: ${stats.byStatus.programada} (${stats.percentages.programada}%)`, 14, yPos);
    yPos += 6;
    doc.text(`Terminadas: ${stats.byStatus.terminada} (${stats.percentages.terminada}%)`, 14, yPos);
    yPos += 6;
    doc.text(`Canceladas: ${stats.byStatus.cancelada} (${stats.percentages.cancelada}%)`, 14, yPos);
    yPos += 6;
    doc.text(`Perdidas: ${stats.byStatus.perdida} (${stats.percentages.perdida}%)`, 14, yPos);
    yPos += 10;

    // Table
    const tableData = appointments.map(apt => [
        apt.date,
        apt.time,
        apt.patientName || 'N/A',
        apt.patientDui || apt.dui || 'N/A',
        getClinicaLabel(apt.clinica),
        apt.reason || 'N/A',
        getStatusLabel(apt.status)
    ]);

    const tableColumns = ['Fecha', 'Hora', 'Paciente', 'DUI', 'Clinica', 'Motivo', 'Estado'];

    doc.autoTable({
        startY: yPos,
        head: [tableColumns],
        body: tableData,
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [44, 82, 130],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        margin: { top: 10 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Pagina ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString('es-SV')}`,
            14,
            doc.internal.pageSize.height - 10
        );
    }

    // Save
    const fileName = `reporte_citas_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};

/**
 * Export appointments to Excel
 * @param {Array} appointments - Array of appointments
 * @param {object} filters - Applied filters
 * @param {object} stats - Report statistics
 */
export const exportToExcel = (appointments, filters, stats) => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // 1. Executive Summary Sheet
    const summaryHeader = [
        ['CENTRO ODONTOLÓGICO - REPORTE DE GESTIÓN'],
        [''],
        ['INFORMACIÓN DEL REPORTE'],
        ['Período:', filters.startDate && filters.endDate ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}` : 'Todas las fechas'],
        ['Filtro de Estado:', getStatusLabel(filters.status || 'all')],
        ['Filtro de Clínica:', getClinicaLabel(filters.clinic || 'all')],
        ['Fecha de Generación:', new Date().toLocaleString('es-SV')],
        [''],
        ['RESUMEN ESTADÍSTICO'],
        ['Categoría', 'Cantidad', 'Distribución %'],
        ['Citas Programadas', stats.byStatus.programada, `${stats.percentages.programada}%`],
        ['Citas Terminadas', stats.byStatus.terminada, `${stats.percentages.terminada}%`],
        ['Citas Canceladas', stats.byStatus.cancelada, `${stats.percentages.cancelada}%`],
        ['Citas Perdidas', stats.byStatus.perdida, `${stats.percentages.perdida}%`],
        ['---', '---', '---'],
        ['TOTAL DE CITAS', stats.total, '100.0%'],
        [''],
        ['DESGLOSE POR CLÍNICA'],
        ['Nombre de Clínica', 'Total de Citas']
    ];

    // Add clinic breakdown
    Object.entries(stats.byClinic).forEach(([clinic, count]) => {
        summaryHeader.push([getClinicaLabel(clinic), count]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryHeader);

    // Merge cells for the title (A1:C1)
    summarySheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }
    ];

    // Set Column Widths for Summary
    summarySheet['!cols'] = [
        { wch: 30 }, // A
        { wch: 25 }, // B
        { wch: 15 }, // C
    ];

    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen_Ejecutivo');

    // 2. Appointments Detail Sheet
    const detailData = appointments.map(apt => ({
        'FECHA': formatDate(apt.date),
        'HORA': apt.time,
        'PACIENTE': apt.patientName || 'N/A',
        'DUI': apt.patientDui || apt.dui || 'N/A',
        'CLÍNICA': getClinicaLabel(apt.clinica),
        'MOTIVO DE CONSULTA': apt.reason || 'N/A',
        'ESTADO': getStatusLabel(apt.status),
        'OBSERVACIONES': (apt.notasMedico || '') + (apt.diagnostico ? ` | Diag: ${apt.diagnostico}` : '')
    }));

    const appointmentsSheet = XLSX.utils.json_to_sheet(detailData);

    // Set Column Widths for Detail
    appointmentsSheet['!cols'] = [
        { wch: 20 }, // Fecha
        { wch: 10 }, // Hora
        { wch: 30 }, // Paciente
        { wch: 15 }, // DUI
        { wch: 20 }, // Clínica
        { wch: 45 }, // Motivo
        { wch: 15 }, // Estado
        { wch: 60 }  // Observaciones
    ];

    XLSX.utils.book_append_sheet(wb, appointmentsSheet, 'Detalle_de_Citas');

    // Save
    const today = new Date().toISOString().split('T')[0];
    const fileName = `Reporte_Citas_CO_${today}.xlsx`;
    XLSX.writeFile(wb, fileName);
};

// Helper functions
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

const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-SV', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
