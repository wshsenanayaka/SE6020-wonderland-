import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { query } from '../db.js';

function setProfileCookies(response, profile) {
  const options = { httpOnly: false, sameSite: 'lax', path: '/', maxAge: 24 * 60 * 60 * 1000 };
  response.cookie('wonderland_profile_name', profile.name, options);
  response.cookie('wonderland_profile_email', profile.email, options);
  response.cookie('wonderland_profile_type', profile.type, options);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, String(hash || '').replace(/^\$2y\$/, '$2b$'));
}

export async function login(request, response) {
  const profileType = request.body.profile_type || 'visitor';
  const email = String(request.body.email || '').trim().toLowerCase();
  const password = String(request.body.password || '');

  if (profileType === 'admin') {
    const isDefaultAdmin = email === config.defaultAdminEmail && verifyPassword(password, config.defaultAdminHash);
    if (isDefaultAdmin) {
      setProfileCookies(response, { name: 'Park Administrator', email: config.defaultAdminEmail, type: 'admin' });
      return response.json({ success: true, message: 'Login successful.', profile: { name: 'Park Administrator', email, type: 'admin', isLoggedIn: true } });
    }
  }

  const visitors = await query(
    `SELECT id, full_name, email, password_hash
     FROM visitors_tb
     WHERE email = ? AND status = 1
     LIMIT 1`,
    [email],
  );
  const visitor = visitors[0];

  if (visitor && verifyPassword(password, visitor.password_hash)) {
    setProfileCookies(response, { name: visitor.full_name, email: visitor.email, type: 'visitor' });
    return response.json({ success: true, message: 'Login successful.', profile: { name: visitor.full_name, email: visitor.email, type: 'visitor', isLoggedIn: true } });
  }

  return response.status(401).json({ success: false, message: 'Invalid email or password.' });
}

export function logout(_request, response) {
  ['wonderland_profile_name', 'wonderland_profile_email', 'wonderland_profile_type'].forEach((name) => {
    response.clearCookie(name, { path: '/' });
  });

  response.json({ success: true, message: 'Logged out successfully.' });
}

export function session(request, response) {
  const name = request.cookies.wonderland_profile_name || '';
  const email = request.cookies.wonderland_profile_email || '';
  const type = request.cookies.wonderland_profile_type || '';

  response.json({
    name,
    email,
    type,
    isLoggedIn: Boolean(name),
  });
}
