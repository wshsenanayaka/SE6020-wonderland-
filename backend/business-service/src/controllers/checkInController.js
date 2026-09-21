import { checkInBooking } from '../services/bookingService.js';

export async function checkInTicketBooking(request, response) {
  const bookingId = Number(request.params.id || 0);
  const qrToken = String(request.body.qr_token || request.query.token || '').trim();

  if (!bookingId || !qrToken) {
    return response.status(422).json({ success: false, message: 'Booking ID and QR token are required.' });
  }

  const result = await checkInBooking(bookingId, qrToken);

  if (result.status === 'not_found') {
    return response.status(404).json({ success: false, message: 'Invalid or expired booking QR code.' });
  }

  if (result.status === 'payment_required') {
    return response.status(422).json({
      success: false,
      message: 'This booking cannot be marked arrived because payment is not completed.',
      booking: result.booking,
    });
  }

  if (result.status === 'already_arrived') {
    return response.json({
      success: true,
      message: 'This visitor has already arrived at the park.',
      booking: result.booking,
      already_arrived: true,
    });
  }

  return response.json({
    success: true,
    message: 'Visitor arrival confirmed. Booking status changed to Arrived.',
    booking: result.booking,
  });
}
