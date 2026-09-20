import Stripe from 'stripe';
import { config } from '../config.js';

let stripeClient;

export function stripe() {
  if (!config.stripeSecretKey) {
    throw new Error('Stripe secret key is not configured.');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(config.stripeSecretKey);
  }

  return stripeClient;
}

export async function createCheckoutSession({ bookingId, booking, ticket }) {
  const unitAmount = Math.round(Number(ticket.price) * 100);

  return stripe().checkout.sessions.create({
    mode: 'payment',
    success_url: config.stripeSuccessUrl,
    cancel_url: config.stripeCancelUrl,
    customer_email: booking.email,
    client_reference_id: String(bookingId),
    metadata: {
      booking_id: String(bookingId),
      ticket_type: booking.ticket_type,
      preferred_time_slot: booking.preferred_time_slot,
    },
    line_items: [
      {
        quantity: booking.quantity,
        price_data: {
          currency: (ticket.currency_code || config.stripeCurrency).toLowerCase(),
          product_data: {
            name: booking.ticket_label,
            description: `Wonderland visit date: ${booking.visit_date} | Time slot: ${booking.preferred_time_slot}`,
          },
          unit_amount: unitAmount,
        },
      },
    ],
  });
}

export async function retrieveCheckoutSession(sessionId) {
  return stripe().checkout.sessions.retrieve(sessionId);
}
