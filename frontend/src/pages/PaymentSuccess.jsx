import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Confirming your Stripe payment...');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setMessage('Payment completed, but no Stripe session id was returned.');
      return;
    }

    api.confirmStripeSession(sessionId)
      .then((payload) => setMessage(payload.message || 'Payment confirmed. Your booking is now booked.'))
      .catch((error) => setMessage(error.message));
  }, [searchParams]);

  return (
    <main className="account-section payment-result">
      <span className="section-kicker">Payment</span>
      <h2>Payment Success</h2>
      <p className="section-copy">{message}</p>
      <Link className="primary-btn" to="/dashboard">Go to Dashboard</Link>
    </main>
  );
}
