import { useCallback, useEffect, useState } from 'react';

const APP_ROUTES = new Set(['transcribe', 'library', 'settings', 'session']);

export function isAppRoute(name) {
  return APP_ROUTES.has(name);
}

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  if (!raw) return { name: 'landing' };

  const [segment, id] = raw.split('/');
  if (segment === 'login') return { name: 'auth', mode: 'signin' };
  if (segment === 'signup') return { name: 'auth', mode: 'signup' };
  if (segment === 'library') return { name: 'library' };
  if (segment === 'settings') return { name: 'settings' };
  if (segment === 'session' && id) return { name: 'session', id };
  if (segment === 'transcribe') return { name: 'transcribe' };
  return { name: 'landing' };
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/');
      setRoute({ name: 'landing' });
    }
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((path, options = {}) => {
    const target = path.startsWith('#') ? path : `#${path.startsWith('/') ? path : `/${path}`}`;

    if (window.location.hash === target) {
      setRoute(parseHash());
      return;
    }

    if (options.replace) {
      window.history.replaceState(null, '', target);
      setRoute(parseHash());
      return;
    }

    window.location.hash = target;
  }, []);

  return { route, navigate };
}
