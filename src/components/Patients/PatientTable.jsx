import React from 'react';

const PatientTable = ({
    patients, onViewDetails,
    pageNum, hasNext, hasPrev, onNext, onPrev,
    isDuiMode, totalDuiPages, currentDuiPage, onDuiPageChange
}) => {
    if (patients.length === 0) {
        return (
            <div className="empty-state">
                <p>No se encontraron pacientes</p>
            </div>
        );
    }

    return (
        <div className="patients-table-container">
            <table className="patients-table">
                <thead>
                    <tr>
                        <th>Nombre Completo</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>DUI</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map((patient) => (
                        <tr key={patient.id}>
                            <td className="patient-name" data-label="Nombre Completo">
                                {patient.nombres} {patient.apellidos}
                            </td>
                            <td data-label="Email">{patient.email}</td>
                            <td data-label="Teléfono">{patient.telefono || 'N/A'}</td>
                            <td data-label="DUI">{patient.dui || 'N/A'}</td>
                            <td data-label="Acciones">
                                <button
                                    onClick={() => onViewDetails(patient)}
                                    className="view-button"
                                >
                                    Ver detalles
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Cursor pagination for normal listing mode */}
            {!isDuiMode && (hasPrev || hasNext) && (
                <div className="p-pagination">
                    <button
                        onClick={onPrev}
                        disabled={!hasPrev}
                        className="p-pagination-btn"
                    >
                        &laquo; Anterior
                    </button>
                    <span className="p-pagination-info">Página {pageNum}</span>
                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        className="p-pagination-btn"
                    >
                        Siguiente &raquo;
                    </button>
                </div>
            )}

            {/* Numbered pagination only for DUI search results */}
            {isDuiMode && totalDuiPages > 1 && (
                <div className="p-pagination">
                    <button
                        onClick={() => onDuiPageChange(currentDuiPage - 1)}
                        disabled={currentDuiPage === 1}
                        className="p-pagination-btn"
                    >
                        &laquo; Anterior
                    </button>
                    <div className="p-pagination-numbers">
                        {[...Array(totalDuiPages)].map((_, index) => (
                            <button
                                key={index + 1}
                                onClick={() => onDuiPageChange(index + 1)}
                                className={`p-pagination-number ${currentDuiPage === index + 1 ? 'p-active' : ''}`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => onDuiPageChange(currentDuiPage + 1)}
                        disabled={currentDuiPage === totalDuiPages}
                        className="p-pagination-btn"
                    >
                        Siguiente &raquo;
                    </button>
                </div>
            )}
        </div>
    );
};

export default PatientTable;
