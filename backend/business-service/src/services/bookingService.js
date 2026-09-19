import { query } from '../db.js';

export async function createBooking(booking) {
  await query(
    `INSERT INTO ticket_bookings_tb (
      visitor_name, email, visit_date, ticket_type, ticket_label, quantity,
      contact_number, total_amount, booking_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
    [
      booking.visitor_name,
      booking.email,
      booking.visit_date,
      booking.ticket_type,
      booking.ticket_label,
      booking.quantity,
      booking.contact_number,
      booking.total,
    ],
  );
}

export async function recentBookings(limit = 10) {
  return query(
    `SELECT id, visitor_name, email, visit_date, ticket_type, ticket_label,
            quantity, contact_number, total_amount AS total, booking_status, created_at
     FROM ticket_bookings_tb
     ORDER BY id DESC
     LIMIT ?`,
    [limit],
  );
}
