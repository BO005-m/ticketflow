const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tf_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || 'Request failed');
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  listEvents: () => request('/events'),
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (body) => request('/events', { method: 'POST', body: JSON.stringify(body) }),
  myEvents: () => request('/events/mine'),
  purchaseTicket: (event_id) => request('/tickets/purchase', { method: 'POST', body: JSON.stringify({ event_id }) }),
  myTickets: () => request('/tickets/mine'),
  getTicketQR: (id) => request(`/tickets/${id}/qr`),
  rotateToken: (id) => request(`/tickets/${id}/rotate`, { method: 'POST' }),
  validateTicket: (body) => request('/tickets/validate', { method: 'POST', body: JSON.stringify(body) }),
  resellTicket: (id, to_email) => request(`/tickets/${id}/resell`, { method: 'POST', body: JSON.stringify({ to_email }) }),
};
