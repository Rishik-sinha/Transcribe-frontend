import { BrandMark, Icon } from './icons';
import { cx, formatDuration, formatRelative } from '../lib/format';
import { workspaceStats } from '../lib/store';
import { initialsOf } from '../lib/auth';

const NAV = [
  { id: 'transcribe', label: 'Transcribe', icon: 'waveform', path: '/transcribe' },
  { id: 'library', label: 'Library', icon: 'list', path: '/library' },
  { id: 'settings', label: 'Settings', icon: 'sliders', path: '/settings' },
];

export function Sidebar({ route, navigate, sessions = [], user, onOpenPalette, onSignOut }) {
  const stats = workspaceStats(sessions);
  const weekMinutes = Math.round(stats.weekSeconds / 60);
  const goalPercent = Math.min(100, Math.round((weekMinutes / 60) * 100));
  const recent = sessions.slice(0, 5);

  return (
    <aside className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/[0.055] bg-night text-onNight md:flex md:w-[76px] xl:w-[268px]">
      <div className="flex h-[68px] shrink-0 items-center justify-center gap-2.5 px-4 xl:justify-start xl:px-6">
        <BrandMark size={30} />
        <div className="hidden xl:block">
          <p className="font-display text-[21px] leading-none tracking-[-0.01em]">Shabd</p>
          <p className="mt-[5px] text-[8.5px] uppercase leading-none tracking-[0.2em] text-onNight/40">
            Speech workspace
          </p>
        </div>
      </div>

      <div className="px-3 xl:px-4">
        <button
          type="button"
          onClick={() => navigate('/transcribe')}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-onNight px-3 py-[9px] text-[13px] font-medium text-ink transition-colors duration-150 hover:bg-white xl:justify-start"
        >
          <Icon name="mic" size={16} className="shrink-0" />
          <span className="hidden xl:inline">New recording</span>
          <span className="ml-auto hidden font-mono text-[10px] leading-none text-ink/30 xl:inline">
            ⌘N
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenPalette}
          className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12.5px] text-onNight/45 transition-colors duration-150 hover:bg-white/[0.05] hover:text-onNight/80 xl:justify-start"
        >
          <Icon name="search" size={15} className="shrink-0" />
          <span className="hidden xl:inline">Search sessions</span>
          <span className="ml-auto hidden font-mono text-[10px] leading-none xl:inline">⌘K</span>
        </button>
      </div>

      <nav className="mt-5 flex flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const active = route.name === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'relative flex items-center justify-center gap-2.5 rounded-lg px-3 py-[9px] text-[13px] transition-colors duration-150 xl:justify-start',
                active
                  ? 'bg-white/[0.07] text-onNight'
                  : 'text-onNight/55 hover:bg-white/[0.04] hover:text-onNight/85',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 hidden h-4 w-[2px] -translate-y-1/2 rounded-full bg-accentOnDark xl:block" />
              )}
              <Icon name={item.icon} size={16} className="shrink-0" />
              <span className="hidden xl:inline">{item.label}</span>
              {item.id === 'library' && stats.count > 0 && (
                <span className="ml-auto hidden font-mono text-[10.5px] leading-none text-onNight/40 xl:inline">
                  {stats.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-7 hidden min-h-0 flex-1 flex-col xl:flex">
        <div className="flex items-center justify-between px-6">
          <p className="text-[9.5px] font-semibold uppercase leading-none tracking-[0.18em] text-onNight/40">
            Recent
          </p>
          <span className="font-mono text-[9.5px] text-onNight/30">{stats.count}</span>
        </div>
        <div className="no-scrollbar mt-2.5 flex-1 space-y-px overflow-y-auto px-3 pb-4">
          {recent.length === 0 && (
            <p className="px-3 text-[11.5px] leading-relaxed text-onNight/40">
              Your recordings will collect here.
            </p>
          )}
          {recent.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => navigate(`/session/${session.id}`)}
              className="group flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition-colors duration-150 hover:bg-white/[0.045]"
            >
              <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-onNight/20 transition-colors group-hover:bg-accentOnDark" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] leading-snug text-onNight/60 transition-colors group-hover:text-onNight/90">
                  {session.title}
                </span>
                <span className="mt-0.5 block font-mono text-[9.5px] leading-none text-onNight/35">
                  {formatDuration(session.durationSec)} · {formatRelative(session.createdAt)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-white/[0.055] p-3 xl:p-4">
        <div className="hidden rounded-lg border border-white/[0.07] bg-white/[0.022] p-3 xl:block">
          <div className="flex items-baseline justify-between">
            <span className="text-[9.5px] uppercase leading-none tracking-[0.15em] text-onNight/40">
              This week
            </span>
            <span className="font-mono text-[11px] leading-none text-onNight/65">
              {weekMinutes} min
            </span>
          </div>
          <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-accentOnDark transition-[width] duration-500"
              style={{ width: `${Math.max(4, goalPercent)}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] leading-snug text-onNight/40">
            {stats.weekCount} sessions · saved to your account
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex min-w-0 flex-1 items-center justify-center gap-2.5 rounded-md py-1 transition-colors hover:bg-white/[0.04] xl:justify-start xl:px-2"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-nightRaised text-[10px] font-medium leading-none text-onNight/80 ring-1 ring-white/10">
              {initialsOf(user?.name)}
            </span>
            <span className="hidden min-w-0 flex-1 xl:block">
              <span className="block truncate text-[11.5px] leading-tight text-onNight/70">
                {user?.name || 'Your account'}
              </span>
              <span className="block truncate text-[10px] leading-tight text-onNight/40">
                {user?.email || 'Personal workspace'}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="hidden h-7 w-7 shrink-0 place-items-center rounded-md text-onNight/40 transition-colors hover:bg-white/[0.06] hover:text-onNight/80 xl:grid"
          >
            <Icon name="logout" size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ route, navigate, onOpenPalette }) {
  return (
    <div className="sticky top-0 z-40 flex items-center gap-1 border-b border-line bg-paper px-3 py-2 md:hidden">
      <div className="mr-1 flex items-center gap-2">
        <BrandMark size={24} />
        <span className="font-display text-[17px] leading-none tracking-[-0.01em]">Shabd</span>
      </div>
      <div className="ml-auto flex items-center gap-0.5">
        {NAV.map((item) => {
          const active = route.name === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              className={cx(
                'grid h-8 w-8 place-items-center rounded-md transition-colors',
                active ? 'bg-ink text-paper' : 'text-muted hover:bg-black/5',
              )}
            >
              <Icon name={item.icon} size={16} />
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Search"
          className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-black/5"
        >
          <Icon name="search" size={16} />
        </button>
      </div>
    </div>
  );
}
