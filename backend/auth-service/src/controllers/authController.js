import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { query } from '../db.js';

const usesHttpsFrontend = config.frontendOrigin.startsWith('https://');

function setProfileCookies(response, profile) {
  // Amplify and CloudFront use different site origins in AWS. Cross-site API
  // requests need Secure + SameSite=None, while local HTTP development does not.
  const options = {
    httpOnly: true,
    secure: usesHttpsFrontend,
    sameSite: usesHttpsFrontend ? 'none' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  };
  response.cookie('wonderland_profile_name', profile.name, options);
  response.cookie('wonderland_profile_email', profile.email, options);
  response.cookie('wonderland_profile_contact', profile.contact || '', options);
  response.cookie('wonderland_profile_type', profile.type, options);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, String(hash || '').replace(/^\$2y\$/, '$2b$'));
}

export async function login(request, response) {
  if (isCognitoEnabled()) {
    return cognitoLogin(request, response);
  }

  return legacyLogin(request, response);
}

export async function registerCognitoVisitor(request, response) {
  if (!isCognitoEnabled()) {
    return response.status(503).json({ success: false, message: 'Amazon Cognito is not configured for this environment.' });
  }

  const fullName = String(request.body.full_name || '').trim();
  const email = String(request.body.email || '').trim().toLowerCase();
  const contactNumber = String(request.body.contact_number || '').trim();
  const password = String(request.body.password || '');
  const confirmPassword = String(request.body.confirm_password || '');

  if (!fullName || !email || !password || password !== confirmPassword) {
    return response.status(422).json({ success: false, message: 'Please check the registration details.' });
  }

  await cognitoRequest('SignUp', {
    ClientId: config.cognitoUserPoolClientId,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: fullName },
      { Name: 'custom:contact_number', Value: contactNumber },
    ],
  });

  return response.status(201).json({
    success: true,
    message: 'Check your email for the Cognito confirmation code.',
    confirmation_required: true,
  });
}

export async function confirmCognitoRegistration(request, response) {
  if (!isCognitoEnabled()) {
    return response.status(503).json({ success: false, message: 'Amazon Cognito is not configured for this environment.' });
  }

  const email = String(request.body.email || '').trim().toLowerCase();
  const code = String(request.body.confirmation_code || '').trim();
  if (!email || !code) {
    return response.status(422).json({ success: false, message: 'Email address and confirmation code are required.' });
  }

  await cognitoRequest('ConfirmSignUp', {
    ClientId: config.cognitoUserPoolClientId,
    Username: email,
    ConfirmationCode: code,
  });

  return response.json({ success: true, message: 'Your account is confirmed. Please sign in.' });
}

export async function updateCognitoProfile(request, response) {
  if (!isCognitoEnabled()) {
    return response.status(503).json({ success: false, message: 'Amazon Cognito is not configured for this environment.' });
  }

  const accessToken = bearerToken(request.headers.authorization);
  const fullName = String(request.body.full_name || '').trim();
  const contactNumber = String(request.body.contact_number || '').trim();
  if (!accessToken || !fullName || !contactNumber) {
    return response.status(422).json({ success: false, message: 'Full name and contact number are required.' });
  }

  await cognitoRequest('UpdateUserAttributes', {
    AccessToken: accessToken,
    UserAttributes: [
      { Name: 'name', Value: fullName },
      { Name: 'custom:contact_number', Value: contactNumber },
    ],
  });

  return response.json({ success: true, message: 'Visitor profile updated successfully.' });
}

async function cognitoLogin(request, response) {
  const email = String(request.body.email || '').trim().toLowerCase();
  const password = String(request.body.password || '');
  if (!email || !password) {
    return response.status(422).json({ success: false, message: 'Email address and password are required.' });
  }

  const result = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: config.cognitoUserPoolClientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  if (!result.AuthenticationResult) {
    return response.status(409).json({
      success: false,
      message: `Cognito requires the ${result.ChallengeName || 'next'} authentication step.`,
    });
  }

  return response.json({
    success: true,
    message: 'Cognito login successful.',
    authentication: {
      access_token: result.AuthenticationResult.AccessToken,
      expires_in: result.AuthenticationResult.ExpiresIn,
    },
  });
}

