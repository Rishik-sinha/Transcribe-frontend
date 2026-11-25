import { useCallback, useEffect, useState } from 'react';
import {
  changePassword as authChangePassword,
  getCurrentUser,
  getToken,
  refreshMe,
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
  updateAccount as authUpdateAccount,
} from '../lib/auth';

export function useAuth() {
  const [user, setUser] = useState(getCurrentUser);
  const [loading, setLoading] = useState(Boolean(getToken()));

  // Re-validate a persisted token against the backend on app start.
  useEffect(() => {
    if (!getToken()) return undefined;
    let alive = true;
    refreshMe()
      .then((next) => {
        if (alive) setUser(next);
      })
      .catch(() => {
        if (alive) {
          authSignOut();
          setUser(null);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const next = await authSignIn(credentials);
    setUser(next);
    return next;
  }, []);

  const signUp = useCallback(async (details) => {
    const next = await authSignUp(details);
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
  }, []);

  const updateAccount = useCallback(async (patch) => {
    const next = await authUpdateAccount(patch);
    setUser(next);
    return next;
  }, []);

  const changePassword = useCallback((payload) => authChangePassword(payload), []);

  return { user, loading, signIn, signUp, signOut, updateAccount, changePassword };
}
