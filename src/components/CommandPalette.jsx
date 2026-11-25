import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icons';
import { cx, formatDuration, formatRelative } from '../lib/format';

export function CommandPalette({ open, onClose, sessions = [], navigate }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setCursor(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  const actions = [
    {
      id: 'new',
      label: 'Start a new recording',
      meta: '⌘N',
      icon: 'mic',
      run: () => navigate('/transcribe'),
    },
    {
      id: 'library',
      label: 'Open the library',
      meta: '',
      icon: 'list',
      run: () => navigate('/library'),
    },
    {
      id: 'settings',
      label: 'Workspace settings',
      meta: '',
      icon: 'sliders',
      run: () => navigate('/settings'),
    },
  ];

  const q = query.trim().toLowerCase();

  const actionResults = useMemo(
    () => actions.filter((action) => !q || action.label.toLowerCase().includes(q)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q],
  );

  const sessionResults = useMemo(() => {
    const source = q
      ? sessions.filter((session) => {
          const haystack = `${session.title} ${(session.segments || [])
            .map((segment) => segment.text)
            .join(' ')}`.toLowerCase();
          return haystack.includes(q);
        })
      : sessions;
    return source.slice(0, 6).map((session) => ({
      id: session.id,
      label: session.title,
      meta: `${formatDuration(session.durationSec)} · ${formatRelative(session.createdAt)}`,
      icon: 'fileText',
      run: () => navigate(`/session/${session.id}`),
    }));
  }, [sessions, q, navigate]);

  const flat = useMemo(
    () => [...actionResults, ...sessionResults],
    [actionResults, sessionResults],
  );

  useEffect(() => {
    setCursor(0);
  }, [q]);

  if (!open) return null;

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((current) => Math.min(flat.length - 1, current + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((current) => Math.max(0, current - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = flat[cursor];
      if (item) {
        item.run();
        onClose();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  const groups = [
    { label: 'Actions', items: actionResults, offset: 0 },
    { label: 'Sessions', items: sessionResults, offset: actionResults.length },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        className="relative w-full max-w-[560px] animate-fade-up overflow-hidden rounded-xl2 border border-line bg-canvas shadow-lift"
      >
        <div className="flex items-center gap-2.5 border-b border-lineSoft px-4 py-3">
          <Icon name="search" size={16} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search sessions, or jump to a page…"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint"
          />
          <span className="kbd shrink-0">esc</span>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {flat.length === 0 && (
            <div className="px-3 py-10 text-center">
              <p className="font-display text-[19px] text-ink">Nothing matches “{query}”</p>
              <p className="mt-1 text-[12px] text-muted">Try a different word, or start a new recording.</p>
            </div>
          )}

          {groups.map((group) =>
            group.items.length === 0 ? null : (
              <div key={group.label} className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-faint">
                  {group.label}
                </p>
                {group.items.map((item, index) => {
                  const absolute = group.offset + index;
                  const active = absolute === cursor;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setCursor(absolute)}
                      onClick={() => {
                        item.run();
                        onClose();
                      }}
                      className={cx(
                        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                        active ? 'bg-paper' : 'hover:bg-paper/60',
                      )}
                    >
                      <span
                        className={cx(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-md border',
                          active
                            ? 'border-line bg-canvas text-ink'
                            : 'border-transparent text-muted',
                        )}
                      >
                        <Icon name={item.icon} size={14} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{item.label}</span>
                      {item.meta && (
                        <span className="shrink-0 font-mono text-[10px] text-faint">{item.meta}</span>
                      )}
                      {active && <Icon name="arrowRight" size={13} className="shrink-0 text-faint" />}
                    </button>
                  );
                })}
              </div>
            ),
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-lineSoft bg-paper/50 px-4 py-2 font-mono text-[10px] text-faint">
          <span>↑↓ to navigate</span>
          <span>↵ to open</span>
          <span className="ml-auto">Shabd</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
