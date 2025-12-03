import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthChange, getUserProfile, signOut as firebaseSignOut } from './services/authService';
import { markOverdueAppointmentsAsLost } from './services/appointmentService';
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
import ScrollToTop from './components/ScrollToTop';
import './App.css';


function AppContent({ isAuthenticated, userType, userData, handleLogin, handleLogout, isStaff, isLoading }) {
  const location = useLocation();
  const isStaffPage = location.pathname === '/staff/login' || location.pathname === '/staff/dashboard';

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

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
                <Home userData={userData} />
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
                  <AppointmentForm userData={userData} />
                </div>
              } />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/perfil" element={<Profile userData={userData} />} />
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
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthChange(async (user) => {
      console.log('Auth state changed, user:', user?.email);
      if (user) {
        // Check if user just registered - if so, don't auto-login
        const justRegistered = sessionStorage.getItem('justRegistered');
        console.log('justRegistered flag:', justRegistered);
        if (justRegistered === 'true') {
          console.log('User just registered, skipping auto-login');
          setIsLoading(false);
          return;
        }

        // User is signed in, load their profile with retry logic
        let retries = 3;
        let profile = null;
        let error = null;

        while (retries > 0 && !profile) {
          const result = await getUserProfile(user.uid);
          profile = result.profile;
          error = result.error;

          if (!profile && retries > 1) {
            console.log(`Failed to load profile, retrying... (${retries - 1} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
          retries--;
        }

        if (profile) {
          setUserData(profile);
          setUserType('patient');
          setIsAuthenticated(true);
          setIsLoading(false);

          // Migración desactivada - las citas antiguas de localStorage no se transferirán a Firebase
          // Si necesitas migrar citas antiguas, descomenta las siguientes líneas:
          // const { migrateLocalStorageToFirebase } = await import('./services/migrationService');
          // await migrateLocalStorageToFirebase(user.uid, profile);
        } else {
          console.error('Failed to load profile after retries:', error);
          // Don't sign out immediately - give user a chance to retry
          setIsAuthenticated(false);
          setUserData(null);
          setUserType(null);
          setIsLoading(false);
        }
      } else {
        // User is signed out
        setIsAuthenticated(false);
        setUserData(null);
        setUserType(null);
        setIsLoading(false);
      }
    });

    // Check for overdue appointments using Firebase
    const checkOverdueAppointments = async () => {
      await markOverdueAppointmentsAsLost();
    };

    checkOverdueAppointments();
    const intervalId = setInterval(checkOverdueAppointments, 60000); // Check every minute

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  const handleLogin = async (user) => {
    // User is already authenticated via Firebase
    // Just load their profile data
    const { profile, error } = await getUserProfile(user.uid);

    if (profile) {
      setUserData(profile);
      setUserType('patient');
      setIsAuthenticated(true);
    } else {
      console.error('Failed to load profile:', error);
    }
  };

  const handleLogout = async () => {
    await firebaseSignOut();
    setIsAuthenticated(false);
    setUserData(null);
    setUserType(null);
  };

  const isStaff = userType === 'admin' || userType === 'doctor';

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <div className="app">
        <AppContent
          isAuthenticated={isAuthenticated}
          userType={userType}
          userData={userData}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
          isStaff={isStaff}
          isLoading={isLoading}
        />
      </div>
    </Router>
  );
}

export default App;



