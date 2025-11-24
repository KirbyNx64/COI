import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <img src="/logo.png" alt="Clínica Dental Dr. Cesar Vásquez" className="logo-image" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
