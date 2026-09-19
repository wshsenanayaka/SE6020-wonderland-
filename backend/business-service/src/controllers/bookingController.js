import { allTicketPasses, toTicketTypesMap } from '../services/ticketPassService.js';
import { createBooking } from '../services/bookingService.js';

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
    ticket_type: ticketKey,
    ticket_label: ticket.label,
    quantity,
    contact_number: String(request.body.contact_number || '').trim(),
    total: quantity * Number(ticket.price),
    created_at: new Date().toISOString(),
  };

  await createBooking(booking);

  response.json({ success: true, message: 'Booking saved successfully.' });
}
