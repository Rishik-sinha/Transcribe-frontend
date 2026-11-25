import { useEffect } from 'react';
import { isAppRoute, useRoute } from './hooks/useRoute';
import { useAuth } from './hooks/useAuth';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Workspace } from './Workspace';

const TITLES = {
  landing: 'Shabd — speak in Hinglish, read it back as text',
  transcribe: 'Live transcription · Shabd',
  library: 'Library · Shabd',
  settings: 'Settings · Shabd',
};

export default function App() {
  const { route, navigate } = useRoute();
  const { user, signIn, signUp, signOut, updateAccount, changePassword } = useAuth();

  const gated = isAppRoute(route.name);

  useEffect(() => {
    if (route.name === 'auth') {
      document.title = `${route.mode === 'signup' ? 'Create account' : 'Sign in'} · Shabd`;
    } else if (TITLES[route.name]) {
      document.title = TITLES[route.name];
    }
  }, [route.name, route.mode]);

  useEffect(() => {
    if (gated && !user) navigate('/login', { replace: true });
    else if (route.name === 'auth' && user) navigate('/transcribe', { replace: true });
  }, [gated, user, route.name, navigate]);

  if (route.name === 'auth' || (gated && !user)) {
    return (
      <AuthPage
        mode={route.mode === 'signup' ? 'signup' : 'signin'}
        navigate={navigate}
        onSignIn={signIn}
        onSignUp={signUp}
      />
    );
  }

  if (gated && user) {
    return (
      <Workspace
        key={user.id}
        user={user}
        route={route}
        navigate={navigate}
        onSignOut={signOut}
        onUpdateAccount={updateAccount}
        onChangePassword={changePassword}
      />
    );
  }

  return <LandingPage user={user} navigate={navigate} />;
}
