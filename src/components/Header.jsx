import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <img src={`${import.meta.env.BASE_URL}logo.webp`} alt="Clínica Dental Dr. Cesar Vásquez" className="logo-image" />
          </Link>
          <div className="header-actions">
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
              <Link to="/" className="nav-button" onClick={() => setIsMenuOpen(false)}>Inicio</Link>
              <Link to="/cita" className="nav-button" onClick={() => setIsMenuOpen(false)}>Cita</Link>
              <Link to="/contacto" className="nav-button" onClick={() => setIsMenuOpen(false)}>Contacto</Link>
            </nav>
            <button className="profile-btn" aria-label="Perfil">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
