import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import FormInput from '../components/FormInput.jsx';
import { categories, emptyBooking } from '../constants/forms.js';
import { useApp } from '../context/AppContext.jsx';
import { api, assetUrl } from '../services/api.js';

export default function Home() {
  const { data, profile, setNotice, setError } = useApp();
  const [activeCategory, setActiveCategory] = useState('All');
  const [bookingForm, setBookingForm] = useState(emptyBooking);
  const navigate = useNavigate();

  const visibleAttractions = useMemo(() => {
    if (!data) {
      return [];
    }

    if (activeCategory === 'All') {
      return data.attractions;
    }

    return data.attractions.filter((item) => item.category === activeCategory);
  }, [activeCategory, data]);

  useEffect(() => {
    if (!isVisitorLoggedIn(profile)) {
      return;
    }

    setBookingForm((currentForm) => ({
      ...currentForm,
      visitor_name: profile.name || '',
      email: profile.email || '',
      contact_number: profile.contact_number || '',
    }));
  }, [profile]);

  useEffect(() => {
    if (!isVisitorLoggedIn(profile)) {
      return;
    }

    const pendingTicketId = window.sessionStorage.getItem('wonderland_pending_ticket_id');
    if (!pendingTicketId) {
      return;
    }

    const hasTicket = (data.ticketPasses || []).some((ticketPass) => String(ticketPass.id) === pendingTicketId);
    if (!hasTicket) {
      window.sessionStorage.removeItem('wonderland_pending_ticket_id');
      return;
    }

    setBookingForm((currentForm) => ({
      ...currentForm,
      ticket_type: pendingTicketId,
    }));
    window.sessionStorage.removeItem('wonderland_pending_ticket_id');
    window.setTimeout(() => {
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [data.ticketPasses, profile]);

  async function handleBooking(event) {
    event.preventDefault();
    setNotice('');
    setError('');

    if (!isVisitorLoggedIn(profile)) {
      setError('Please login with a Visitor Profile before booking tickets.');
      navigate('/login');
      return;
    }

    const ticketPasses = data.ticketPasses || [];
    const ticket_type = bookingForm.ticket_type || String(ticketPasses[0]?.id || '');
    const selectedTicket = ticketPasses.find((ticketPass) => String(ticketPass.id) === String(ticket_type));
    const confirmation = await Swal.fire({
      title: 'Confirm Booking',
      html: `
        <strong>${selectedTicket?.ticket_tier || 'Wonderland Ticket'}</strong><br />
        Continue to Stripe secure payment?
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Continue to Payment',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ee3e50',
      cancelButtonColor: '#082640',
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    api.bookTicket({ ...bookingForm, ticket_type })
      .then((payload) => {
        if (payload.checkout_url) {
          window.location.assign(payload.checkout_url);
          return;
        }
        setNotice(payload.message || 'Booking saved successfully.');
      })
      .catch((requestError) => setError(requestError.message));
  }

  function handleTicketSelect(ticketPass) {
    setNotice('');
    setError('');

    if (!isVisitorLoggedIn(profile)) {
      window.sessionStorage.setItem('wonderland_pending_ticket_id', String(ticketPass.id));
      setError('Please login with a Visitor Profile before selecting tickets.');
      navigate('/login');
      return;
    }

    setBookingForm((currentForm) => ({ ...currentForm, ticket_type: String(ticketPass.id) }));
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <Hero stats={data.parkStats} />
      <Attractions attractions={visibleAttractions} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <Tickets ticketPasses={data.ticketPasses || []} onSelectTicket={handleTicketSelect} />
      <ParkStatus operations={data.operations} behaviourMix={data.behaviourMix} />
      <Booking
        isVisitorLocked={isVisitorLoggedIn(profile)}
        ticketPasses={data.ticketPasses || []}
        form={bookingForm}
        onChange={setBookingForm}
        onSubmit={handleBooking}
      />
    </>
  );
}

function Hero({ stats }) {
  return (
    <section className="hero" id="top">
      <div className="hero-shade" />
      <div className="hero-content">
        <span className="eyebrow">Cloud Native Theme Park Platform</span>
        <h1>Create Memories. Experience Wonderland.</h1>
        <p>
          A React visitor interface connected to Node.js microservices for attraction discovery,
          visitor profiles, ticket booking, and park operations visibility.
        </p>
        <div className="hero-actions">
          <a className="primary-btn" href="#attractions">Explore Attractions</a>
          <a className="secondary-btn" href="#booking">Buy Tickets</a>
        </div>
      </div>
      <div className="stat-strip">
        {stats.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function Attractions({ attractions, activeCategory, onCategoryChange }) {
  return (
    <section className="section" id="attractions">
      <span className="section-kicker">Explore Wonderland</span>
      <h2>Find Your Next Adventure</h2>
      <p className="section-copy">Activities are loaded from the Node.js backend and can be managed by administrators.</p>
      <div className="filter-bar">
        {categories.map((category) => (
          <button
            className={activeCategory === category ? 'active' : ''}
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="cards-grid">
        {attractions.map((ride) => (
          <article className="ride-card" key={ride.id || ride.name}>
            <div
              className="ride-image"
              style={{
                backgroundImage: `linear-gradient(rgba(8,38,64,.05), rgba(8,38,64,.30)), url("${assetUrl(ride.background_image)}")`,
                backgroundPosition: ride.image_position || 'center',
              }}
            >
              <span style={{ backgroundColor: ride.color }}>{ride.category.slice(0, 1)}</span>
            </div>
            <div className="ride-body">
              <small>{ride.ride_type}</small>
              <h3>{ride.name}</h3>
              <p>{ride.tagline}</p>
              <div>
                {(ride.details || []).map((detail) => (
                  <strong key={detail}>{detail}</strong>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Tickets({ ticketPasses, onSelectTicket }) {
  return (
    <section className="tickets" id="tickets">
      <span className="section-kicker">Tickets</span>
      <h2>Choose Your Adventure</h2>
      <p>Book your Wonderland tickets online and get ready for an unforgettable day.</p>
      <div className="ticket-grid">
        {ticketPasses.map((ticketPass) => (
          <article className="ticket-card" key={ticketPass.id}>
            <h3>{ticketPass.ticket_tier}</h3>
            <strong>{formatTicketAmount(ticketPass.ticket_price_indicative)}</strong>
            <p>Guests: {ticketPass.guests}</p>
            <button type="button" onClick={() => onSelectTicket(ticketPass)}>Select Ticket</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ParkStatus({ operations, behaviourMix }) {
  return (
    <section className="status-section" id="status">
      <span className="section-kicker">Live Park Information</span>
      <h2>Wonderland Today</h2>
      <p className="section-copy">Dashboards and reports are supplied through Node.js APIs for visualization.</p>
      <div className="metric-grid">
        {operations.map((metric) => (
          <article key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
            <small>{metric.trend}</small>
          </article>
        ))}
      </div>
      <div className="behaviour-panel">
        {behaviourMix.map((item) => (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div><i style={{ width: `${item.value}%`, backgroundColor: item.color }} /></div>
            <strong>{item.value}%</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Booking({ isVisitorLocked, ticketPasses, form, onChange, onSubmit }) {
  const selectedTicket = form.ticket_type || String(ticketPasses[0]?.id || '');

  return (
    <section className="booking-section" id="booking">
      <span className="section-kicker">Online Booking</span>
      <h2>Book Your Wonderland Visit</h2>
      <form className="booking-form" onSubmit={onSubmit}>
        <FormInput
          disabled={isVisitorLocked}
          label="Full Name"
          value={form.visitor_name}
          onChange={(visitor_name) => onChange({ ...form, visitor_name })}
        />
        <FormInput
          disabled={isVisitorLocked}
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(email) => onChange({ ...form, email })}
        />
        <FormInput label="Visit Date" type="date" value={form.visit_date} onChange={(visit_date) => onChange({ ...form, visit_date })} />
        <label>
          Preferred Time Slot
          <select
            required
            value={form.preferred_time_slot}
            onChange={(event) => onChange({ ...form, preferred_time_slot: event.target.value })}
          >
            <option value="">Select time slot</option>
            <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM</option>
            <option value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM</option>
            <option value="03:00 PM - 06:00 PM">03:00 PM - 06:00 PM</option>
            <option value="06:00 PM - 10:00 PM">06:00 PM - 10:00 PM</option>
          </select>
        </label>
        <label>
          Ticket Type
          <select value={selectedTicket} onChange={(event) => onChange({ ...form, ticket_type: event.target.value })}>
            {ticketPasses.map((ticketPass) => (
              <option value={ticketPass.id} key={ticketPass.id}>{ticketPass.ticket_tier}</option>
            ))}
          </select>
        </label>
        <FormInput label="Number of Tickets" type="number" value={form.quantity} onChange={(quantity) => onChange({ ...form, quantity })} />
        <FormInput
          disabled={isVisitorLocked}
          label="Contact Number"
          value={form.contact_number}
          onChange={(contact_number) => onChange({ ...form, contact_number })}
        />
        <button type="submit">Continue to Booking</button>
      </form>
    </section>
  );
}

function formatTicketAmount(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function isVisitorLoggedIn(profile) {
  return Boolean(profile?.isLoggedIn && profile?.type === 'visitor');
}
