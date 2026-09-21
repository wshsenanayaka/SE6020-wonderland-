import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';

export default function CheckIn() {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({
    loading: true,
    success: false,
    message: 'Checking visitor arrival...',
    booking: null,
  });

  useEffect(() => {
    const qrToken = searchParams.get('token') || '';

    api.checkInBooking(bookingId, qrToken)
      .then((payload) => {
        setState({
          loading: false,
          success: true,
          message: payload.message,
          booking: payload.booking || null,
        });
      })
      .catch((error) => {
        setState({
          loading: false,
          success: false,
          message: error.message,
          booking: null,
        });
      });
  }, [bookingId, searchParams]);

  return (
    <main className="checkin-page">
      <section className={state.success ? 'checkin-card success' : 'checkin-card failed'}>
        <span className="section-kicker">Park Entry</span>
        <h1>{state.loading ? 'Checking QR Code' : state.success ? 'Arrival Confirmed' : 'Check-In Failed'}</h1>
        <p>{state.message}</p>

        {state.booking && (
          <div className="checkin-details">
            <span><strong>Booking:</strong> #{state.booking.id}</span>
            <span><strong>Visitor:</strong> {state.booking.visitor_name}</span>
            <span><strong>Ticket:</strong> {state.booking.ticket_label}</span>
            <span><strong>Visit Date:</strong> {formatDisplayDate(state.booking.visit_date)}</span>
            <span><strong>Time Slot:</strong> {state.booking.preferred_time_slot || '-'}</span>
            <span><strong>Status:</strong> {state.booking.checkin_status || 'Arrived'}</span>
          </div>
        )}

        <Link className="dashboard-action" to="/dashboard">Back to Dashboard</Link>
      </section>
    </main>
  );
}

function formatDisplayDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}
