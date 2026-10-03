import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.jsx';

export default function Header() {
  const { profile, setProfile, setNotice, setError } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  function handleLogout() {
    api.logout()
      .then(() => {
        setProfile({ isLoggedIn: false });
        setNotice('Logged out successfully.');
        navigate('/');
      })
      .catch((requestError) => setError(requestError.message));
  }

  function handleBookTickets() {
    if (!isHome) {
      navigate('/#tickets');
      window.setTimeout(() => {
        document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return;
    }

    document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <header className="topbar">
      <Link className="brand brand-button" to="/" aria-label="Wonderland home">
        <span className="brand-mark">W</span>
        <strong>Wonder<span>land</span></strong>
      </Link>
      <nav>
        <NavLink to="/">Home</NavLink>
        {isHome && (
          <>
            <a href="#attractions">Attractions</a>
            <a href="#tickets">Tickets</a>
            <a href="#status">Park Status</a>
          </>
        )}
        {profile.isLoggedIn ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <span className="profile-pill">{profile.name}</span>
            <button type="button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
        <button className="book-link" type="button" onClick={handleBookTickets}>Book Tickets</button>
      </nav>
    </header>
  );
}
