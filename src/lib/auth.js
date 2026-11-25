// Real accounts backed by the Express API + Supabase Auth.
//
// The backend signs users up/in and returns a Supabase access token; this
// module stores { user, token } in web storage and hands the token to
// api/client.js for every request. Nothing outside this module knows how the
// session is stored.

import { apiGet, apiPatch, apiPost } from '../api/client';

const SESSION_KEY = 'shabd.auth.session.v2';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD = 8;

export function initialsOf(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'S'
  );
}

export function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.token && parsed.user ? parsed : null;
  } catch {
    return null;
  }
}

function writeSession(session, remember = true) {
  const payload = JSON.stringify({ ...session, startedAt: new Date().toISOString() });
  try {
    if (remember) {
      localStorage.setItem(SESSION_KEY, payload);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, payload);
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* storage blocked — the session still works until reload */
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function getToken() {
  return readSession()?.token || null;
}

export function getCurrentUser() {
  return readSession()?.user || null;
}

/** Called by the API client on a 401: drop the stale session and go sign in. */
export function onUnauthorized() {
  clearSession();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
}

export async function signUp({ name, email, password }) {
  const data = await apiPost('/auth/signup', { name, email, password });
  if (!data?.token) {
    throw new Error('Account created, but the sign-in token was missing. Please sign in.');
  }
  writeSession({ user: data.user, token: data.token }, true);
  return data.user;
}

export async function signIn({ email, password, remember = true }) {
  const data = await apiPost('/auth/login', { email, password });
  if (!data?.token) throw new Error('Sign-in succeeded but no token was returned.');
  writeSession({ user: data.user, token: data.token }, remember);
  return data.user;
}

export async function signOut() {
  try {
    await apiPost('/auth/logout', {});
  } catch {
    /* token may already be invalid — clear locally regardless */
  }
  clearSession();
}

/** Re-validate the stored token against the backend and refresh the profile. */
export async function refreshMe() {
  const token = getToken();
  if (!token) return null;
  const { user } = await apiGet('/auth/me');
  const session = readSession();
  writeSession({ user, token }, Boolean(localStorage.getItem(SESSION_KEY)) || !session);
  return user;
}

export async function updateAccount(patch = {}) {
  const { user } = await apiPatch('/auth/me', patch);
  const session = readSession();
  if (session) {
    writeSession({ user, token: session.token }, Boolean(localStorage.getItem(SESSION_KEY)));
  }
  return user;
}

export async function changePassword({ currentPassword, nextPassword }) {
  await apiPost('/auth/password', { currentPassword, nextPassword });
  return true;
}
