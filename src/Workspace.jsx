import { useEffect, useState } from 'react';
import { Sidebar, MobileNav } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useSessions } from './hooks/useSessions';
import { useSettings } from './hooks/useSettings';
import { TranscribePage } from './pages/TranscribePage';
import { LibraryPage } from './pages/LibraryPage';
import { SessionPage } from './pages/SessionPage';
import { SettingsPage } from './pages/SettingsPage';

export function Workspace({
  user,
  route,
  navigate,
  onSignOut,
  onUpdateAccount,
  onChangePassword,
}) {
  const { sessions, loading, create, update, remove, removeAll } = useSessions();
  const { settings, update: updateSettings, reset: resetSettings } = useSettings(user.id);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const list = sessions || [];
  const activeSession =
    route.name === 'session' ? list.find((session) => session.id === route.id) || null : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.name, route.id]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key === 'k') {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
      if (key === 'n') {
        event.preventDefault();
        navigate('/transcribe');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar
        route={route}
        navigate={navigate}
        sessions={list}
        user={user}
        onOpenPalette={() => setPaletteOpen(true)}
        onSignOut={() => setSignOutOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav
          route={route}
          navigate={navigate}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1240px] px-5 pb-20 pt-7 md:px-9 md:pt-10 lg:px-12">
          {route.name === 'transcribe' && (
            <TranscribePage
              onSave={create}
              navigate={navigate}
              defaultLanguage={settings.defaultLanguage}
              autoScrollDefault={settings.autoScroll}
            />
          )}

          {route.name === 'library' && (
            <LibraryPage
              sessions={list}
              loading={loading}
              navigate={navigate}
              onDelete={remove}
              confirmDelete={settings.confirmDelete}
            />
          )}

          {route.name === 'session' && (
            <SessionPage
              session={activeSession}
              loading={loading}
              navigate={navigate}
              onUpdate={update}
              onDelete={remove}
              narrationRate={settings.narrationRate}
              confirmDelete={settings.confirmDelete}
            />
          )}

          {route.name === 'settings' && (
            <SettingsPage
              settings={settings}
              update={updateSettings}
              reset={resetSettings}
              onClearAll={removeAll}
              sessionsCount={list.length}
              user={user}
              onUpdateAccount={onUpdateAccount}
              onChangePassword={onChangePassword}
              onSignOut={() => setSignOutOpen(true)}
            />
          )}
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        sessions={list}
        navigate={navigate}
      />

      <ConfirmDialog
        open={signOutOpen}
        tone="default"
        title="Sign out of Shabd?"
        description="Your transcripts are saved to your account. Sign back in any time to pick them up."
        confirmLabel="Sign out"
        onConfirm={() => {
          setSignOutOpen(false);
          onSignOut();
        }}
        onClose={() => setSignOutOpen(false)}
      />
    </div>
  );
}
