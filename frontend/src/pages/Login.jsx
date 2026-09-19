import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput.jsx';
import { emptyLogin } from '../constants/forms.js';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';
import { useState } from 'react';

export default function Login() {
  const { profile, setData, setProfile, setNotice, setError } = useApp();
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const navigate = useNavigate();

  function handleLogin(event) {
    event.preventDefault();
    setNotice('');
    setError('');

    api.login(loginForm)
      .then(() => api.platformData())
      .then((payload) => {
        setData?.(payload);
        setProfile(payload.profile || { isLoggedIn: false });
        setLoginForm(emptyLogin);
        setNotice('Login successful.');
        navigate('/dashboard');
      })
      .catch((requestError) => setError(requestError.message));
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <span className="section-kicker">Profile Login</span>
        <h1>Welcome Back to Wonderland</h1>
        <p>Visitors and administrators can login from this dedicated profile access page.</p>
        <div className="auth-highlights">
          <article><strong>Visitor</strong><span>Book tickets, manage visit details, and view your park profile.</span></article>
          <article><strong>Administrator</strong><span>Review dashboards, visitor activity, and manage attraction visibility.</span></article>
        </div>
      </section>
      <section className="auth-card">
        <form className="panel-form" onSubmit={handleLogin}>
          <span className="form-badge">Secure Access</span>
          <h2>Login</h2>
          <p>Choose Visitor Profile or Administrator Profile before signing in.</p>
          <label>
            Profile Type
            <select value={loginForm.profile_type} onChange={(event) => setLoginForm({ ...loginForm, profile_type: event.target.value })}>
              <option value="visitor">Visitor Profile</option>
              <option value="admin">Administrator Profile</option>
            </select>
          </label>
          <FormInput label="Email Address" type="email" value={loginForm.email} onChange={(email) => setLoginForm({ ...loginForm, email })} />
          <FormInput label="Password" type="password" value={loginForm.password} onChange={(password) => setLoginForm({ ...loginForm, password })} />
          <button type="submit">Login</button>
          <br />
          <Link className="text-link" to="/register">Create Visitor Account</Link>
        </form>
      </section>
      {profile.isLoggedIn && <p className="section-copy">Logged in as {profile.name} ({profile.type}).</p>}
    </main>
  );
}
