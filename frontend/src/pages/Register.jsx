import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import FormInput from '../components/FormInput.jsx';
import { emptyRegister } from '../constants/forms.js';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';

export default function Register() {
  const { setNotice, setError } = useApp();
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const navigate = useNavigate();

  function handleRegister(event) {
    event.preventDefault();
    setNotice('');
    setError('');

    api.registerVisitor(registerForm)
      .then((payload) => {
        setRegisterForm(emptyRegister);
        setNotice(payload.message);
        navigate('/login');
      })
      .catch((requestError) => setError(requestError.message));
  }

  return (
    <main className="auth-page register-page">
      <section className="auth-visual">
        <span className="section-kicker">Visitor Registration</span>
        <h1>Create Your Visitor Profile</h1>
        <p>Visitor registration is separated from administrator access and creates only visitor accounts.</p>
        <div className="auth-highlights">
          <article><strong>Fast Booking</strong><span>Save your details for quicker online ticket reservations.</span></article>
          <article><strong>Personal Visit</strong><span>Build a visitor profile for family-friendly park planning.</span></article>
        </div>
      </section>
      <section className="auth-card">
        <form className="panel-form" onSubmit={handleRegister}>
          <span className="form-badge">Visitor Only</span>
          <h2>Register Visitor</h2>
          <p>Use this page only for new visitor profile registration.</p>
          <FormInput label="Full Name" value={registerForm.full_name} onChange={(full_name) => setRegisterForm({ ...registerForm, full_name })} />
          <FormInput label="Email Address" type="email" value={registerForm.email} onChange={(email) => setRegisterForm({ ...registerForm, email })} />
          <FormInput label="Contact Number" value={registerForm.contact_number} onChange={(contact_number) => setRegisterForm({ ...registerForm, contact_number })} />
          <FormInput label="Password" type="password" value={registerForm.password} onChange={(password) => setRegisterForm({ ...registerForm, password })} />
          <FormInput label="Confirm Password" type="password" value={registerForm.confirm_password} onChange={(confirm_password) => setRegisterForm({ ...registerForm, confirm_password })} />
          <button type="submit">Register Visitor</button>
          <br />
          <Link className="text-link" to="/login">Already Have Login</Link>
        </form>
      </section>
    </main>
  );
}
