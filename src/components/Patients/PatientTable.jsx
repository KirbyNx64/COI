import React from 'react';

const PatientTable = ({ patients, onViewDetails, currentPage, totalPages, onPageChange }) => {
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

            {totalPages > 1 && (
                <div className="p-pagination">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-pagination-btn"
                    >
                        &laquo; Anterior
                    </button>

                    <div className="p-pagination-numbers">
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index + 1}
                                onClick={() => onPageChange(index + 1)}
                                className={`p-pagination-number ${currentPage === index + 1 ? 'p-active' : ''}`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
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