async function legacyLogin(request, response) {
  const profileType = request.body.profile_type || 'visitor';
  const email = String(request.body.email || '').trim().toLowerCase();
  const password = String(request.body.password || '');

  if (profileType === 'admin') {
    const administrators = await query(
      `SELECT id, full_name, email, password_hash, role_name
       FROM administrators_tb
       WHERE email = ? AND status = 1
       LIMIT 1`,
      [email],
    );
    const administrator = administrators[0];

    if (administrator && verifyPassword(password, administrator.password_hash)) {
      setProfileCookies(response, { name: administrator.full_name, email: administrator.email, type: 'admin' });
      return response.json({
        success: true,
        message: 'Login successful.',
        profile: {
          name: administrator.full_name,
          email: administrator.email,
          role: administrator.role_name,
          type: 'admin',
          isLoggedIn: true,
        },
      });
    }

    const isDefaultAdmin = email === config.defaultAdminEmail && verifyPassword(password, config.defaultAdminHash);
    if (isDefaultAdmin) {
      setProfileCookies(response, { name: 'Park Administrator', email: config.defaultAdminEmail, type: 'admin' });
      return response.json({ success: true, message: 'Login successful.', profile: { name: 'Park Administrator', email, type: 'admin', isLoggedIn: true } });
    }

    return response.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const visitors = await query(
    `SELECT id, full_name, email, password_hash
            , contact_number
     FROM visitors_tb
     WHERE email = ? AND status = 1
     LIMIT 1`,
    [email],
  );
  const visitor = visitors[0];

  if (visitor && verifyPassword(password, visitor.password_hash)) {
    setProfileCookies(response, {
      name: visitor.full_name,
      email: visitor.email,
      contact: visitor.contact_number,
      type: 'visitor',
    });
    return response.json({
      success: true,
      message: 'Login successful.',
      profile: {
        name: visitor.full_name,
        email: visitor.email,
        contact_number: visitor.contact_number,
        type: 'visitor',
        isLoggedIn: true,
      },
    });
  }

  return response.status(401).json({ success: false, message: 'Invalid email or password.' });
}

function isCognitoEnabled() {
  return Boolean(config.cognitoUserPoolClientId && config.cognitoRegion);
}

function bearerToken(authorization) {
  const match = /^Bearer\s+(.+)$/i.exec(String(authorization || ''));
  return match ? match[1].trim() : '';
}

async function cognitoRequest(action, body) {
  const cognitoResponse = await fetch(`https://cognito-idp.${config.cognitoRegion}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await cognitoResponse.json().catch(() => ({}));
  if (!cognitoResponse.ok) {
    const message = payload.message || 'Amazon Cognito authentication request failed.';
    const error = new Error(message);
    error.statusCode = cognitoResponse.status === 400 ? 401 : cognitoResponse.status;
    throw error;
  }
  return payload;
}

export function logout(_request, response) {
  const options = {
    httpOnly: true,
    secure: usesHttpsFrontend,
    sameSite: usesHttpsFrontend ? 'none' : 'lax',
    path: '/',
  };
  ['wonderland_profile_name', 'wonderland_profile_email', 'wonderland_profile_contact', 'wonderland_profile_type'].forEach((name) => {
    response.clearCookie(name, options);
  });

  response.json({ success: true, message: 'Logged out successfully.' });
}

export function session(request, response) {
  const name = request.cookies.wonderland_profile_name || '';
  const email = request.cookies.wonderland_profile_email || '';
  const contact = request.cookies.wonderland_profile_contact || '';
  const type = request.cookies.wonderland_profile_type || '';

  response.json({
    name,
    email,
    contact_number: contact,
    type,
    isLoggedIn: Boolean(name),
  });
}
