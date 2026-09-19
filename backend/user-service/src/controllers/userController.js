import bcrypt from 'bcryptjs';
import { query } from '../db.js';

export async function registerVisitor(request, response) {
  const password = String(request.body.password || '');
  const confirmPassword = String(request.body.confirm_password || '');
  const fullName = String(request.body.full_name || '').trim();
  const email = String(request.body.email || '').trim().toLowerCase();
  const contactNumber = String(request.body.contact_number || '').trim();

  if (!fullName || !email || !password || password !== confirmPassword) {
    return response.status(422).json({ success: false, message: 'Please check the registration details.' });
  }

  const existingVisitors = await query('SELECT id FROM visitors_tb WHERE email = ? LIMIT 1', [email]);
  if (existingVisitors.length > 0) {
    return response.status(409).json({ success: false, message: 'This visitor email is already registered. Please login.' });
  }

  const result = await query(
    `INSERT INTO visitors_tb (full_name, email, contact_number, password_hash, status)
     VALUES (?, ?, ?, ?, 1)`,
    [fullName, email, contactNumber, bcrypt.hashSync(password, 10)],
  );

  response.json({ success: true, message: 'Visitor registered successfully.', visitor_id: result.insertId });
}

export async function listVisitors(_request, response) {
  const visitors = await query(
    `SELECT id, full_name, email, contact_number, status, created_at, updated_at
     FROM visitors_tb
     ORDER BY id DESC`,
  );
  response.json(visitors);
}
