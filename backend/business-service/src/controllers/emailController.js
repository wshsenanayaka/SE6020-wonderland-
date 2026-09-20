import { bookingByIdForVisitor } from '../services/bookingService.js';
import { sendBookingConfirmationEmail } from '../services/emailService.js';

export async function resendBookingEmail(request, response) {
  const profileType = request.cookies.wonderland_profile_type || '';
  const profileEmail = request.cookies.wonderland_profile_email || '';
  const bookingId = Number(request.params.id || 0);

  if (profileType !== 'visitor' || !profileEmail) {
    return response.status(403).json({ success: false, message: 'Visitor login required.' });
  }

  const booking = await bookingByIdForVisitor(bookingId, profileEmail);
  if (!booking) {
    return response.status(404).json({ success: false, message: 'Booking not found.' });
  }

  if (booking.payment_status !== 'Paid') {
    return response.status(422).json({ success: false, message: 'QR email can be resent only after payment is paid.' });
  }

  const emailResult = await sendBookingConfirmationEmail(booking);
  if (!emailResult.sent) {
    return response.status(503).json({
      success: false,
      message: emailResult.reason || 'Email service is not configured.',
    });
  }

  return response.json({ success: true, message: 'Booking QR email resent successfully.' });
}
