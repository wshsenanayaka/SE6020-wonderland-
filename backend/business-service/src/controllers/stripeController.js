import { bookingByStripeSession, markBookingPaidBySession } from '../services/bookingService.js';
import { sendBookingConfirmationEmail } from '../services/emailService.js';
import { retrieveCheckoutSession } from '../services/stripeService.js';

export async function confirmStripeSession(request, response) {
  const sessionId = String(request.body.session_id || '').trim();
  if (!sessionId) {
    return response.status(422).json({ success: false, message: 'Stripe session id is required.' });
  }

  const session = await retrieveCheckoutSession(sessionId);
  if (session.payment_status !== 'paid') {
    return response.status(422).json({ success: false, message: 'Payment is not completed yet.' });
  }

  await markBookingPaidBySession(session);
  const booking = await bookingByStripeSession(session.id);
  let emailResult = { sent: false };
  if (booking) {
    emailResult = await sendBookingConfirmationEmail(booking);
  }

  return response.json({
    success: true,
    message: emailResult.sent
      ? 'Payment confirmed. Your booking is now booked and the QR email was sent.'
      : 'Payment confirmed. Your booking is now booked. QR email is pending because SMTP is not configured.',
    email_sent: emailResult.sent,
  });
}
