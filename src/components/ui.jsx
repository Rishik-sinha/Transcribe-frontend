import { Icon } from './icons';
import { LANGUAGES } from '../lib/languages';
import { cx } from '../lib/format';

export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div className="min-w-0">
        {eyebrow && <p className="micro">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-[38px] leading-[1.04] tracking-[-0.012em] text-ink md:text-[46px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 max-w-[56ch] text-[13.5px] leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {children ? <div className="flex items-center gap-2 pb-1">{children}</div> : null}
    </header>
  );
}

const CHIP_TONES = {
  mixed: 'border-line bg-paper text-graphite',
  hi: 'border-amberLine bg-amberSoft text-amber',
  en: 'border-accentLine bg-accentSoft text-accent',
};

export function LanguageChip({ language = 'mixed', withDot = true, className = '' }) {
  const meta = LANGUAGES[language] || LANGUAGES.mixed;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-[2px] text-[10.5px] font-medium leading-[15px]',
        CHIP_TONES[language] || CHIP_TONES.mixed,
        className,
      )}
    >
      {withDot && <span className="h-[3px] w-[3px] rounded-full bg-current opacity-55" />}
      {meta.label}
    </span>
  );
}

export function StatusDot({ tone = 'idle', pulse = false, className = '' }) {
  const tones = {
    idle: 'bg-numeral',
    live: 'bg-live',
    paused: 'bg-muted',
    ready: 'bg-accent',
  };
  return (
    <span className={cx('relative inline-flex h-1.5 w-1.5', className)}>
      {pulse && (
        <span className={cx('absolute inset-0 animate-ping-slow rounded-full', tones[tone])} />
      )}
      <span className={cx('relative h-1.5 w-1.5 rounded-full', tones[tone])} />
    </span>
  );
}

export function IconButton({ icon, label, onClick, size = 15, className = '', tone = 'default', disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx(
        'icon-btn',
        tone === 'danger' && 'hover:bg-dangerSoft hover:text-danger',
        className,
      )}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}

export function Select({ value, onChange, options, className = '', ariaLabel }) {
  return (
    <div className={cx('relative', className)}>
      <select
        aria-label={ariaLabel}
        className="select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevronDown"
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <div className="flex items-start justify-between gap-10 py-4">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative mt-0.5 h-[22px] w-[38px] shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-ink bg-ink' : 'border-lineStrong bg-paperDeep',
          disabled && 'opacity-40',
        )}
      >
        <span
          className={cx(
            'absolute top-[2px] h-[16px] w-[16px] rounded-full bg-canvas shadow-[0_1px_2px_rgba(16,22,28,0.25)] transition-transform duration-200 ease-out',
            checked ? 'translate-x-[18px]' : 'translate-x-[2px]',
          )}
        />
      </button>
    </div>
  );
}

export function EmptyState({ icon = 'waveform', title, body, children, className = '' }) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center rounded-xl2 border border-dashed border-lineStrong bg-paper/40 px-8 py-14 text-center',
        className,
      )}
    >
      <span className="grid h-11 w-11 place-items-center rounded-full border border-line bg-canvas text-muted">
        <Icon name={icon} size={19} />
      </span>
      <p className="mt-4 font-display text-[21px] leading-tight text-ink">{title}</p>
      {body && <p className="mt-1.5 max-w-[38ch] text-[13px] leading-relaxed text-muted">{body}</p>}
      {children && <div className="mt-5 flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <span className={cx('skeleton block', className)} />;
}

export function Kbd({ children }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function FieldLabel({ children, hint }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="text-[12px] font-medium text-graphite">{children}</span>
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
    </div>
  );
}
