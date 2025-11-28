import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import AppointmentsList from './pages/AppointmentsList';
import AppointmentConfirmation from './pages/AppointmentConfirmation';
import AppointmentForm from './components/AppointmentForm';
import WhatsAppButton from './components/WhatsAppButton';
import Login from './components/Login';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('userData');
    if (storedAuth === 'true' && storedUser) {
      setIsAuthenticated(true);
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (email, password, registrationData = null) => {
    // For now, accept any non-empty credentials
    // In a real app, you would validate against a backend
    console.log('Logging in with:', email);

    let user;
    if (registrationData) {
      // New user registration
      user = {
        email,
        nombres: registrationData.nombres,
        apellidos: registrationData.apellidos,
        fechaNacimiento: registrationData.fechaNacimiento,
        dui: registrationData.dui,
        genero: registrationData.genero,
        direccion: registrationData.direccion,
        telefono: registrationData.telefono,
        emergenciaNombre: registrationData.emergenciaNombre,
        emergenciaTelefono: registrationData.emergenciaTelefono,
        emergenciaParentesco: registrationData.emergenciaParentesco,
        tipoPaciente: registrationData.tipoPaciente
      };
    } else {
      // Existing user login - check if user data exists
      const existingUser = localStorage.getItem('userData');
      if (existingUser) {
        user = JSON.parse(existingUser);
      } else {
        // Create a basic user object for login without registration
        user = {
          email,
          nombres: email.split('@')[0], // Use email prefix as temporary name
          apellidos: ''
        };
      }
    }

    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userData', JSON.stringify(user));
    setUserData(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="app">
        {isAuthenticated && <Header onLogout={handleLogout} userData={userData} />}

        <main className="main-content">
          {!isAuthenticated ? (
            <Login onLogin={handleLogin} />
          ) : (
            <div className="page-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cita" element={
                  <div className="container">
                    <AppointmentForm />
                  </div>
                } />
                <Route path="/contacto" element={<Contact />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/mis-citas" element={<AppointmentsList />} />
                <Route path="/cita-confirmada" element={<AppointmentConfirmation />} />
              </Routes>
            </div>
          )}
        </main>

        {isAuthenticated && <WhatsAppButton />}
        <Footer />
      </div>
    </Router>
  );
}

export default App;



