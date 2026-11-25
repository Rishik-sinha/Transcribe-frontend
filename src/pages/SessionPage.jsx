import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../components/Toast';
import { Icon } from '../components/icons';
import { LanguageChip, Select, FieldLabel, Skeleton } from '../components/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useNarration } from '../hooks/useNarration';
import { LANGUAGES, languageOf } from '../lib/languages';
import {
  copyText,
  cx,
  downloadFile,
  formatDateTime,
  formatDuration,
  plainText,
  slugify,
  timecode,
  toMarkdown,
  toSrt,
} from '../lib/format';

const EXPORTS = [
  { id: 'txt', label: 'Plain text', hint: '.txt' },
  { id: 'srt', label: 'Subtitles', hint: '.srt' },
  { id: 'md', label: 'Markdown', hint: '.md' },
];

function DetailRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-lineSoft py-2.5 last:border-0">
      <span className="text-[11.5px] text-muted">{label}</span>
      <span className="text-right font-mono text-[11px] text-graphite">{children}</span>
    </div>
  );
}

export function SessionPage({
  session,
  loading,
  navigate,
  onUpdate,
  onDelete,
  narrationRate = 1,
  confirmDelete = true,
}) {
  const toast = useToast();
  const segments = session?.segments || [];

  const narration = useNarration(segments, session?.language || 'mixed');

  const [titleDraft, setTitleDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitleDraft(session?.title || '');
    setNotesDraft(session?.notes || '');
    setEditingId(null);
    setExportOpen(false);
  }, [session?.id]);

  useEffect(() => {
    if (session?.title) document.title = `${session.title} · Shabd`;
  }, [session?.title]);

  const progress = useMemo(() => {
    if (!narration.speaking || narration.active === null || segments.length === 0) return 0;
    return (narration.active + 1) / segments.length;
  }, [narration.speaking, narration.active, segments.length]);

  const previewBars = useMemo(
    () =>
      Array.from({ length: 96 }, (_, index) => {
        const v =
          Math.abs(
            Math.sin(index * 0.7) * 0.45 +
              Math.sin(index * 0.23 + 1.7) * 0.35 +
              Math.sin(index * 1.9) * 0.2,
          ) * 0.62;
        return 0.18 + v;
      }),
    [],
  );

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-6 h-9 w-[62%]" />
        <Skeleton className="mt-4 h-3 w-40" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="card space-y-5 p-6">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="space-y-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-[82%]" />
              </div>
            ))}
          </div>
          <div className="card h-56 p-6">
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="animate-fade-up">
        <button
          type="button"
          onClick={() => navigate('/library')}
          className="inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
        >
          <Icon name="chevronLeft" size={13} />
          Library
        </button>
        <div className="mt-10 flex flex-col items-center rounded-xl2 border border-dashed border-line bg-paper/40 px-8 py-20 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-line bg-canvas text-muted">
            <Icon name="fileText" size={18} />
          </span>
          <p className="mt-4 font-display text-[24px] leading-tight text-ink">Session not found</p>
          <p className="mt-1.5 max-w-[40ch] text-[13px] text-muted">
            It may have been deleted, or the link is from another browser.
          </p>
          <button type="button" className="btn btn-ink mt-5" onClick={() => navigate('/library')}>
            Back to library
          </button>
        </div>
      </div>
    );
  }

  async function commitTitle() {
    const next = titleDraft.trim();
    if (!next) {
      setTitleDraft(session.title);
      return;
    }
    if (next === session.title) return;
    try {
      await onUpdate(session.id, { title: next });
      toast.push('Title updated');
    } catch {
      toast.push('Could not update the title', { tone: 'error' });
    }
  }

  async function commitNotes() {
    if (notesDraft === (session.notes || '')) return;
    try {
      await onUpdate(session.id, { notes: notesDraft });
    } catch {
      toast.push('Could not save notes', { tone: 'error' });
    }
  }

  async function changeLanguage(next) {
    try {
      await onUpdate(session.id, { language: next });
      toast.push('Language updated');
    } catch {
      toast.push('Could not update the language', { tone: 'error' });
    }
  }

  function beginEdit(segment) {
    setEditingId(segment.id);
    setDraftText(segment.text);
  }

  async function commitSegment() {
    const text = draftText.trim();
    if (!text) {
      toast.push('A segment cannot be empty', { tone: 'error' });
      return;
    }
    const nextSegments = segments.map((segment) =>
      segment.id === editingId ? { ...segment, text } : segment,
    );
    setEditingId(null);
    try {
      await onUpdate(session.id, { segments: nextSegments });
      toast.push('Transcript updated');
    } catch {
      toast.push('Could not save that edit', { tone: 'error' });
    }
  }

  async function handleCopy() {
    const ok = await copyText(plainText(session));
    toast.push(ok ? 'Transcript copied' : 'Could not access the clipboard', {
      tone: ok ? 'default' : 'error',
    });
  }

  function handleExport(kind) {
    const base = slugify(session.title);
    if (kind === 'srt') {
      downloadFile(`${base}.srt`, toSrt(session), 'text/plain;charset=utf-8');
    } else if (kind === 'md') {
      downloadFile(`${base}.md`, toMarkdown(session), 'text/markdown;charset=utf-8');
    } else {
      downloadFile(`${base}.txt`, plainText(session));
    }
    setExportOpen(false);
    toast.push(`Exported as .${kind}`);
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(session.id);
      toast.push('Session deleted');
      navigate('/library');
    } catch {
      toast.push('Could not delete this session', { tone: 'error' });
      setBusy(false);
    }
  }

  function requestDelete() {
    if (confirmDelete) setDeleteOpen(true);
    else handleDelete();
  }

  function toggleNarration() {
    if (narration.speaking) {
      narration.stop();
      return;
    }
    const started = narration.play(narrationRate);
    if (!started) toast.push('This browser cannot read aloud', { tone: 'error' });
  }

  return (
    <div className="animate-fade-up">
      <button
        type="button"
        onClick={() => navigate('/library')}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
      >
        <Icon name="chevronLeft" size={13} />
        Library
      </button>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <LanguageChip language={session.language} />
            <span className="font-mono text-[10.5px] text-faint">
              {formatDateTime(session.createdAt)}
            </span>
            <span className="h-[3px] w-[3px] rounded-full bg-lineStrong" />
            <span className="font-mono text-[10.5px] text-faint">
              {formatDuration(session.durationSec)}
            </span>
            <span className="h-[3px] w-[3px] rounded-full bg-lineStrong" />
            <span className="font-mono text-[10.5px] text-faint">{session.words} words</span>
          </div>

          <input
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
              if (event.key === 'Escape') {
                setTitleDraft(session.title);
                event.currentTarget.blur();
              }
            }}
            aria-label="Session title"
            className="mt-3 w-full max-w-[780px] rounded-sm border-0 bg-transparent p-0 font-display text-[32px] leading-[1.08] tracking-[-0.012em] text-ink outline-none transition-colors focus:bg-paper/60 focus:px-1 md:text-[38px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleNarration}
            disabled={!narration.supported || segments.length === 0}
            className={cx('btn', narration.speaking ? 'btn-ink' : 'btn-outline')}
          >
            <Icon name={narration.speaking ? 'stop' : 'volume'} size={14} />
            {narration.speaking ? 'Stop' : 'Listen'}
          </button>

          <button type="button" onClick={handleCopy} className="btn btn-outline">
            <Icon name="copy" size={14} />
            Copy
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((value) => !value)}
              className="btn btn-outline"
              aria-expanded={exportOpen}
            >
              <Icon name="download" size={14} />
              Export
              <Icon name="chevronDown" size={12} className="text-muted" />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-[calc(100%+6px)] z-40 w-[196px] animate-fade-up overflow-hidden rounded-lg border border-line bg-canvas p-1 shadow-lift">
                  {EXPORTS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleExport(option.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12.5px] text-graphite transition-colors hover:bg-paper"
                    >
                      <Icon name="fileText" size={14} className="text-muted" />
                      <span className="flex-1">{option.label}</span>
                      <span className="font-mono text-[10px] text-faint">{option.hint}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={requestDelete}
            className="btn btn-ghost hover:bg-dangerSoft hover:text-danger"
            aria-label="Delete session"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-lineSoft px-5 py-3">
            <button
              type="button"
              onClick={toggleNarration}
              disabled={!narration.supported || segments.length === 0}
              className={cx(
                'grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors',
                narration.speaking
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line bg-paper text-graphite hover:border-lineStrong',
              )}
              aria-label={narration.speaking ? 'Stop reading' : 'Read transcript aloud'}
            >
              <Icon name={narration.speaking ? 'pause' : 'play'} size={12} />
            </button>

            <div className="flex h-7 flex-1 items-center justify-between gap-[2px]" aria-hidden="true">
              {previewBars.map((value, index) => {
                const passed = index / previewBars.length <= progress;
                return (
                  <span
                    key={index}
                    style={{ height: `${Math.round(value * 100)}%` }}
                    className={cx(
                      'w-[2px] shrink-0 rounded-full transition-colors duration-300',
                      narration.speaking && passed ? 'bg-accent/70' : 'bg-lineStrong',
                    )}
                  />
                );
              })}
            </div>

            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
              {narration.speaking ? `segment ${(narration.active ?? 0) + 1}` : 'read aloud'}
            </span>
          </div>

          <div className="divide-y divide-lineSoft">
            {segments.map((segment, index) => {
              const active = narration.speaking && narration.active === index;
              const editing = editingId === segment.id;
              return (
                <div
                  key={segment.id}
                  className={cx(
                    'group grid grid-cols-[44px_minmax(0,1fr)] gap-3 px-5 py-4 transition-colors',
                    active && 'bg-accentSoft',
                  )}
                >
                  <div className="pt-[3px]">
                    <span className="font-mono text-[10px] leading-none text-faint">
                      {timecode(segment.start)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                        {segment.speaker}
                      </span>
                      <span className="font-mono text-[9.5px] text-faint opacity-0 transition-opacity group-hover:opacity-100">
                        {formatDuration(segment.end - segment.start)}
                      </span>
                      {!editing && (
                        <button
                          type="button"
                          onClick={() => beginEdit(segment)}
                          className="ml-auto rounded p-1 text-faint opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
                          aria-label="Edit segment"
                        >
                          <Icon name="pencil" size={13} />
                        </button>
                      )}
                    </div>

                    {editing ? (
                      <div>
                        <textarea
                          autoFocus
                          value={draftText}
                          onChange={(event) => setDraftText(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              event.preventDefault();
                              setEditingId(null);
                            }
                            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                              event.preventDefault();
                              commitSegment();
                            }
                          }}
                          ref={(node) => {
                            if (!node) return;
                            node.style.height = 'auto';
                            node.style.height = `${node.scrollHeight}px`;
                          }}
                          rows={2}
                          className="w-full resize-none rounded-md border border-lineStrong bg-paper/50 px-2.5 py-2 text-[14px] leading-[1.6] text-ink outline-none focus:border-muted focus:bg-white"
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" className="btn btn-ink btn-sm" onClick={commitSegment}>
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                          <span className="ml-auto font-mono text-[9.5px] text-faint">
                            ⌘↵ to save · esc to cancel
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p
                        onClick={() => beginEdit(segment)}
                        className="cursor-text text-[14px] leading-[1.62] text-ink"
                        title="Click to edit"
                      >
                        {segment.text}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {segments.length === 0 && (
              <div className="px-5 py-14 text-center">
                <p className="font-display text-[20px] text-ink">This session is empty</p>
                <p className="mt-1 text-[12.5px] text-muted">No speech was captured in the recording.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="card p-5">
            <p className="micro">Details</p>

            <div className="mt-3">
              <FieldLabel>Language</FieldLabel>
              <Select
                value={session.language}
                onChange={changeLanguage}
                ariaLabel="Session language"
                options={Object.values(LANGUAGES).map((item) => ({
                  value: item.id,
                  label: `${item.label} · ${item.detail}`,
                }))}
              />
            </div>

            <div className="mt-4">
              <DetailRow label="Created">{formatDateTime(session.createdAt)}</DetailRow>
              <DetailRow label="Duration">{formatDuration(session.durationSec)}</DetailRow>
              <DetailRow label="Words">{session.words}</DetailRow>
              <DetailRow label="Segments">{segments.length}</DetailRow>
              <DetailRow label="Engine">{session.engine || 'Server transcription'}</DetailRow>
              <DetailRow label="Sample rate">{session.sampleRate || 48000} Hz</DetailRow>
            </div>

            {session.summary && (
              <div className="mt-4 rounded-md border border-line bg-paper/60 p-3">
                <div className="flex items-center gap-1.5">
                  <Icon name="spark" size={11} className="text-faint" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Summary
                  </span>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-graphite/85">
                  {session.summary}
                </p>
              </div>
            )}
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <p className="micro">Notes</p>
              <span className="font-mono text-[9.5px] text-faint">saves on blur</span>
            </div>
            <textarea
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              onBlur={commitNotes}
              rows={5}
              placeholder="Add context, decisions, follow-ups…"
              className="mt-3 w-full resize-none rounded-md border border-line bg-paper/40 px-2.5 py-2 text-[12.5px] leading-relaxed text-graphite outline-none focus:border-lineStrong focus:bg-white"
            />
          </section>

          <section className="rounded-xl2 border border-line bg-paper/60 p-5">
            <p className="micro">Export</p>
            <div className="mt-3 space-y-1.5">
              {EXPORTS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleExport(option.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-graphite transition-colors hover:bg-canvas"
                >
                  <Icon name="download" size={13} className="text-muted" />
                  <span className="flex-1">{option.label}</span>
                  <span className="font-mono text-[10px] text-faint">{option.hint}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <button
                type="button"
                onClick={requestDelete}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-danger transition-colors hover:bg-dangerSoft"
              >
                <Icon name="trash" size={13} />
                Delete session
              </button>
            </div>
          </section>

          <p className="px-1 font-mono text-[10px] leading-relaxed text-faint">
            {languageOf(session.language).label} · {formatDuration(session.durationSec)} of audio
            transcribed on {formatDateTime(session.createdAt)}
          </p>
        </aside>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this session?"
        description={`“${session.title}” and its transcript will be removed permanently. This cannot be undone.`}
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
