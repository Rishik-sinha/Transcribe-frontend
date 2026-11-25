// Fetch wrapper for the Express API.
// The Vite dev server proxies /api to http://localhost:5000.
// Every request carries the Supabase access token minted by /api/auth/login.

import { getToken, onUnauthorized } from '../lib/auth';

const PUBLIC_PATHS = ['/auth/login', '/auth/signup'];

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (res.status === 401 && !PUBLIC_PATHS.includes(path)) {
    onUnauthorized();
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* keep the status message */
    }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
}

export function apiGet(path) {
  return request(path);
}

export function apiPost(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPut(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function apiPatch(path, body) {
  return request(path, { method: 'PATCH', body: JSON.stringify(body) });
}

export function apiDelete(path) {
  return request(path, { method: 'DELETE' });
}
