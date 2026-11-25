import { useCallback, useEffect, useState } from 'react';
import {
  clearAllSessions,
  createSession,
  deleteSession,
  listSessions,
  updateSession,
} from '../lib/store';

export function useSessions() {
  const [sessions, setSessions] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listSessions();
      setSessions(list);
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (draft) => {
    const session = await createSession(draft);
    setSessions((current) => [session, ...(current || [])]);
    return session;
  }, []);

  const update = useCallback(async (id, patch) => {
    const session = await updateSession(id, patch);
    setSessions((current) =>
      (current || []).map((item) => (item.id === id ? session : item)),
    );
    return session;
  }, []);

  const remove = useCallback(async (id) => {
    await deleteSession(id);
    setSessions((current) => (current || []).filter((item) => item.id !== id));
  }, []);

  const removeAll = useCallback(async () => {
    await clearAllSessions();
    setSessions([]);
  }, []);

  return {
    sessions,
    loading: sessions === null,
    refresh,
    create,
    update,
    remove,
    removeAll,
  };
}
