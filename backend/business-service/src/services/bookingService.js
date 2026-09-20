import { query } from '../db.js';

export async function createBooking(booking) {
  const result = await query(
    `INSERT INTO ticket_bookings_tb (
      visitor_name, email, visit_date, preferred_time_slot, ticket_type, ticket_label, quantity,
      contact_number, total_amount, booking_status, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Payment', 'Pending')`,
    [
      booking.visitor_name,
      booking.email,
      booking.visit_date,
      booking.preferred_time_slot,
      booking.ticket_type,
      booking.ticket_label,
      booking.quantity,
      booking.contact_number,
      booking.total,
    ],
  );

  return result.insertId;
}

export async function recentBookings(limit = 10) {
  return query(
    `SELECT id, visitor_name, email, visit_date, ticket_type, ticket_label,
            preferred_time_slot, quantity, contact_number, total_amount AS total, booking_status,
            payment_status, stripe_session_id, stripe_payment_intent_id, paid_at, created_at
     FROM ticket_bookings_tb
     ORDER BY id DESC
     LIMIT ?`,
    [limit],
  );
}

export async function bookingsByVisitorEmail(email) {
  if (!email) {
    return [];
  }

  return query(
    `SELECT id, visitor_name, email, visit_date, ticket_type, ticket_label,
            preferred_time_slot, quantity, contact_number, total_amount AS total, booking_status,
            payment_status, stripe_session_id, stripe_payment_intent_id, paid_at, created_at
     FROM ticket_bookings_tb
     WHERE email = ?
     ORDER BY id DESC`,
    [email],
  );
}

export async function setBookingStripeSession(bookingId, sessionId) {
  await query(
    `UPDATE ticket_bookings_tb
     SET stripe_session_id = ?, booking_status = 'Pending Payment', payment_status = 'Pending'
     WHERE id = ?`,
    [sessionId, bookingId],
  );
}

export async function markBookingPaidBySession(session) {
  const result = await query(
    `UPDATE ticket_bookings_tb
     SET stripe_payment_intent_id = ?, booking_status = 'Booked', payment_status = 'Paid', paid_at = NOW()
     WHERE stripe_session_id = ?`,
    [session.payment_intent || null, session.id],
  );

  return result.affectedRows > 0;
}

export async function bookingByStripeSession(sessionId) {
  const rows = await query(
    `SELECT id, visitor_name, email, visit_date, preferred_time_slot, ticket_type,
            ticket_label, quantity, contact_number, total_amount AS total,
            booking_status, payment_status, stripe_session_id,
            stripe_payment_intent_id, paid_at, created_at
     FROM ticket_bookings_tb
     WHERE stripe_session_id = ?
     LIMIT 1`,
    [sessionId],
  );

  return rows[0] || null;
}

export async function bookingByIdForVisitor(bookingId, email) {
  const rows = await query(
    `SELECT id, visitor_name, email, visit_date, preferred_time_slot, ticket_type,
            ticket_label, quantity, contact_number, total_amount AS total,
            booking_status, payment_status, stripe_session_id,
            stripe_payment_intent_id, paid_at, created_at
     FROM ticket_bookings_tb
     WHERE id = ? AND email = ?
     LIMIT 1`,
    [bookingId, email],
  );

  return rows[0] || null;
}
