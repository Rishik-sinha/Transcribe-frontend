import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPut } from '../api/client';

export const DEFAULT_SETTINGS = {
  defaultLanguage: 'mixed',
  autoScroll: true,
  confirmDelete: true,
  keepAudio: false,
  narrationRate: 1,
};

/**
 * Per-account preferences, stored server-side (user_settings table) via the
 * API. The hook loads them once per workspace mount and persists every change.
 */
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiGet('/settings')
      .then(({ settings: remote }) => {
        if (alive && remote) setSettings({ ...DEFAULT_SETTINGS, ...remote });
      })
      .catch(() => {
        /* keep defaults when the request fails */
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next) => {
    apiPut('/settings', next)
      .then(({ settings: remote }) => {
        if (remote) setSettings({ ...DEFAULT_SETTINGS, ...remote });
      })
      .catch(() => {
        /* optimistic value stays; next load reconciles */
      });
  }, []);

  const update = useCallback(
    (patch) => {
      setSettings((current) => {
        const next = { ...current, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    persist(DEFAULT_SETTINGS);
  }, [persist]);

  return { settings, loading, update, reset };
}
