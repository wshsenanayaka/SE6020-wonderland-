import crypto from 'crypto';
import { query } from '../db.js';

export async function createBooking(booking) {
  const qrToken = crypto.randomUUID();
  const result = await query(
    `INSERT INTO ticket_bookings_tb (
      visitor_name, email, visit_date, preferred_time_slot, ticket_type, ticket_label, quantity,
      contact_number, currency_code, total_amount, booking_status, payment_status, qr_token, checkin_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Payment', 'Pending', ?, 'Not Arrived')`,
    [
      booking.visitor_name,
      booking.email,
      booking.visit_date,
      booking.preferred_time_slot,
      booking.ticket_type,
      booking.ticket_label,
      booking.quantity,
      booking.contact_number,
      booking.currency_code,
      booking.total,
      qrToken,
    ],
  );

  return result.insertId;
}

export async function recentBookings(limit = null) {
  const limitClause = Number.isInteger(limit) && limit > 0 ? 'LIMIT ?' : '';
  const params = limitClause ? [limit] : [];

  return query(
    `SELECT id, visitor_name, email, visit_date, ticket_type, ticket_label,
            preferred_time_slot, quantity, contact_number, currency_code, total_amount AS total, booking_status,
            payment_status, stripe_session_id, stripe_payment_intent_id, paid_at, qr_token, checkin_status,
            arrived_at, created_at
     FROM ticket_bookings_tb
     ORDER BY id DESC
     ${limitClause}`,
    params,
  );
}

export async function bookingsByVisitorEmail(email) {
  if (!email) {
    return [];
  }

  return query(
    `SELECT id, visitor_name, email, visit_date, ticket_type, ticket_label,
            preferred_time_slot, quantity, contact_number, currency_code, total_amount AS total, booking_status,
            payment_status, stripe_session_id, stripe_payment_intent_id, paid_at, qr_token, checkin_status,
            arrived_at, created_at
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
            currency_code, booking_status, payment_status, stripe_session_id,
            stripe_payment_intent_id, paid_at, qr_token, checkin_status, arrived_at, created_at
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
            currency_code, booking_status, payment_status, stripe_session_id,
            stripe_payment_intent_id, paid_at, qr_token, checkin_status, arrived_at, created_at
     FROM ticket_bookings_tb
     WHERE id = ? AND email = ?
     LIMIT 1`,
    [bookingId, email],
  );

  return rows[0] || null;
}

export async function checkInBooking(bookingId, qrToken) {
  const rows = await query(
    `SELECT id, visitor_name, email, visit_date, preferred_time_slot, ticket_label,
            quantity, currency_code, total_amount AS total, booking_status, payment_status,
            checkin_status, arrived_at
     FROM ticket_bookings_tb
     WHERE id = ? AND qr_token = ?
     LIMIT 1`,
    [bookingId, qrToken],
  );
  const booking = rows[0];

  if (!booking) {
    return { status: 'not_found', booking: null };
  }

  if (booking.payment_status !== 'Paid') {
    return { status: 'payment_required', booking };
  }

  if (booking.checkin_status === 'Arrived') {
    return { status: 'already_arrived', booking };
  }

  await query(
    `UPDATE ticket_bookings_tb
     SET checkin_status = 'Arrived', booking_status = 'Arrived', arrived_at = NOW()
     WHERE id = ? AND qr_token = ?`,
    [bookingId, qrToken],
  );

  const updated = await query(
    `SELECT id, visitor_name, email, visit_date, preferred_time_slot, ticket_label,
            quantity, currency_code, total_amount AS total, booking_status, payment_status,
            checkin_status, arrived_at
     FROM ticket_bookings_tb
     WHERE id = ?
     LIMIT 1`,
    [bookingId],
  );

  return { status: 'arrived', booking: updated[0] || booking };
}
