import React from 'react';

const ProfileHeader = ({ userData, isUploading, handlePhotoUpload, uploadError }) => {
    return (
        <div className="profile-header">
            <div className="profile-avatar-container">
                <input
                    type="file"
                    id="photo-upload"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                />
                <label htmlFor="photo-upload" className="profile-avatar">
                    {isUploading ? (
                        <div className="upload-spinner"></div>
                    ) : userData.photoURL ? (
                        <>
                            <img src={userData.photoURL} alt="Foto de perfil" className="profile-photo" />
                            <div className="photo-overlay">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                            </div>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <div className="photo-overlay">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                            </div>
                        </>
                    )}
                </label>
            </div>
            <div className="profile-header-info">
                <h1 className="profile-name">{userData.nombres} {userData.apellidos}</h1>
                <p className="profile-email">{userData.email}</p>
                {uploadError && <p className="upload-error">{uploadError}</p>}
            </div>
        </div>
    );
};

export default ProfileHeader;
