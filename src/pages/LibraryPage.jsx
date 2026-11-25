import { useMemo, useState } from 'react';
import { useToast } from '../components/Toast';
import { Icon } from '../components/icons';
import { PageHeader, LanguageChip, Select, IconButton, EmptyState, Skeleton } from '../components/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LANGUAGE_ORDER, languageOf } from '../lib/languages';
import { workspaceStats } from '../lib/store';
import {
  copyText,
  cx,
  formatDuration,
  formatRelative,
  plainText,
} from '../lib/format';

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'longest', label: 'Longest first' },
  { value: 'title', label: 'Title A–Z' },
];

export function LibraryPage({ sessions = [], loading, navigate, onDelete, confirmDelete = true }) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('all');
  const [sort, setSort] = useState('newest');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => workspaceStats(sessions), [sessions]);

  const counts = useMemo(() => {
    const base = { all: sessions.length };
    LANGUAGE_ORDER.forEach((key) => {
      base[key] = sessions.filter((session) => session.language === key).length;
    });
    return base;
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...sessions];

    if (language !== 'all') {
      list = list.filter((session) => session.language === language);
    }

    if (q) {
      list = list.filter((session) => {
        const haystack = `${session.title} ${(session.segments || [])
          .map((segment) => segment.text)
          .join(' ')}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    switch (sort) {
      case 'oldest':
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'longest':
        list.sort((a, b) => b.durationSec - a.durationSec);
        break;
      case 'title':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }, [sessions, query, language, sort]);

  async function handleCopy(session) {
    const ok = await copyText(plainText(session));
    toast.push(ok ? 'Transcript copied' : 'Could not access the clipboard', {
      tone: ok ? 'default' : 'error',
    });
  }

  async function removeSession(target) {
    if (!target) return;
    setBusy(true);
    try {
      await onDelete(target.id);
      toast.push('Session deleted');
      setDeleteTarget(null);
    } catch {
      toast.push('Could not delete this session', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  function requestDelete(target) {
    if (confirmDelete) setDeleteTarget(target);
    else removeSession(target);
  }

  const filters = [
    { value: 'all', label: 'All' },
    ...LANGUAGE_ORDER.map((key) => ({ value: key, label: languageOf(key).label })),
  ];

  const hasAny = sessions.length > 0;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Workspace · Archive"
        title="Library"
        description="Every recording, searchable and editable. Open a session to correct the transcript, export it, or delete it."
      >
        <button type="button" onClick={() => navigate('/transcribe')} className="btn btn-ink">
          <Icon name="mic" size={15} />
          New recording
        </button>
      </PageHeader>

      <div className="mt-8 grid grid-cols-2 gap-y-5 border-y border-line py-5 md:grid-cols-4 md:divide-x md:divide-line">
        {[
          { label: 'Sessions', value: stats.count, note: 'all time' },
          { label: 'Recorded', value: formatDuration(stats.seconds), note: 'total audio' },
          { label: 'Transcribed', value: stats.words.toLocaleString('en-IN'), note: 'words' },
          { label: 'This week', value: stats.weekCount, note: `${Math.round(stats.weekSeconds / 60)} min` },
        ].map((item, index) => (
          <div key={item.label} className={cx('px-0 md:px-5', index === 0 && 'md:pl-0')}>
            <p className="micro">{item.label}</p>
            <p className="mt-1.5 font-display text-[26px] leading-none tracking-[-0.01em] text-ink">
              {item.value}
            </p>
            <p className="mt-1 font-mono text-[10px] text-faint">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-[268px]">
          <Icon
            name="search"
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles and transcripts"
            aria-label="Search sessions"
            className="input pl-[2.15rem]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-faint hover:text-ink"
            >
              <Icon name="x" size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {filters.map((filter) => {
            const active = language === filter.value;
            const count = counts[filter.value] ?? 0;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setLanguage(filter.value)}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-[11.5px] transition-colors',
                  active
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line bg-canvas text-muted hover:border-lineStrong hover:text-ink',
                )}
              >
                {filter.label}
                <span
                  className={cx(
                    'font-mono text-[9.5px]',
                    active ? 'text-paper/45' : 'text-faint',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select
            value={sort}
            onChange={setSort}
            options={SORTS}
            ariaLabel="Sort sessions"
            className="w-[150px]"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl2 border border-line bg-canvas shadow-card">
        <div className="hidden items-center gap-4 border-b border-lineSoft bg-paper/40 px-4 py-2 md:flex">
          <span className="w-9" />
          <span className="flex-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-faint">
            Session
          </span>
          <span className="w-[70px] text-right text-[9.5px] font-semibold uppercase tracking-[0.14em] text-faint">
            Words
          </span>
          <span className="w-[62px] text-right text-[9.5px] font-semibold uppercase tracking-[0.14em] text-faint">
            Length
          </span>
          <span className="w-[84px] text-right text-[9.5px] font-semibold uppercase tracking-[0.14em] text-faint">
            Created
          </span>
          <span className="w-[84px]" />
        </div>

        {loading && (
          <div className="divide-y divide-lineSoft">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-4 px-4 py-4">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-[42%]" />
                  <Skeleton className="h-2.5 w-[68%]" />
                </div>
                <Skeleton className="hidden h-2.5 w-10 md:block" />
                <Skeleton className="hidden h-2.5 w-8 md:block" />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-5">
            <EmptyState
              icon={hasAny ? 'search' : 'mic'}
              title={hasAny ? 'No sessions match that' : 'Nothing recorded yet'}
              body={
                hasAny
                  ? 'Try a different word, or clear the language filter.'
                  : 'Start a recording and your first transcript will be filed here automatically.'
              }
            >
              {hasAny ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setQuery('');
                    setLanguage('all');
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <button type="button" className="btn btn-ink" onClick={() => navigate('/transcribe')}>
                  <Icon name="mic" size={15} />
                  Start recording
                </button>
              )}
            </EmptyState>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="divide-y divide-lineSoft">
            {filtered.map((session) => {
              const snippet = session.segments?.[0]?.text || 'No speech captured';
              return (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/session/${session.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/session/${session.id}`);
                    }
                  }}
                  className="row-hover group flex cursor-pointer items-center gap-4 px-4 py-3.5 focus-visible:bg-paper"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-paper text-muted transition-colors group-hover:border-lineStrong group-hover:text-graphite">
                    <Icon name="waveform" size={15} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13.5px] font-medium tracking-[-0.005em] text-ink">
                        {session.title}
                      </p>
                      <LanguageChip language={session.language} className="shrink-0" />
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-muted">{snippet}</p>
                  </div>

                  <div className="hidden w-[70px] shrink-0 text-right font-mono text-[11px] tabular text-muted md:block">
                    {session.words}
                  </div>
                  <div className="hidden w-[62px] shrink-0 text-right font-mono text-[11px] tabular text-muted md:block">
                    {formatDuration(session.durationSec)}
                  </div>
                  <div className="hidden w-[84px] shrink-0 text-right font-mono text-[10.5px] text-faint md:block">
                    {formatRelative(session.createdAt)}
                  </div>

                  <div className="flex w-[84px] shrink-0 items-center justify-end gap-0.5">
                    <span className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <IconButton
                        icon="copy"
                        label="Copy transcript"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCopy(session);
                        }}
                      />
                      <IconButton
                        icon="trash"
                        label="Delete session"
                        tone="danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          requestDelete(session);
                        }}
                      />
                    </span>
                    <Icon
                      name="chevronRight"
                      size={14}
                      className="text-faint transition-colors group-hover:text-muted"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="mt-3 text-right font-mono text-[10px] text-faint">
          {filtered.length} of {sessions.length} sessions
        </p>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this session?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” and its transcript will be removed permanently. This cannot be undone.`
            : ''
        }
        busy={busy}
        onConfirm={() => removeSession(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
