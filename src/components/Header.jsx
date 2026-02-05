import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { subscribeToUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../services/notificationService';
import './Header.css';

function Header({ onLogout, userData, userType }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Handle both patient (nombres) and staff (nombre) data structures
  const displayName = userData ? (userData.nombres || userData.nombre || 'Usuario') : 'Usuario';

  const isStaff = userType === 'admin' || userType === 'doctor';

  // Sort notifications locally if needed, but service already sorts

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    if (isProfileMenuOpen || isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen, isNotificationOpen]);

  // Subscribe to notifications
  // Subscribe to notifications
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    // Only subscribe for patients
    if (userId && !isStaff) {
      const unsubscribe = subscribeToUserNotifications(userId, (data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      });
      return () => unsubscribe();
    }
  }, [isStaff]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    setIsNotificationOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    const userId = auth.currentUser?.uid;
    if (userId) {
      await markAllNotificationsAsRead(userId);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    // Firestore timestamp check
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to={isStaff ? "/staff/dashboard" : "/"} className="logo">
            <img src={`${import.meta.env.BASE_URL}logo.webp`} alt="Clínica Dental Dr. Cesar Vásquez" className="logo-image" />
          </Link>
          <div className="header-actions">

            <div ref={mobileMenuRef}>
              <button
                className="mobile-menu-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Menú"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>

              <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                {!isStaff && (
                  <>
                    <Link to="/" className="nav-button" onClick={() => setIsMenuOpen(false)}>Inicio</Link>
                    <Link to="/cita" className="nav-button" onClick={() => setIsMenuOpen(false)}>Cita</Link>
                    <Link to="/contacto" className="nav-button" onClick={() => setIsMenuOpen(false)}>Contacto</Link>
                  </>
                )}
                {isStaff && (
                  <Link to="/staff/dashboard" className="nav-button" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                )}
              </nav>
            </div>

            {/* Notifications Section (Only for patients) */}
            {!isStaff && (
              <div className="notification-container" ref={notificationRef}>
                <button
                  className="notification-btn"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  aria-label="Notificaciones"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h3>Notificaciones</h3>
                      {unreadCount > 0 && (
                        <button className="mark-read-btn" onClick={handleMarkAllRead}>
                          Marcar leídas
                        </button>
                      )}
                    </div>
                    <div className="notification-list">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`notification-item ${!notification.read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="notification-item-header">
                              <span className="notification-title">{notification.title}</span>
                              <span className="notification-time">{formatDate(notification.createdAt)}</span>
                            </div>
                            <p className="notification-message">{notification.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="notification-empty">
                          No tienes notificaciones
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="profile-container" ref={profileRef}>
              <button
                className="profile-btn"
                aria-label="Perfil"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                {userData?.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt="Perfil"
                    className="profile-photo-small"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
                <span className="user-name">{displayName}</span>
              </button>

              {isProfileMenuOpen && (
                <div className="profile-dropdown">
                  {!isStaff && (
                    <>
                      <Link
                        to="/perfil"
                        className="dropdown-item"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Perfil
                      </Link>
                    </>
                  )}
                  <button className="dropdown-item logout" onClick={onLogout}>Cerrar sesión</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
