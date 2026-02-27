import React from 'react';

const ProfileInfoSection = ({ title, icon, children }) => {
    return (
        <section className="profile-section">
            <h2 className="section-title">
                {icon}
                {title}
            </h2>
            <div className="info-grid">
                {children}
            </div>
        </section>
    );
};

export const ProfileInfoItem = ({ label, value }) => {
    return (
        <div className="info-item">
            <label>{label}</label>
            <p>{value || 'No especificado'}</p>
        </div>
    );
};

export default ProfileInfoSection;
