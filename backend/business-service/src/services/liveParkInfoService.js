import { operations as defaultOperations } from '../data/defaultData.js';
import { query } from '../db.js';

const ADMIN_OPERATION_KEYS = ['avg_wait_time', 'ride_uptime'];
const TICKET_COLORS = ['#ff5a3d', '#f6b73c', '#0ea5b7', '#22a06b', '#7c3aed', '#0f766e'];

export async function liveParkInfo() {
  await seedLiveParkInfo();

  const operationRows = await query(
    `SELECT id, metric_key, label, value, trend, sort_order, status
     FROM park_operations_tb
     WHERE status = 1
     ORDER BY sort_order ASC, id ASC`,
  );
  const bookingMetrics = await bookingOperationMetrics();
  const operations = operationRows.map((item) => bookingMetrics[item.metric_key] || item);
  const behaviourMix = await bookingBehaviourMix();

  return { operations, behaviourMix };
}

export async function allLiveParkInfoRows() {
  await seedLiveParkInfo();

  return liveParkInfo();
}

export async function updateLiveParkInfo(body) {
  const operations = (Array.isArray(body.operations) ? body.operations : [])
    .filter((item) => ADMIN_OPERATION_KEYS.includes(item.metric_key));

  await Promise.all(operations.map((item, index) => upsertOperation(item, index)));

  return allLiveParkInfoRows();
}

async function seedLiveParkInfo() {
  const operationRows = await query('SELECT COUNT(*) AS total FROM park_operations_tb');
  if (Number(operationRows[0]?.total || 0) === 0) {
    await Promise.all(defaultOperations.map((item, index) => upsertOperation({
      ...item,
      metric_key: slugify(item.label),
      sort_order: index + 1,
      status: 1,
    }, index)));
  }
}

async function upsertOperation(item, index) {
  const label = String(item.label || '').trim();
  const value = String(item.value || '').trim();

  if (!label || !value) {
    return;
  }

  const metricKey = String(item.metric_key || slugify(label)).trim();
  await query(
    `INSERT INTO park_operations_tb (metric_key, label, value, trend, sort_order, status)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       label = VALUES(label),
       value = VALUES(value),
       trend = VALUES(trend),
       sort_order = VALUES(sort_order),
       status = VALUES(status)`,
    [
      metricKey,
      label,
      value,
      String(item.trend || '').trim(),
      Number(item.sort_order || index + 1),
      Number(item.status ?? 1) === 1 ? 1 : 0,
    ],
  );
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || `metric_${Date.now()}`;
}

async function bookingOperationMetrics() {
  const rows = await query(
    `SELECT
       COALESCE(SUM(CASE
         WHEN checkin_status = 'Arrived' AND DATE(arrived_at) = CURDATE()
         THEN quantity ELSE 0 END), 0) AS visitors_in_park,
       COALESCE(SUM(CASE
         WHEN visit_date = CURDATE() AND payment_status = 'Paid'
         THEN quantity ELSE 0 END), 0) AS tickets_today
     FROM ticket_bookings_tb`,
  );
  const metrics = rows[0] || {};

  return {
    visitors_in_park: {
      metric_key: 'visitors_in_park',
      label: 'Visitors In Park',
      value: formatNumber(metrics.visitors_in_park),
      trend: 'From QR check-ins',
      sort_order: 1,
      status: 1,
    },
    tickets_today: {
      metric_key: 'tickets_today',
      label: 'Tickets Today',
      value: formatNumber(metrics.tickets_today),
      trend: 'Paid visits today',
      sort_order: 2,
      status: 1,
    },
  };
}

async function bookingBehaviourMix() {
  const rows = await query(
    `SELECT ticket_label AS label, COALESCE(SUM(quantity), 0) AS total
     FROM ticket_bookings_tb
     WHERE payment_status = 'Paid'
     GROUP BY ticket_label
     ORDER BY total DESC, ticket_label ASC`,
  );
  const totalTickets = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);

  if (totalTickets === 0) {
    return [];
  }

  return rows.map((row, index) => ({
    mix_key: slugify(row.label),
    label: row.label || 'Ticket',
    value: Math.round((Number(row.total || 0) / totalTickets) * 100),
    color: TICKET_COLORS[index % TICKET_COLORS.length],
    sort_order: index + 1,
    status: 1,
  }));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
