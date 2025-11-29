import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import StaffLogin from './components/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';
import './App.css';


function AppContent({ isAuthenticated, userType, userData, handleLogin, handleLogout, isStaff }) {
  const location = useLocation();
  const isStaffPage = location.pathname === '/staff/login' || location.pathname === '/staff/dashboard';

  return (
    <>
      {isAuthenticated && <Header onLogout={handleLogout} userData={userData} userType={userType} />}

      <main className="main-content">
        <Routes>
          {/* Staff Login Route - accessible when not authenticated */}
          <Route
            path="/staff/login"
            element={
              !isAuthenticated ? (
                <StaffLogin onLogin={handleLogin} />
              ) : (
                <Navigate to={isStaff ? "/staff/dashboard" : "/"} replace />
              )
            }
          />

          {/* Patient Login Route - accessible when not authenticated */}
          <Route
            path="/"
            element={
              !isAuthenticated ? (
                <Login onLogin={handleLogin} />
              ) : userType === 'patient' ? (
                <Home />
              ) : (
                <Navigate to="/staff/dashboard" replace />
              )
            }
          />

          {/* Staff Dashboard - only accessible for staff */}
          <Route
            path="/staff/dashboard"
            element={
              isAuthenticated && isStaff ? (
                <StaffDashboard userType={userType} userData={userData} />
              ) : (
                <Navigate to={isAuthenticated ? "/" : "/staff/login"} replace />
              )
            }
          />

          {/* Patient Routes - only accessible for patients */}
          {isAuthenticated && userType === 'patient' && (
            <>
              <Route path="/cita" element={
                <div className="container">
                  <AppointmentForm />
                </div>
              } />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/mis-citas" element={<AppointmentsList />} />
              <Route path="/cita-confirmada" element={<AppointmentConfirmation />} />
            </>
          )}

          {/* Catch-all redirect */}
          <Route
            path="*"
            element={
              <Navigate to={
                !isAuthenticated ? "/" :
                  isStaff ? "/staff/dashboard" :
                    "/"
              } replace />
            }
          />
        </Routes>
      </main>

      {isAuthenticated && userType === 'patient' && <WhatsAppButton />}
      {!isStaffPage && <Footer />}
    </>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userType, setUserType] = useState(null); // 'patient', 'admin', 'doctor'

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('userData');
    const storedType = localStorage.getItem('userType');
    if (storedAuth === 'true' && storedUser) {
      setIsAuthenticated(true);
      setUserData(JSON.parse(storedUser));
      setUserType(storedType || 'patient');
    }
  }, []);

  const handleLogin = (email, password, registrationData = null, type = 'patient', staffData = null) => {
    // For now, accept any non-empty credentials
    // In a real app, you would validate against a backend
    console.log('Logging in with:', email, 'Type:', type);

    let user;
    if (type === 'patient') {
      if (registrationData) {
        // New patient registration
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
        // Existing patient login - check if user data exists
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
    } else {
      // Staff login (admin or doctor)
      user = {
        email,
        nombre: staffData?.nombre || email.split('@')[0],
        cargo: staffData?.cargo || type
      };
    }

    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('userType', type);
    setUserData(user);
    setUserType(type);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    setIsAuthenticated(false);
    setUserData(null);
    setUserType(null);
  };

  const isStaff = userType === 'admin' || userType === 'doctor';

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="app">
        <AppContent
          isAuthenticated={isAuthenticated}
          userType={userType}
          userData={userData}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
          isStaff={isStaff}
        />
      </div>
    </Router>
  );
}

export default App;



