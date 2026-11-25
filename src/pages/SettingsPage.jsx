import { useEffect, useState } from 'react';
import { useToast } from '../components/Toast';
import { Icon } from '../components/icons';
import { PageHeader, Select, Toggle, Kbd, FieldLabel } from '../components/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ASR_OPTIONS } from '../lib/languages';
import { downloadFile, formatDate } from '../lib/format';
import { exportAll, getEngineInfo } from '../lib/store';
import { initialsOf, MIN_PASSWORD } from '../lib/auth';

function Section({ title, description, children }) {
  return (
    <section className="grid gap-4 border-t border-line py-8 md:grid-cols-[210px_minmax(0,1fr)] md:gap-10">
      <div>
        <h2 className="text-[13px] font-semibold tracking-[-0.005em] text-ink">{title}</h2>
        {description && (
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Shortcut({ keys, label }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-lineSoft py-2.5 last:border-0">
      <span className="text-[12.5px] text-graphite">{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </span>
    </div>
  );
}

export function SettingsPage({
  settings,
  update,
  reset,
  onClearAll,
  sessionsCount,
  user,
  onUpdateAccount,
  onChangePassword,
  onSignOut,
}) {
  const toast = useToast();
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getEngineInfo()
      .then((info) => {
        if (!cancelled) setEngine(info);
      })
      .catch(() => {
        if (!cancelled) setEngine({ configured: false, engine: '' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      await onUpdateAccount({ name: profileName, email: profileEmail });
      toast.push('Account updated');
    } catch (error) {
      toast.push(error?.message || 'Could not update the account', { tone: 'error' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    if (savingPassword) return;
    if (nextPassword.length < MIN_PASSWORD) {
      toast.push(`Use at least ${MIN_PASSWORD} characters for the new password`, { tone: 'error' });
      return;
    }
    if (nextPassword !== confirmPassword) {
      toast.push('The two new passwords do not match', { tone: 'error' });
      return;
    }
    setSavingPassword(true);
    try {
      await onChangePassword({ currentPassword, nextPassword });
      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
      toast.push('Password updated');
    } catch (error) {
      toast.push(error?.message || 'Could not update the password', { tone: 'error' });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleExportAll() {
    try {
      const payload = await exportAll();
      downloadFile('shabd-sessions.json', payload, 'application/json;charset=utf-8');
      toast.push('Workspace exported');
    } catch {
      toast.push('Could not export the workspace', { tone: 'error' });
    }
  }

  async function handleClearAll() {
    setBusy(true);
    try {
      await onClearAll();
      setConfirmClear(false);
      toast.push('All sessions cleared');
    } catch {
      toast.push('Could not clear the workspace', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Workspace · Preferences"
        title="Settings"
        description="Capture defaults, the speech engine, and what happens to your data. Sessions are stored in your account."
      />

      <div className="mt-10 max-w-[880px]">
        <Section
          title="Account"
          description="The identity attached to this workspace. Stored in your account."
        >
          <form onSubmit={saveProfile} className="max-w-[420px]">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-medium text-paper">
                {initialsOf(user?.name)}
              </span>
              <div className="min-w-0 flex-1 space-y-3.5">
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <input
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    aria-label="Name"
                    autoComplete="name"
                    className="input"
                  />
                </div>
                <div>
                  <FieldLabel hint="used to sign in">Email</FieldLabel>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(event) => setProfileEmail(event.target.value)}
                    aria-label="Email"
                    autoComplete="email"
                    className="input"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="submit" className="btn btn-ink" disabled={savingProfile}>
                    {savingProfile ? 'Saving…' : 'Save changes'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={onSignOut}>
                    <Icon name="logout" size={14} />
                    Sign out
                  </button>
                </div>
                <p className="text-[11.5px] leading-relaxed text-faint">
                  Member since {formatDate(user?.createdAt)} · {sessionsCount}{' '}
                  {sessionsCount === 1 ? 'session' : 'sessions'} in this workspace
                </p>
              </div>
            </div>
          </form>
        </Section>

        <Section
          title="Password"
          description="Changing it here updates the password for your account."
        >
          <form onSubmit={savePassword} className="max-w-[420px] space-y-3.5">
            <div>
              <FieldLabel>Current password</FieldLabel>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                aria-label="Current password"
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <FieldLabel hint={`${MIN_PASSWORD}+ characters`}>New password</FieldLabel>
                <input
                  type="password"
                  value={nextPassword}
                  onChange={(event) => setNextPassword(event.target.value)}
                  aria-label="New password"
                  autoComplete="new-password"
                  className="input"
                  placeholder="New password"
                />
              </div>
              <div>
                <FieldLabel>Confirm</FieldLabel>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  aria-label="Confirm new password"
                  autoComplete="new-password"
                  className="input"
                  placeholder="Repeat it"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-outline" disabled={savingPassword}>
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </Section>

        <Section
          title="Capture"
          description="How the recorder behaves when you open the workspace."
        >
          <div className="max-w-[360px]">
            <Select
              value={settings.defaultLanguage}
              onChange={(value) => update({ defaultLanguage: value })}
              ariaLabel="Default language"
              options={ASR_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
            />
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-faint">
              The recognition locale used for new recordings. You can change it mid-session.
            </p>
          </div>

          <div className="mt-3 divide-y divide-lineSoft border-t border-lineSoft">
            <Toggle
              label="Follow the transcript while recording"
              description="Keep the live transcript scrolled to the newest sentence."
              checked={settings.autoScroll}
              onChange={(value) => update({ autoScroll: value })}
            />
            <Toggle
              label="Confirm before deleting"
              description="Ask for confirmation before a session or draft is removed."
              checked={settings.confirmDelete}
              onChange={(value) => update({ confirmDelete: value })}
            />
            <Toggle
              label="Keep the original audio"
              description="Store the recording alongside the transcript. Requires the backend storage layer."
              checked={settings.keepAudio}
              onChange={(value) => update({ keepAudio: value })}
              disabled
            />
          </div>
        </Section>

        <Section
          title="Speech engine"
          description="The engine that transcribes your microphone while you speak."
        >
          <div className="flex items-start gap-3 rounded-lg border border-lineStrong bg-canvas p-3.5 shadow-[0_1px_2px_rgba(16,22,28,0.05)]">
            <span className="mt-[2px] grid h-4 w-4 shrink-0 place-items-center rounded-full border border-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-ink" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-medium text-ink">
                  {engine?.engine || (engine ? 'Not configured' : 'Checking engine…')}
                </p>
                <span
                  className={
                    engine?.configured
                      ? 'rounded-full border border-accentLine bg-accentSoft px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-[0.1em] text-accent'
                      : 'rounded-full border border-line bg-canvas px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-[0.1em] text-faint'
                  }
                >
                  {engine == null ? 'checking' : engine.configured ? 'active' : 'not configured'}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                {engine?.configured
                  ? 'Your microphone audio is sent to this engine in short phrases as you narrate, so the transcript appears live. The saved text always comes from the recording itself.'
                  : 'Set AI_PROVIDER and AI_API_KEY in backend/.env to enable transcription. Until then, recordings cannot be transcribed.'}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
            The engine is configured on the server, so it is the same for every device signed in to
            this workspace. There is no mock mode: a real provider key is required.
          </p>
        </Section>

        <Section
          title="Data"
          description="Sessions are stored in your account and sync across the devices you sign in from."
        >
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-outline" onClick={handleExportAll}>
              <Icon name="download" size={14} />
              Export all sessions
            </button>
            <button
              type="button"
              className="btn btn-ghost hover:bg-dangerSoft hover:text-danger"
              onClick={() => setConfirmClear(true)}
              disabled={sessionsCount === 0}
            >
              <Icon name="trash" size={14} />
              Clear workspace
            </button>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
            Export produces a JSON file with every transcript, note and timestamp. Clearing removes
            all sessions from your account and cannot be undone.
          </p>
        </Section>

        <Section
          title="Keyboard"
          description="The workspace is built to be driven from the keyboard."
        >
          <div className="max-w-[440px]">
            <Shortcut keys={['⌘', 'K']} label="Search sessions and actions" />
            <Shortcut keys={['⌘', 'N']} label="Start a new recording" />
            <Shortcut keys={['⌘', '↵']} label="Save a transcript segment" />
            <Shortcut keys={['↑', '↓']} label="Move through search results" />
            <Shortcut keys={['esc']} label="Close a dialog or cancel an edit" />
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-4"
            onClick={() => {
              reset();
              toast.push('Preferences reset to defaults');
            }}
          >
            <Icon name="refresh" size={13} />
            Reset preferences
          </button>
        </Section>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear the entire workspace?"
        description={`All ${sessionsCount} sessions, transcripts and notes will be deleted from your account. This cannot be undone.`}
        confirmLabel="Clear everything"
        busy={busy}
        onConfirm={handleClearAll}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}
