import { useEffect, useMemo, useRef, useState } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { useToast } from '../components/Toast';
import { Icon } from '../components/icons';
import { PageHeader, LanguageChip, Select, FieldLabel, StatusDot, IconButton } from '../components/ui';
import { Waveform, LevelTrack } from '../components/Waveform';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ASR_OPTIONS, detectFromSegments } from '../lib/languages';
import { transcribeAudio } from '../lib/store';
import {
  copyText,
  countWords,
  cx,
  formatClock,
  formatDate,
  formatDateTime,
  timecode,
} from '../lib/format';

const STATUS_LABEL = {
  idle: 'Standby',
  requesting: 'Requesting mic',
  recording: 'Listening',
  paused: 'Paused',
  transcribing: 'Finishing',
};

const STATUS_TONE = {
  idle: 'idle',
  requesting: 'paused',
  recording: 'live',
  paused: 'paused',
  transcribing: 'paused',
};

export function TranscribePage({ onSave, navigate, defaultLanguage, autoScrollDefault }) {
  const toast = useToast();
  const recorder = useRecorder({ initialLanguage: defaultLanguage });

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [autoScroll, setAutoScroll] = useState(autoScrollDefault);
  const [saving, setSaving] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [hideNotice, setHideNotice] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    setHideNotice(false);
  }, [recorder.notice]);

  const words = useMemo(() => countWords(recorder.segments), [recorder.segments]);

  const wpm = recorder.elapsed > 4 ? Math.round(words / (recorder.elapsed / 60)) : 0;

  const idlePattern = useMemo(
    () =>
      Array.from({ length: 56 }, (_, index) => {
        const center = 1 - Math.abs(index - 27.5) / 27.5;
        const wave = Math.abs(Math.sin(index * 0.55) * Math.cos(index * 0.17));
        return 0.08 + center * 0.17 + wave * 0.11;
      }),
    [],
  );

  const live = recorder.status === 'recording';
  const displayLevels = live || recorder.status === 'paused' ? recorder.levels : idlePattern;
  const peak = recorder.levels[recorder.levels.length - 1] || 0;
  const notice = recorder.notice && !hideNotice ? recorder.notice : null;

  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [recorder.segments, recorder.liveBusy, autoScroll]);

  function buildPlainText() {
    return recorder.segments
      .map((segment) => `[${timecode(segment.start)}] ${segment.speaker}: ${segment.text}`)
      .join('\n');
  }

  async function handleCopy() {
    const text = buildPlainText();
    if (!text) return;
    const ok = await copyText(text);
    toast.push(ok ? 'Transcript copied to clipboard' : 'Could not access the clipboard', {
      tone: ok ? 'default' : 'error',
    });
  }

  async function finishSave(segments, engine, draft) {
    if (!segments.length) {
      throw new Error('No speech was detected in this recording. Try speaking a little closer to the mic.');
    }

    const session = await onSave({
      title: title.trim() || `Recording · ${formatDateTime(new Date().toISOString())}`,
      language: detectFromSegments(segments, draft.language),
      segments,
      durationSec: draft.durationSec,
      notes: notes.trim(),
      engine: engine || 'Server transcription',
      sampleRate: draft.sampleRate,
      source: 'live',
    });
    toast.push('Transcription saved to your library');
    navigate(`/session/${session.id}`);
  }

  // Fallback path: transcribe the complete recording in one request. Used when
  // live chunks were unavailable or one of them failed.
  async function saveDraft(draft) {
    setSaving(true);
    setPendingDraft(null);
    try {
      if (!draft.audioBase64) {
        throw new Error('No audio was captured — check your microphone and try again.');
      }

      const result = await transcribeAudio({
        audioBase64: draft.audioBase64,
        mimeType: draft.mimeType,
        language: draft.language,
      });
      const segments = Array.isArray(result?.segments) ? result.segments : [];
      await finishSave(segments, result.engine || 'Server transcription', draft);
    } catch (error) {
      setPendingDraft(draft);
      setHideNotice(false);
      toast.push(error?.message || 'Could not transcribe this recording. Try again.', {
        tone: 'error',
      });
      setSaving(false);
    }
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setPendingDraft(null);

    let draft;
    try {
      draft = await recorder.stop();
    } catch (error) {
      toast.push(error?.message || 'Could not finish the recording.', { tone: 'error' });
      setSaving(false);
      return;
    }

    // The chunks captured while narrating are already a real transcript of the
    // recording, so save them directly. Only fall back to a full pass when a
    // live chunk failed or nothing was transcribed live.
    if (draft.liveSegments?.length && !draft.liveFailed) {
      try {
        await finishSave(draft.liveSegments, draft.liveEngine || 'Server transcription', draft);
      } catch (error) {
        setPendingDraft(draft);
        setHideNotice(false);
        toast.push(error?.message || 'Could not save this transcription. Try again.', {
          tone: 'error',
        });
        setSaving(false);
      }
      return;
    }

    if (!draft.audioBase64) {
      toast.push('No audio was captured — check your microphone and try again.', { tone: 'error' });
      setSaving(false);
      return;
    }

    await saveDraft(draft);
  }

  async function handleRetry() {
    if (!pendingDraft || saving) return;

    // If the live transcript itself succeeded, only the save failed — retry
    // that instead of transcribing the whole recording again.
    if (pendingDraft.liveSegments?.length && !pendingDraft.liveFailed) {
      setSaving(true);
      setPendingDraft(null);
      try {
        await finishSave(
          pendingDraft.liveSegments,
          pendingDraft.liveEngine || 'Server transcription',
          pendingDraft,
        );
      } catch (error) {
        setPendingDraft(pendingDraft);
        setHideNotice(false);
        toast.push(error?.message || 'Could not save this transcription. Try again.', {
          tone: 'error',
        });
        setSaving(false);
      }
      return;
    }

    await saveDraft(pendingDraft);
  }

  function handleStart() {
    setPendingDraft(null);
    setHideNotice(false);
    recorder.start();
  }

  function handleDiscard() {
    recorder.reset();
    setTitle('');
    setNotes('');
    setPendingDraft(null);
    setConfirmDiscard(false);
    toast.push('Draft discarded');
  }

  const status = recorder.status;
  const displayStatus = saving ? 'transcribing' : status;
  const pendingMessage =
    pendingDraft?.liveSegments?.length && !pendingDraft?.liveFailed
      ? 'Your transcript is ready, but it could not be saved. Try again.'
      : 'The recording was captured, but transcription failed. Your audio is still here — try again.';

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Workspace · Live capture"
        title="Live transcription"
        description="Speak in Hindi, English, or a mix of both. Your microphone audio is transcribed while you speak, then filed in your library."
      >
        <span className="hidden items-center gap-2 rounded-full border border-line bg-canvas px-2.5 py-1 text-[11px] text-muted sm:inline-flex">
          <StatusDot tone="ready" />
          Live transcription on
        </span>
      </PageHeader>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_312px]">
        <div className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-xl2 border border-black/40 bg-night text-onNight shadow-console">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-[5px] text-[9.5px] font-semibold uppercase tracking-[0.14em] text-onNight/70">
                  <StatusDot
                    tone={STATUS_TONE[displayStatus]}
                    pulse={displayStatus === 'recording' || displayStatus === 'transcribing'}
                  />
                  {STATUS_LABEL[displayStatus]}
                </span>
                <span className="hidden truncate font-mono text-[10px] uppercase tracking-[0.1em] text-onNight/40 sm:inline">
                  Microphone · real audio
                </span>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-onNight/35">
                {recorder.segments.length} seg
              </span>
            </div>

            <div className="px-6 pb-6 pt-7 sm:px-8">
              <div className="flex flex-col items-center">
                <p className="tabular font-mono text-[52px] leading-none tracking-[-0.03em] text-onNight sm:text-[62px]">
                  {formatClock(recorder.elapsed)}
                </p>

                <div className="mt-6 h-16 w-full max-w-[520px]">
                  <Waveform levels={displayLevels} live={live} />
                </div>

                <div className="mt-4 flex w-full max-w-[520px] items-center gap-3">
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-onNight/35">
                    in
                  </span>
                  <LevelTrack level={live || recorder.status === 'paused' ? peak : 0} />
                  <span className="shrink-0 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.16em] text-onNight/35">
                    −12 dB
                  </span>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
                {status === 'idle' && !saving && (
                  <button
                    type="button"
                    onClick={handleStart}
                    className="btn btn-light px-4 py-2.5 text-[13.5px]"
                  >
                    <Icon name="mic" size={16} />
                    Start recording
                  </button>
                )}

                {status === 'requesting' && (
                  <>
                    <span className="py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-onNight/45">
                      Waiting for microphone…
                    </span>
                    <button
                      type="button"
                      onClick={recorder.reset}
                      className="btn text-onNight/40 hover:bg-white/[0.06] hover:text-onNight/80"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {status === 'recording' && (
                  <>
                    <button
                      type="button"
                      onClick={recorder.pause}
                      className="btn border border-white/[0.12] bg-white/[0.06] text-onNight hover:bg-white/[0.1]"
                    >
                      <Icon name="pause" size={14} />
                      Pause
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="btn btn-light px-4"
                    >
                      <Icon name="stop" size={13} />
                      {saving ? 'Saving…' : 'Stop & save'}
                    </button>
                  </>
                )}

                {status === 'paused' && (
                  <>
                    <button type="button" onClick={recorder.resume} className="btn btn-light">
                      <Icon name="play" size={13} />
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="btn border border-white/[0.12] bg-white/[0.06] text-onNight hover:bg-white/[0.1]"
                    >
                      <Icon name="stop" size={13} />
                      {saving ? 'Saving…' : 'Stop & save'}
                    </button>
                  </>
                )}

                {recorder.hasContent && status !== 'recording' && !saving && (
                  <button
                    type="button"
                    onClick={() => setConfirmDiscard(true)}
                    className="btn text-onNight/40 hover:bg-white/[0.06] hover:text-onNight/80"
                  >
                    Discard
                  </button>
                )}
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/[0.07] pt-4 font-mono text-[10px] text-onNight/40">
                <span>{words} words</span>
                <span>{recorder.segments.length} {recorder.segments.length === 1 ? 'segment' : 'segments'}</span>
                <span>{wpm} wpm</span>
                <span className="max-w-[220px] truncate">
                  {recorder.micLabel ? `mic · ${recorder.micLabel}` : 'system default input'}
                </span>
              </div>
            </div>
          </section>

          {saving && (
            <div className="flex items-center gap-2.5 rounded-lg border border-line bg-canvas px-3.5 py-2.5">
              <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-lineStrong border-t-ink" />
              <p className="flex-1 text-[12px] leading-relaxed text-graphite">
                Finishing your session and filing the transcript…
              </p>
            </div>
          )}

          {!hideNotice && (notice || pendingDraft) && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amberLine bg-amberSoft px-3.5 py-2.5">
              <Icon name="alert" size={15} className="mt-[1px] shrink-0 text-amber" />
              <p className="flex-1 text-[12px] leading-relaxed text-amber">
                {notice || pendingMessage}
              </p>
              {pendingDraft && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={saving}
                  className="shrink-0 rounded-md border border-amber/30 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-amber transition-colors hover:bg-amber/10 disabled:opacity-50"
                >
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={() => setHideNotice(true)}
                aria-label="Dismiss"
                className="shrink-0 rounded p-0.5 text-amber/60 hover:text-amber"
              >
                <Icon name="x" size={13} />
              </button>
            </div>
          )}

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-lineSoft px-5 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[12.5px] font-semibold tracking-[-0.005em] text-ink">Transcript</h2>
                {live && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-liveSoft px-1.5 py-[2px] text-[9px] font-semibold uppercase tracking-[0.12em] text-live">
                    <span className="h-1 w-1 rounded-full bg-live" />
                    live
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAutoScroll((value) => !value)}
                  className={cx(
                    'mr-1 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors',
                    autoScroll ? 'text-graphite hover:bg-black/5' : 'text-faint hover:bg-black/5',
                  )}
                >
                  auto-scroll {autoScroll ? 'on' : 'off'}
                </button>
                <IconButton
                  icon="copy"
                  label="Copy transcript"
                  onClick={handleCopy}
                  disabled={!recorder.hasContent}
                />
                <IconButton
                  icon="trash"
                  label="Clear draft"
                  tone="danger"
                  onClick={() => setConfirmDiscard(true)}
                  disabled={!recorder.hasContent}
                />
              </div>
            </div>

            <div ref={scrollRef} className="max-h-[430px] min-h-[236px] overflow-y-auto px-5 py-5">
              {recorder.segments.length === 0 && recorder.liveBusy === 0 ? (
                <div className="flex h-[196px] flex-col items-center justify-center rounded-lg border border-dashed border-lineStrong bg-paper/40 px-6 text-center">
                  <Icon name="waveform" size={20} className="text-faint" />
                  <p className="mt-3 font-display text-[20px] leading-tight text-ink">
                    {saving
                      ? 'Finishing your session…'
                      : live
                        ? 'Listening — speak naturally'
                        : 'Your words will appear here'}
                  </p>
                  <p className="mt-1 max-w-[38ch] text-[12px] leading-relaxed text-muted">
                    {saving
                      ? 'The saved text comes from your actual recording, not a script.'
                      : live
                        ? 'Each phrase is transcribed from your microphone while you talk. Pause briefly and the words will appear.'
                        : 'Start recording and the transcript will fill in as you narrate — no waiting until the end.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {recorder.segments.map((segment) => (
                    <div key={segment.id} className="grid grid-cols-[42px_minmax(0,1fr)] gap-3">
                      <span className="pt-[4px] font-mono text-[10px] leading-none text-faint">
                        {timecode(segment.start)}
                      </span>
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                            {segment.speaker}
                          </span>
                        </div>
                        <p className="text-[14px] leading-[1.62] text-ink">{segment.text}</p>
                      </div>
                    </div>
                  ))}

                  {live && recorder.liveBusy > 0 && (
                    <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-3">
                      <span className="pt-[4px] font-mono text-[10px] leading-none text-faint">
                        {timecode(recorder.elapsed)}
                      </span>
                      <p className="flex items-center gap-2 text-[13px] leading-[1.62] text-muted">
                        <span className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-lineStrong border-t-ink" />
                        Transcribing what you just said…
                        <span className="inline-block h-[13px] w-[2px] animate-caret bg-live" />
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="card p-5">
            <p className="micro">Session</p>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Untitled session"
              aria-label="Session title"
              className="mt-2.5 w-full border-0 bg-transparent p-0 font-display text-[21px] leading-tight tracking-[-0.01em] text-ink outline-none placeholder:text-faint focus:outline-none"
            />

            <div className="mt-4 space-y-3.5">
              <div>
                <FieldLabel hint="recognition locale">Language</FieldLabel>
                <Select
                  value={recorder.language}
                  onChange={recorder.setLanguage}
                  ariaLabel="Recognition language"
                  options={ASR_OPTIONS.map((option) => ({
                    value: option.id,
                    label: option.label,
                  }))}
                />
                <p className="mt-1.5 text-[11px] leading-snug text-faint">
                  Hindi and English are recognised in one pass — code-mixing is expected.
                </p>
              </div>

              <div>
                <FieldLabel hint="optional">Notes</FieldLabel>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Decisions, follow-ups, names…"
                  className="input resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-lineSoft pt-3">
              <span className="font-mono text-[10px] text-muted">
                {formatDate(new Date().toISOString())}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
                <Icon name="clock" size={11} />
                {formatClock(recorder.elapsed)}
              </span>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <p className="micro">Engine</p>
              <span className="rounded-full border border-accentLine bg-accentSoft px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-[0.1em] text-accent">
                active
              </span>
            </div>
            <div className="mt-3 flex items-start gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-paper text-graphite">
                <Icon name="bolt" size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">
                  {recorder.liveEngine || 'Server speech-to-text'}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted">
                  Your microphone audio is transcribed in short phrases while you speak, so the
                  transcript builds up live. Every word comes from that recording — never a script.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-dashed border-line bg-paper/50 p-3">
              <div className="flex items-center gap-2">
                <Icon name="spark" size={12} className="text-faint" />
                <p className="text-[11.5px] font-medium text-graphite">Live transcription</p>
                <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
                  {recorder.liveFailed ? 'retrying on stop' : recorder.liveBusy > 0 ? 'writing' : 'ready'}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted">
                Audio is cut at natural pauses and sent to the engine as you narrate. If a phrase
                fails, the full recording is transcribed when you stop.
              </p>
            </div>
          </section>

          <section className="rounded-xl2 border border-line bg-paper/60 p-5">
            <p className="micro">Before you start</p>
            <ol className="mt-3 space-y-2.5">
              {[
                'Allow microphone access when the browser asks.',
                'Speak at a normal pace — short pauses let the text keep up.',
                'Stop & save to file the session in your library.',
              ].map((tip, index) => (
                <li key={tip} className="flex gap-2.5 text-[12px] leading-snug text-graphite/85">
                  <span className="mt-[1px] font-mono text-[10px] text-faint">0{index + 1}</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
              The transcript is already being written while you speak, so there is no long wait when
              you stop.
            </p>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this draft?"
        description="Everything captured in this session will be thrown away. Saved transcriptions are untouched."
        confirmLabel="Discard draft"
        onConfirm={handleDiscard}
        onClose={() => setConfirmDiscard(false)}
      />
    </div>
  );
}
