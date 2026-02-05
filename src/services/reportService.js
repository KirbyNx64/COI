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
        const appointmentsRef = collection(db, 'appointments');
        const querySnapshot = await getDocs(appointmentsRef);

        let appointments = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            appointments.push({
                id: doc.id,
                ...data
            });
        });

        // Filter by date range
        if (startDate && endDate) {
            appointments = appointments.filter(apt => {
                return apt.date >= startDate && apt.date <= endDate;
            });
        }

        // Filter by status
        if (filters.status && filters.status !== 'all') {
            appointments = appointments.filter(apt => apt.status === filters.status);
        }

        // Filter by clinic
        if (filters.clinic && filters.clinic !== 'all') {
            appointments = appointments.filter(apt => apt.clinica === filters.clinic);
        }

        // Filter by search term (patient name or reason)
        if (filters.searchTerm && filters.searchTerm.trim() !== '') {
            const searchLower = filters.searchTerm.toLowerCase();
            appointments = appointments.filter(apt => {
                const patientName = (apt.patientName || '').toLowerCase();
                const reason = (apt.reason || '').toLowerCase();
                return patientName.includes(searchLower) || reason.includes(searchLower);
            });
        }

        // Sort by date and time (most recent first)
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
        getClinicaLabel(apt.clinica),
        apt.reason || 'N/A',
        getStatusLabel(apt.status)
    ]);

    const tableColumns = ['Fecha', 'Hora', 'Paciente', 'Clinica', 'Motivo', 'Estado'];

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

    // Statistics sheet
    const statsData = [
        ['REPORTE DE CITAS'],
        [''],
        ['Período', filters.startDate && filters.endDate ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}` : 'Todas las fechas'],
        ['Generado', new Date().toLocaleString('es-SV')],
        [''],
        ['RESUMEN ESTADÍSTICO'],
        ['Total de citas', stats.total],
        [''],
        ['Por Estado', 'Cantidad', 'Porcentaje'],
        ['Programadas', stats.byStatus.programada, `${stats.percentages.programada}%`],
        ['Terminadas', stats.byStatus.terminada, `${stats.percentages.terminada}%`],
        ['Canceladas', stats.byStatus.cancelada, `${stats.percentages.cancelada}%`],
        ['Perdidas', stats.byStatus.perdida, `${stats.percentages.perdida}%`],
        [''],
        ['Por Clínica', 'Cantidad'],
    ];

    // Add clinic breakdown
    Object.entries(stats.byClinic).forEach(([clinic, count]) => {
        statsData.push([getClinicaLabel(clinic), count]);
    });

    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsSheet, 'Resumen');

    // Appointments sheet
    const appointmentsData = formatAppointmentsForExport(appointments);
    const appointmentsSheet = XLSX.utils.json_to_sheet(appointmentsData);
    XLSX.utils.book_append_sheet(wb, appointmentsSheet, 'Citas');

    // Save
    const fileName = `reporte_citas_${new Date().toISOString().split('T')[0]}.xlsx`;
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
