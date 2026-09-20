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

export async function visitorProfile(request, response) {
  const profileType = getCookie(request, 'wonderland_profile_type');
  const profileEmail = getCookie(request, 'wonderland_profile_email');

  if (profileType !== 'visitor' || !profileEmail) {
    return response.status(403).json({ success: false, message: 'Visitor login required.' });
  }

  const visitors = await query(
    `SELECT id, full_name, email, contact_number, status, created_at, updated_at
     FROM visitors_tb
     WHERE email = ? AND status = 1
     LIMIT 1`,
    [profileEmail],
  );

  if (!visitors[0]) {
    return response.status(404).json({ success: false, message: 'Visitor profile not found.' });
  }

  return response.json({ success: true, visitor: visitors[0] });
}

export async function updateVisitorProfile(request, response) {
  const profileType = getCookie(request, 'wonderland_profile_type');
  const profileEmail = getCookie(request, 'wonderland_profile_email');
  const fullName = String(request.body.full_name || '').trim();
  const contactNumber = String(request.body.contact_number || '').trim();

  if (profileType !== 'visitor' || !profileEmail) {
    return response.status(403).json({ success: false, message: 'Visitor login required.' });
  }

  if (!fullName || !contactNumber) {
    return response.status(422).json({ success: false, message: 'Full name and contact number are required.' });
  }

  const result = await query(
    `UPDATE visitors_tb
     SET full_name = ?, contact_number = ?
     WHERE email = ? AND status = 1`,
    [fullName, contactNumber, profileEmail],
  );

  if (result.affectedRows === 0) {
    return response.status(404).json({ success: false, message: 'Visitor profile not found.' });
  }

  const cookieOptions = { httpOnly: false, sameSite: 'lax', path: '/', maxAge: 24 * 60 * 60 * 1000 };
  response.cookie('wonderland_profile_name', fullName, cookieOptions);
  response.cookie('wonderland_profile_contact', contactNumber, cookieOptions);

  return response.json({
    success: true,
    message: 'Visitor profile updated successfully.',
    profile: {
      name: fullName,
      email: profileEmail,
      contact_number: contactNumber,
      type: 'visitor',
      isLoggedIn: true,
    },
  });
}

function getCookie(request, name) {
  const cookies = String(request.headers.cookie || '').split(';');
  const cookie = cookies.find((item) => item.trim().startsWith(`${name}=`));
  if (!cookie) {
    return '';
  }

  return decodeURIComponent(cookie.split('=').slice(1).join('='));
}
