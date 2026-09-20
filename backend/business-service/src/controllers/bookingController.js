import { allTicketPasses, toTicketTypesMap } from '../services/ticketPassService.js';
import { createBooking, setBookingStripeSession } from '../services/bookingService.js';
import { createCheckoutSession } from '../services/stripeService.js';

export async function bookTicket(request, response) {
  const ticketTypes = toTicketTypesMap(await allTicketPasses());
  const fallbackKey = Object.keys(ticketTypes)[0];
  const ticketKey = String(request.body.ticket_type || fallbackKey || '');
  const ticket = ticketTypes[ticketKey] || ticketTypes[fallbackKey];

  if (!ticket) {
    return response.status(422).json({ success: false, message: 'No ticket passes are available.' });
  }

  const quantity = Math.max(1, Math.min(20, Number(request.body.quantity || 1)));
  const booking = {
    visitor_name: String(request.body.visitor_name || '').trim(),
    email: String(request.body.email || '').trim(),
    visit_date: String(request.body.visit_date || '').trim(),
    preferred_time_slot: String(request.body.preferred_time_slot || '').trim(),
    ticket_type: ticketKey,
    ticket_label: ticket.label,
    quantity,
    contact_number: String(request.body.contact_number || '').trim(),
    currency_code: ticket.currency_code || 'USD',
    total: quantity * Number(ticket.price),
    created_at: new Date().toISOString(),
  };

  if (!booking.visit_date || !booking.preferred_time_slot) {
    return response.status(422).json({ success: false, message: 'Please select visit date and preferred time slot.' });
  }

  const bookingId = await createBooking(booking);
  const checkoutSession = await createCheckoutSession({ bookingId, booking, ticket });
  await setBookingStripeSession(bookingId, checkoutSession.id);

  response.json({
    success: true,
    message: 'Booking saved. Redirecting to Stripe payment.',
    booking_id: bookingId,
    checkout_url: checkoutSession.url,
  });
}
