import {
  clearCognitoSession,
  cognitoAccessToken,
  isCognitoConfigured,
  saveCognitoSession,
} from './cognitoSession.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const accessToken = cognitoAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed.');
  }

  return payload;
}

export function assetUrl(path) {
  if (!path) {
    return `${API_BASE}/assets/images/wonderland-hero.png`;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE}/${path.replace(/^\/+/, '')}`;
}

export const api = {
  platformData: () => request('/api/platform-data'),
  recordActivityImpressions: (activityIds) => request('/api/business/analytics/activity-impressions', {
    method: 'POST',
    body: JSON.stringify({ activity_ids: activityIds }),
  }),
  manageActivity: async (formData) => {
    const accessToken = cognitoAccessToken();
    const response = await fetch(`${API_BASE}/api/business/activities`, {
      method: 'POST',
      credentials: 'include',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      body: formData,
    });
    const responseText = await response.text();
    let payload = {};
    try {
      payload = responseText ? JSON.parse(responseText) : {};
    } catch {
      payload = { message: responseText };
    }
    if (!response.ok) {
      throw new Error(payload.message || `Activity request failed (${response.status}).`);
    }
    return payload;
  },
  bookTicket: (data) => request('/api/business/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  confirmStripeSession: (sessionId) => request('/api/business/stripe/confirm-session', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  }),
  resendBookingEmail: (bookingId) => request(`/api/business/bookings/${bookingId}/resend-email`, {
    method: 'POST',
    body: JSON.stringify({}),
  }),
  checkInBooking: (bookingId, qrToken) => request(`/api/business/bookings/${bookingId}/check-in`, {
    method: 'POST',
    body: JSON.stringify({ qr_token: qrToken }),
  }),
  createTicketPass: (data) => request('/api/business/ticket-passes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTicketPass: (id, data) => request(`/api/business/ticket-passes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteTicketPass: (id) => request(`/api/business/ticket-passes/${id}`, {
    method: 'DELETE',
  }),
  updateLiveParkInfo: (data) => request('/api/business/live-park-info', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  login: async (data) => {
    const payload = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    saveCognitoSession(payload.authentication);
    return payload;
  },
  registerVisitor: (data) => request(isCognitoConfigured() ? '/api/auth/register' : '/api/users/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  confirmCognitoRegistration: (data) => request('/api/auth/confirm-registration', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  syncVisitorProfile: () => request('/api/users/profile/sync', { method: 'POST', body: JSON.stringify({}) }),
  visitorProfile: () => request('/api/users/profile'),
  updateVisitorProfile: (data) => request(isCognitoConfigured() ? '/api/auth/profile' : '/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  logout: () => {
    clearCognitoSession();
    return Promise.resolve({ success: true, message: 'Logged out successfully.' });
  },
};
