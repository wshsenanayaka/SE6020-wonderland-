import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Toast from './components/Toast.jsx';
import { useApp } from './context/AppContext.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  const { data, notice, error } = useApp();

  if (!data) {
    return (
      <main className="loading-screen">
        <strong>Wonderland</strong>
        <span>{error || 'Loading React frontend...'}</span>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Header />
      <Toast notice={notice} error={error} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}
