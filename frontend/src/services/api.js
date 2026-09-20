const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
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
  manageActivity: async (formData) => {
    const response = await fetch(`${API_BASE}/api/business/activities`, {
      method: 'POST',
      credentials: 'include',
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
  login: (data) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  registerVisitor: (data) => request('/api/users/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  visitorProfile: () => request('/api/users/profile'),
  updateVisitorProfile: (data) => request('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  logout: () => request('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  }),
};
