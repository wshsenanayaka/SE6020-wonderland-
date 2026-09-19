import { query } from '../db.js';

export const defaultTicketPasses = [
  {
    id: 1,
    ticket_tier: 'Adult Day Pass',
    guests: '1 Adult',
    ticket_price_indicative: 48,
    effective_price_per_guest: 48,
    status: 1,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    ticket_tier: 'Child Day Pass',
    guests: '1 Child',
    ticket_price_indicative: 32,
    effective_price_per_guest: 32,
    status: 1,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    ticket_tier: 'Family Bundle',
    guests: '2 Adults + 2 Children',
    ticket_price_indicative: 145,
    effective_price_per_guest: 36.25,
    status: 1,
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

export async function allTicketPasses() {
  await seedTicketPasses();
  const rows = await query(
    `SELECT id, ticket_tier, guests, ticket_price_indicative, effective_price_per_guest, status, created_at, updated_at
     FROM ticket_passes_tb
     ORDER BY id ASC`,
  );
  return normalizePasses(rows);
}

export async function editableTicketPasses() {
  return allTicketPasses();
}

export function toTicketTypesMap(ticketPasses) {
  return ticketPasses.reduce((ticketTypes, ticketPass) => {
    if (Number(ticketPass.status ?? 1) !== 1) {
      return ticketTypes;
    }

    ticketTypes[String(ticketPass.id)] = {
      label: ticketPass.ticket_tier,
      price: Number(ticketPass.ticket_price_indicative),
      guests: ticketPass.guests,
      effective_price_per_guest: Number(ticketPass.effective_price_per_guest),
      note: `${ticketPass.guests} / ${formatNumber(ticketPass.effective_price_per_guest)} per guest`,
    };
    return ticketTypes;
  }, {});
}

export async function createTicketPass(body) {
  const ticketPass = buildTicketPass(body, {
    status: 1,
  });

  if (!ticketPass) {
    return null;
  }

  const result = await query(
    `INSERT INTO ticket_passes_tb (ticket_tier, guests, ticket_price_indicative, effective_price_per_guest, status)
     VALUES (?, ?, ?, ?, 1)`,
    [ticketPass.ticket_tier, ticketPass.guests, ticketPass.ticket_price_indicative, ticketPass.effective_price_per_guest],
  );
  return { ...ticketPass, id: result.insertId };
}

export async function updateTicketPass(id, body) {
  const existing = await query('SELECT id FROM ticket_passes_tb WHERE id = ? LIMIT 1', [id]);
  if (existing.length === 0) {
    return null;
  }

  const ticketPass = buildTicketPass(body, {
    id: Number(id),
  });

  if (!ticketPass) {
    return false;
  }

  await query(
    `UPDATE ticket_passes_tb
     SET ticket_tier = ?, guests = ?, ticket_price_indicative = ?, effective_price_per_guest = ?
     WHERE id = ?`,
    [ticketPass.ticket_tier, ticketPass.guests, ticketPass.ticket_price_indicative, ticketPass.effective_price_per_guest, id],
  );
  return ticketPass;
}

export async function deleteTicketPass(id) {
  const result = await query('DELETE FROM ticket_passes_tb WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

function buildTicketPass(body, base) {
  const ticketTier = String(body.ticket_tier || '').trim();
  const guests = String(body.guests || '').trim();
  const ticketPriceIndicative = Number(body.ticket_price_indicative || 0);
  const effectivePricePerGuest = Number(body.effective_price_per_guest || 0);

  if (
    !ticketTier
    || !guests
    || !Number.isFinite(ticketPriceIndicative)
    || ticketPriceIndicative <= 0
    || !Number.isFinite(effectivePricePerGuest)
    || effectivePricePerGuest <= 0
  ) {
    return null;
  }

  return {
    ...base,
    ticket_tier: ticketTier,
    guests,
    ticket_price_indicative: ticketPriceIndicative,
    effective_price_per_guest: effectivePricePerGuest,
  };
}

function normalizePasses(ticketPasses) {
  return ticketPasses.map((ticketPass) => {
    const ticketPriceIndicative = Number(ticketPass.ticket_price_indicative ?? ticketPass.amount ?? 0);
    const guests = ticketPass.guests || guessGuests(ticketPass.pass_type || ticketPass.ticket_tier);

    return {
      id: ticketPass.id,
      ticket_tier: ticketPass.ticket_tier || ticketPass.pass_type || '',
      guests,
      ticket_price_indicative: ticketPriceIndicative,
      effective_price_per_guest: Number(ticketPass.effective_price_per_guest ?? ticketPriceIndicative),
      status: Number(ticketPass.status ?? 1),
      created_at: ticketPass.created_at,
      updated_at: ticketPass.updated_at,
    };
  });
}

function formatNumber(amount) {
  return Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function guessGuests(ticketTier) {
  const value = String(ticketTier || '').toLowerCase();
  if (value.includes('family')) {
    return '2 Adults + 2 Children';
  }
  if (value.includes('child')) {
    return '1 Child';
  }
  return '1 Guest';
}

async function seedTicketPasses() {
  const rows = await query('SELECT COUNT(*) AS total FROM ticket_passes_tb');
  if (Number(rows[0]?.total || 0) > 0) {
    return;
  }

  await Promise.all(defaultTicketPasses.map((ticketPass) => query(
    `INSERT INTO ticket_passes_tb (ticket_tier, guests, ticket_price_indicative, effective_price_per_guest, status)
     VALUES (?, ?, ?, ?, 1)`,
    [ticketPass.ticket_tier, ticketPass.guests, ticketPass.ticket_price_indicative, ticketPass.effective_price_per_guest],
  )));
}
