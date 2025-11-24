import Header from './components/Header';
import AppointmentForm from './components/AppointmentForm';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <div className="container">
          <AppointmentForm />
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 Clínica Dental Dr. Cesar Vásquez. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

