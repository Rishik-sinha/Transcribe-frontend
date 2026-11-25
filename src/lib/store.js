// Session store backed by the Express API (Supabase).

import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client';

export async function listSessions() {
  const { sessions } = await apiGet('/transcriptions');
  return sessions;
}

export async function getSession(id) {
  try {
    const { session } = await apiGet(`/transcriptions/${id}`);
    return session;
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function createSession(draft) {
  const { session } = await apiPost('/transcriptions', draft);
  return session;
}

export async function updateSession(id, patch) {
  const { session } = await apiPatch(`/transcriptions/${id}`, patch);
  return session;
}

export async function deleteSession(id) {
  await apiDelete(`/transcriptions/${id}`);
  return true;
}

export async function clearAllSessions() {
  await apiDelete('/transcriptions');
  return true;
}

export async function exportAll() {
  const payload = await apiGet('/transcriptions/export');
  return JSON.stringify(payload, null, 2);
}

/** Send recorded audio to the backend and get a verbatim transcript back. */
export async function transcribeAudio({ audioBase64, mimeType, language }) {
  return apiPost('/ai/transcribe', { audioBase64, mimeType, language });
}

/** The provider/model actually serving transcription on this deployment. */
export async function getEngineInfo() {
  return apiGet('/ai/engine');
}

export function workspaceStats(sessions = []) {
  const weekAgo = Date.now() - 7 * 86400000;
  const totalSeconds = sessions.reduce((total, session) => total + (session.durationSec || 0), 0);
  const totalWords = sessions.reduce((total, session) => total + (session.words || 0), 0);
  const thisWeek = sessions.filter((session) => new Date(session.createdAt).getTime() >= weekAgo);
  return {
    count: sessions.length,
    seconds: totalSeconds,
    words: totalWords,
    weekCount: thisWeek.length,
    weekSeconds: thisWeek.reduce((total, session) => total + (session.durationSec || 0), 0),
  };
}
