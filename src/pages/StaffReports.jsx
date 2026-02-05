import { useState, useEffect } from 'react';
import {
    getAppointmentsByDateRange,
    generateReportStatistics,
    exportToPDF,
    exportToExcel
} from '../services/reportService';
import './StaffReports.css';

const StaffReports = () => {
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState('');

    // Filter states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [clinicFilter, setClinicFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Sort state
    const [sortColumn, setSortColumn] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');

    useEffect(() => {
        // Set default date range (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        setEndDate(today.toISOString().split('T')[0]);
        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            loadReportData();
        }
    }, [startDate, endDate]);

    useEffect(() => {
        applyFiltersAndSort();
    }, [appointments, statusFilter, clinicFilter, searchTerm, sortColumn, sortDirection]);

    const loadReportData = async () => {
        setIsLoading(true);
        setError('');

        const { appointments: data, error: loadError } = await getAppointmentsByDateRange(
            startDate,
            endDate
        );

        if (loadError) {
            setError('Error al cargar los datos del reporte');
            console.error('Error loading report data:', loadError);
        } else {
            setAppointments(data);
        }

        setIsLoading(false);
    };

    const applyFiltersAndSort = () => {
        let filtered = [...appointments];

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }

        // Apply clinic filter
        if (clinicFilter !== 'all') {
            filtered = filtered.filter(apt => apt.clinica === clinicFilter);
        }

        // Apply search filter
        if (searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(apt => {
                const patientName = (apt.patientName || '').toLowerCase();
                const reason = (apt.reason || '').toLowerCase();
                return patientName.includes(searchLower) || reason.includes(searchLower);
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let compareA, compareB;

            switch (sortColumn) {
                case 'date':
                    compareA = new Date(`${a.date} ${a.time}`);
                    compareB = new Date(`${b.date} ${b.time}`);
                    break;
                case 'patient':
                    compareA = (a.patientName || '').toLowerCase();
                    compareB = (b.patientName || '').toLowerCase();
                    break;
                case 'clinic':
                    compareA = (a.clinica || '').toLowerCase();
                    compareB = (b.clinica || '').toLowerCase();
                    break;
                case 'status':
                    compareA = (a.status || '').toLowerCase();
                    compareB = (b.status || '').toLowerCase();
                    break;
                default:
                    compareA = a[sortColumn];
                    compareB = b[sortColumn];
            }

            if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
            if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredAppointments(filtered);
        setStatistics(generateReportStatistics(filtered));
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const handleClearFilters = () => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        setEndDate(today.toISOString().split('T')[0]);
        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
        setStatusFilter('all');
        setClinicFilter('all');
        setSearchTerm('');
    };

    const handleExportPDF = () => {
        setIsExporting(true);
        try {
            exportToPDF(
                filteredAppointments,
                { startDate, endDate, status: statusFilter, clinic: clinicFilter },
                statistics
            );
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert('Error al exportar a PDF');
        }
        setIsExporting(false);
    };

    const handleExportExcel = () => {
        setIsExporting(true);
        try {
            exportToExcel(
                filteredAppointments,
                { startDate, endDate, status: statusFilter, clinic: clinicFilter },
                statistics
            );
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Error al exportar a Excel');
        }
        setIsExporting(false);
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

    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-SV', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="staff-reports">
            <div className="reports-header">
                <h1>
                    <svg className="header-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Reportes de Citas
                </h1>
                <p className="subtitle">Análisis y exportación de historial de citas</p>
            </div>

            {/* Filters Section */}
            <div className="reports-filters-section">
                <div className="reports-filters-row">
                    <div className="reports-filter-group">
                        <label>Fecha Inicio</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="reports-date-input"
                        />
                    </div>

                    <div className="reports-filter-group">
                        <label>Fecha Fin</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="reports-date-input"
                        />
                    </div>

                    <div className="reports-filter-group">
                        <label>Estado</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="reports-filter-select"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="programada">Programada</option>
                            <option value="terminada">Terminada</option>
                            <option value="cancelada">Cancelada</option>
                            <option value="perdida">Perdida</option>
                        </select>
                    </div>

                    <div className="reports-filter-group">
                        <label>Clínica</label>
                        <select
                            value={clinicFilter}
                            onChange={(e) => setClinicFilter(e.target.value)}
                            className="reports-filter-select"
                        >
                            <option value="all">Todas las clínicas</option>
                            <option value="santa-tecla">Santa Tecla</option>
                            <option value="soyapango">Soyapango</option>
                            <option value="san-martin">San Martín</option>
                            <option value="escalon">Escalón</option>
                            <option value="usulutan">Usulután</option>
                        </select>
                    </div>
                </div>

                <div className="reports-filters-row">
                    <div className="reports-search-box">
                        <input
                            type="text"
                            placeholder="Buscar por paciente o motivo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="reports-search-input"
                        />
                        <svg className="reports-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </div>

                    <button onClick={handleClearFilters} className="reports-clear-filters-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div className="reports-statistics-section">
                    <div className="reports-stat-card reports-stat-total">
                        <div className="reports-stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <div className="reports-stat-content">
                            <h3>Total de Citas</h3>
                            <p className="reports-stat-number">{statistics.total}</p>
                        </div>
                    </div>

                    <div className="reports-stat-card reports-stat-programada">
                        <div className="reports-stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <div className="reports-stat-content">
                            <h3>Programadas</h3>
                            <p className="reports-stat-number">{statistics.byStatus.programada}</p>
                            <p className="reports-stat-percentage">{statistics.percentages.programada}%</p>
                        </div>
                    </div>

                    <div className="reports-stat-card reports-stat-terminada">
                        <div className="reports-stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <div className="reports-stat-content">
                            <h3>Terminadas</h3>
                            <p className="reports-stat-number">{statistics.byStatus.terminada}</p>
                            <p className="reports-stat-percentage">{statistics.percentages.terminada}%</p>
                        </div>
                    </div>

                    <div className="reports-stat-card reports-stat-cancelada">
                        <div className="reports-stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </div>
                        <div className="reports-stat-content">
                            <h3>Canceladas</h3>
                            <p className="reports-stat-number">{statistics.byStatus.cancelada}</p>
                            <p className="reports-stat-percentage">{statistics.percentages.cancelada}%</p>
                        </div>
                    </div>

                    <div className="reports-stat-card reports-stat-perdida">
                        <div className="reports-stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <div className="reports-stat-content">
                            <h3>Perdidas</h3>
                            <p className="reports-stat-number">{statistics.byStatus.perdida}</p>
                            <p className="reports-stat-percentage">{statistics.percentages.perdida}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Buttons */}
            <div className="reports-export-section">
                <button
                    onClick={handleExportPDF}
                    disabled={isExporting || filteredAppointments.length === 0}
                    className="reports-export-btn reports-pdf-btn"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    Exportar a PDF
                </button>

                <button
                    onClick={handleExportExcel}
                    disabled={isExporting || filteredAppointments.length === 0}
                    className="reports-export-btn reports-excel-btn"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <rect x="8" y="12" width="8" height="6"></rect>
                    </svg>
                    Exportar a Excel
                </button>

                <div className="reports-results-count">
                    {filteredAppointments.length} resultado{filteredAppointments.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Data Table */}
            {isLoading ? (
                <div className="reports-loading-container">
                    <div className="reports-loading-spinner"></div>
                    <p>Cargando datos...</p>
                </div>
            ) : error ? (
                <div className="reports-error-container">
                    <p className="reports-error-message">{error}</p>
                    <button onClick={loadReportData} className="reports-retry-button">
                        Reintentar
                    </button>
                </div>
            ) : filteredAppointments.length === 0 ? (
                <div className="reports-empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>No se encontraron citas con los filtros seleccionados</p>
                </div>
            ) : (
                <div className="reports-table-container">
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('date')} className="reports-sortable">
                                    Fecha
                                    {sortColumn === 'date' && (
                                        <span className="reports-sort-indicator">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </th>
                                <th>Hora</th>
                                <th onClick={() => handleSort('patient')} className="reports-sortable">
                                    Paciente
                                    {sortColumn === 'patient' && (
                                        <span className="reports-sort-indicator">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </th>
                                <th onClick={() => handleSort('clinic')} className="reports-sortable">
                                    Clínica
                                    {sortColumn === 'clinic' && (
                                        <span className="reports-sort-indicator">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </th>
                                <th>Motivo</th>
                                <th onClick={() => handleSort('status')} className="reports-sortable">
                                    Estado
                                    {sortColumn === 'status' && (
                                        <span className="reports-sort-indicator">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.map((appointment) => (
                                <tr key={appointment.id}>
                                    <td className="reports-date-cell">{formatDate(appointment.date)}</td>
                                    <td>{appointment.time}</td>
                                    <td className="reports-patient-name">{appointment.patientName || 'N/A'}</td>
                                    <td>{getClinicaLabel(appointment.clinica)}</td>
                                    <td className="reports-reason-cell">{appointment.reason || 'N/A'}</td>
                                    <td>
                                        <span className={`status-badge status-${appointment.status}`}>
                                            {getStatusLabel(appointment.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StaffReports;
