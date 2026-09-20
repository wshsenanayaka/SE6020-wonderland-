import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { config } from '../config.js';

let transporter;

export function isEmailConfigured() {
  return Boolean(config.smtpHost && config.smtpUser && config.smtpPassword);
}

export async function sendBookingConfirmationEmail(booking) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'SMTP is not configured.' };
  }

  const qrPayload = [
    'Wonderland Booking',
    `Booking ID: ${booking.id}`,
    `Visitor: ${booking.visitor_name}`,
    `Email: ${booking.email}`,
    `Ticket: ${booking.ticket_label}`,
    `Quantity: ${booking.quantity}`,
    `Visit Date: ${formatDate(booking.visit_date)}`,
    `Time Slot: ${booking.preferred_time_slot || '-'}`,
    `Payment: ${booking.payment_status}`,
  ].join('\n');

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 720,
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  await mailer().sendMail({
    from: config.smtpFrom,
    to: booking.email,
    subject: `Wonderland Booking Confirmed #${booking.id}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#082640;line-height:1.6">
        <h2>Your Wonderland booking is confirmed</h2>
        <p>Hi ${escapeHtml(booking.visitor_name)},</p>
        <p>Your payment was successful and your booking is now confirmed.</p>
        <table style="border-collapse:collapse;width:100%;max-width:560px">
          ${row('Booking ID', `#${booking.id}`)}
          ${row('Ticket', booking.ticket_label)}
          ${row('Quantity', booking.quantity)}
          ${row('Visit Date', formatDate(booking.visit_date))}
          ${row('Preferred Time Slot', booking.preferred_time_slot || '-')}
          ${row('Total', `$${Number(booking.total || 0).toFixed(2)}`)}
          ${row('Payment Status', booking.payment_status)}
        </table>
        <p>Your QR code is attached to this email. Please show it at the park entrance.</p>
      </div>
    `,
    attachments: [
      {
        filename: `wonderland-booking-${booking.id}-qr.png`,
        content: qrBuffer,
        contentType: 'image/png',
      },
    ],
  });

  return { sent: true };
}

function mailer() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });
  }

  return transporter;
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:8px 10px;border:1px solid #dfe7ef;font-weight:700">${escapeHtml(label)}</td>
      <td style="padding:8px 10px;border:1px solid #dfe7ef">${escapeHtml(String(value ?? ''))}</td>
    </tr>
  `;
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
