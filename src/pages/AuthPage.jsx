import { useEffect, useRef, useState } from 'react';
import { BrandMark, Icon } from '../components/icons';
import { FieldLabel } from '../components/ui';
import { EMAIL_PATTERN, MIN_PASSWORD } from '../lib/auth';
import { cx } from '../lib/format';

const COPY = {
  signin: {
    title: 'Welcome back.',
    subtitle: 'Sign in to pick up your transcripts where you left them.',
    submit: 'Sign in',
    switchPrompt: 'New to Shabd?',
    switchLabel: 'Create an account',
    switchTo: 'signup',
  },
  signup: {
    title: 'Create your workspace.',
    subtitle: 'One account for your recordings, notes and exports across your devices.',
    submit: 'Create account',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Sign in',
    switchTo: 'signin',
  },
};

function PanelBackdrop() {
  return (
    <div
      className="hairline-grid-light pointer-events-none absolute inset-0 opacity-25"
      aria-hidden="true"
    />
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-night px-12 py-10 text-onNight lg:flex lg:flex-col">
      <PanelBackdrop />

      <div className="relative">
        <span className="flex items-center gap-2.5">
          <BrandMark size={32} />
          <span className="leading-none">
            <span className="block font-display text-[23px] leading-none tracking-[-0.01em] text-onNight">
              Shabd
            </span>
            <span className="mt-[5px] block text-[8px] uppercase leading-none tracking-[0.2em] text-onNight/40">
              Speech workspace
            </span>
          </span>
        </span>
      </div>

      <div className="relative my-auto max-w-[400px] py-14">
        <h2 className="font-display text-[clamp(2.3rem,3.2vw,3rem)] leading-[1.02] tracking-[-0.02em] text-onNight">
          Your words,
          <br />
          <span className="italic text-onNight/70">written down.</span>
        </h2>
        <p className="mt-4 max-w-[34ch] text-[13px] leading-[1.7] text-onNight/55">
          Shabd listens while you talk and leaves you with text you can edit, search and send.
        </p>

        <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="micro text-onNight/40">A line from the library</p>
          <p className="mt-2.5 font-display text-[19px] leading-[1.5] text-onNight">
            “Toh basically, hum onboarding ko do steps mein todna chahte hain.”
          </p>
          <p className="mt-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-onNight/35">
            Sprint planning · 00:34
          </p>
        </div>

        <ul className="mt-8 space-y-3">
          {[
            'Per-sentence timestamps, not one wall of text',
            'Edit or annotate any line after the call',
            'Export to text, subtitles or Markdown',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[12.5px] text-onNight/65">
              <span className="mt-[1px] grid h-4 w-4 shrink-0 place-items-center rounded-full border border-white/15 text-onNight/70">
                <Icon name="check" size={9} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-2 border-t border-white/[0.07] pt-5 text-[10.5px] text-onNight/40">
        <Icon name="shield" size={13} />
        Audio is sent only to your configured speech engine.
      </div>
    </aside>
  );
}

function PasswordField({ id, label, hint, value, onChange, error, autoComplete, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cx('input py-2.5 pr-10', error && 'border-danger/50')}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-faint transition-colors hover:text-ink"
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} size={15} />
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[11px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthPage({ mode = 'signin', navigate, onSignIn, onSignUp }) {
  const isSignup = mode === 'signup';
  const copy = COPY[isSignup ? 'signup' : 'signin'];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setErrors({});
    setFormError('');
    setPassword('');
    setConfirm('');
  }, [mode]);

  useEffect(() => {
    if (window.matchMedia?.('(min-width: 1024px)').matches) {
      emailRef.current?.focus();
    }
  }, [mode]);

  function validate() {
    const next = {};
    if (isSignup && name.trim().length < 2) {
      next.name = 'Please tell us your name.';
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (isSignup) {
      if (password.length < MIN_PASSWORD) {
        next.password = `Use at least ${MIN_PASSWORD} characters.`;
      } else if (confirm !== password) {
        next.confirm = 'The two passwords do not match.';
      }
    } else if (!password) {
      next.password = 'Enter your password.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending) return;
    setFormError('');
    if (!validate()) return;

    setPending(true);
    try {
      if (isSignup) await onSignUp({ name, email, password });
      else await onSignIn({ email, password, remember });
      navigate('/transcribe', { replace: true });
    } catch (error) {
      setFormError(error?.message || 'Something went wrong. Please try again.');
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]">
      <BrandPanel />

      <main className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 pt-5 md:px-10">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-ghost -ml-2 px-2 text-[12.5px]"
          >
            <Icon name="arrowLeft" size={14} />
            Back to home
          </button>

          <span className="flex items-center gap-2 lg:hidden">
            <BrandMark size={24} />
            <span className="font-display text-[17px] leading-none tracking-[-0.01em]">Shabd</span>
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-14 pt-10 md:px-10">
          <div className="w-full max-w-[400px]">
            <div className="flex gap-6 border-b border-line" role="tablist" aria-label="Account">
              {[
                { id: 'signin', label: 'Sign in' },
                { id: 'signup', label: 'Create account' },
              ].map((tab) => {
                const active = (tab.id === 'signup') === isSignup;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => navigate(tab.id === 'signup' ? '/signup' : '/login')}
                    className={cx(
                      '-mb-px border-b-2 pb-2.5 text-[12.5px] transition-colors',
                      active
                        ? 'border-ink font-medium text-ink'
                        : 'border-transparent text-muted hover:text-ink',
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-7">
              <h1 className="font-display text-[34px] leading-[1.05] tracking-[-0.015em] text-ink">
                {copy.title}
              </h1>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{copy.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
              {isSignup && (
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder="Rishi Kumar"
                    aria-label="Name"
                    aria-invalid={Boolean(errors.name)}
                    className={cx('input py-2.5', errors.name && 'border-danger/50')}
                  />
                  {errors.name && <p className="mt-1.5 text-[11px] text-danger">{errors.name}</p>}
                </div>
              )}

              <div>
                <FieldLabel>Email</FieldLabel>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-label="Email"
                  aria-invalid={Boolean(errors.email)}
                  className={cx('input py-2.5', errors.email && 'border-danger/50')}
                />
                {errors.email && <p className="mt-1.5 text-[11px] text-danger">{errors.email}</p>}
              </div>

              <PasswordField
                id="password"
                label="Password"
                hint={isSignup ? `${MIN_PASSWORD}+ characters` : null}
                value={password}
                onChange={setPassword}
                error={errors.password}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
              />

              {isSignup && (
                <PasswordField
                  id="confirm"
                  label="Confirm password"
                  value={confirm}
                  onChange={setConfirm}
                  error={errors.confirm}
                  autoComplete="new-password"
                  placeholder="Repeat the password"
                />
              )}

              {!isSignup && (
                <label className="flex w-fit cursor-pointer items-center gap-2.5 text-[12px] text-muted">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="grid h-[15px] w-[15px] place-items-center rounded-[4px] border border-lineStrong bg-canvas text-transparent transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40">
                    <Icon name="check" size={9} strokeWidth={2.4} />
                  </span>
                  Keep me signed in on this device
                </label>
              )}

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-amberLine bg-amberSoft px-3 py-2.5 text-[11.5px] leading-relaxed text-amber"
                >
                  <Icon name="alert" size={13} className="mt-[1px] shrink-0" />
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="btn btn-ink w-full py-2.5 text-[13px]"
              >
                {pending ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-paper/40 border-t-paper" />
                    {isSignup ? 'Creating account…' : 'Signing in…'}
                  </>
                ) : (
                  <>
                    {copy.submit}
                    <Icon name="arrowRight" size={14} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-[12px] text-muted">
              {copy.switchPrompt}{' '}
              <button
                type="button"
                onClick={() =>
                  navigate(copy.switchTo === 'signup' ? '/signup' : '/login')
                }
                className="font-medium text-ink underline decoration-lineStrong decoration-1 underline-offset-2 transition-colors hover:decoration-ink"
              >
                {copy.switchLabel}
              </button>
            </p>

            <p className="mt-8 flex items-center justify-center gap-1.5 text-[10px] leading-relaxed text-faint">
              <Icon name="lock" size={11} />
              Accounts and transcripts are stored securely in your workspace.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
