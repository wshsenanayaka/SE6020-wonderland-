import { Link } from 'react-router-dom';

export default function PaymentCancel() {
  return (
    <main className="account-section payment-result">
      <span className="section-kicker">Payment</span>
      <h2>Payment Cancelled</h2>
      <p className="section-copy">Your booking payment was cancelled. You can return home and try again.</p>
      <Link className="primary-btn" to="/">Back to Tickets</Link>
    </main>
  );
}
