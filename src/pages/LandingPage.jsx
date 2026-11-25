import { useState } from 'react';
import { BrandMark, Icon } from '../components/icons';
import { LiveDemo } from '../components/LiveDemo';
import { LanguageChip, StatusDot } from '../components/ui';
import { cx } from '../lib/format';

const NAV_LINKS = [
  { id: 'demo', label: 'Product' },
  { id: 'how', label: 'How it works' },
  { id: 'concept', label: 'Languages' },
  { id: 'faq', label: 'FAQ' },
];

const MARQUEE = [
  'हिन्दी',
  'English',
  'Hinglish',
  'code-mixing',
  'per-sentence timestamps',
  'read aloud',
  'SRT',
  'Markdown',
  'search across transcripts',
  'on-device',
  'editable lines',
];

const CHAPTERS = [
  {
    id: 'capture',
    kicker: '01 · Capture',
    title: 'Speak normally',
    body: 'Press start and keep talking. Sentences land with a timecode while the waveform tracks your level.',
    frame: 'capture',
  },
  {
    id: 'library',
    kicker: '02 · Library',
    title: 'Everything filed',
    body: 'Each recording is saved with its language, duration and word count — searchable the moment it ends.',
    frame: 'library',
  },
  {
    id: 'listen',
    kicker: '03 · Read aloud',
    title: 'Hear it back',
    body: 'Play a segment through a voice to proofread faster, or to check a name you are not sure about.',
    frame: 'listen',
  },
  {
    id: 'export',
    kicker: '04 · Export',
    title: 'Take it anywhere',
    body: 'Plain text for notes, SRT for subtitles, Markdown for docs. Or export the whole workspace as JSON.',
    frame: 'export',
  },
];

const FEATURES = [
  {
    icon: 'globe',
    title: 'Code-mixed by default',
    body: 'No language picker gymnastics. Hindi, English and Hinglish are all first-class input.',
  },
  {
    icon: 'clock',
    title: 'Sentence timestamps',
    body: 'Every line carries a timecode, so a transcript works like an index into the recording.',
  },
  {
    icon: 'pencil',
    title: 'Edit anything',
    body: 'Fix a name, split a sentence, add notes after the fact. Nothing is frozen once saved.',
  },
  {
    icon: 'headphones',
    title: 'Read aloud',
    body: 'Send a segment back through a voice while you proofread, at whatever speed suits you.',
  },
  {
    icon: 'download',
    title: 'Portable exports',
    body: '.txt, .srt and .md per session, plus a full JSON export of the workspace.',
  },
  {
    icon: 'shield',
    title: 'Account-backed',
    body: 'Recordings are transcribed by the configured engine; the resulting transcript is saved to your account, not to a demo workspace.',
  },
];

const FAQS = [
  {
    q: 'Does it really handle Hindi and English in the same sentence?',
    a: 'Yes. The engine is asked to preserve code-mixing, and you can force हिन्दी, Indian English or US English from the session panel if it drifts. The transcript is produced from your actual recording, phrase by phrase, while you speak.',
  },
  {
    q: 'Where does my audio go?',
    a: 'Your microphone audio is sent to the configured speech-to-text provider and transcribed, then the transcript is saved to your account. No demo or generated text is ever substituted for your recording.',
  },
  {
    q: 'Which browsers work?',
    a: 'Any modern Chromium, Firefox or Safari build can record and transcribe live. Audio is chunked through the Web Audio API, with a fallback path for browsers without AudioWorklet.',
  },
  {
    q: 'Can I try it without an account?',
    a: 'No — every session is tied to a real account so your recordings and transcripts stay private to you. Create an account in a few seconds and start recording.',
  },
];

function scrollTo(id) {
  const element = document.getElementById(id);
  if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function Wordmark({ dark = false }) {
  return (
    <span className="flex items-center gap-2.5 text-left">
      <BrandMark size={30} />
      <span className="text-left leading-none">
        <span
          className={cx(
            'block font-display text-[22px] leading-none tracking-[-0.01em]',
            dark ? 'text-onNight' : 'text-ink',
          )}
        >
          Shabd
        </span>
        <span
          className={cx(
            'mt-[5px] block text-[8px] uppercase leading-none tracking-[0.2em]',
            dark ? 'text-onNight/40' : 'text-faint',
          )}
        >
          Speech workspace
        </span>
      </span>
    </span>
  );
}

function TopBar({ user, navigate }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper">
      <div className="mx-auto flex h-[66px] max-w-[1180px] items-center gap-8 px-5 md:px-8">
        <button
          type="button"
          onClick={() => {
            navigate('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Shabd home"
          className="shrink-0 rounded-md text-left"
        >
          <Wordmark />
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollTo(link.id)}
              className="rounded-md px-3 py-1.5 text-[12.5px] text-muted transition-colors hover:bg-black/[0.04] hover:text-ink"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <button
              type="button"
              onClick={() => navigate('/transcribe')}
              className="btn btn-ink px-4"
            >
              Open workspace
              <Icon name="arrowRight" size={14} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn btn-ghost hidden px-3 sm:inline-flex"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="btn btn-ink px-4"
              >
                Start free
                <Icon name="arrowRight" size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero({ user, navigate }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px] hairline-grid opacity-70"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-[1180px] gap-12 px-5 pb-16 pt-14 md:px-8 md:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14 lg:pb-24">
        <div className="animate-rise-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-[11px] text-graphite">
            <StatusDot tone="live" pulse />
            Live in Hindi, English and Hinglish
          </span>

          <h1 className="mt-6 font-display text-[clamp(2.65rem,6.2vw,4.45rem)] leading-[0.97] tracking-[-0.022em] text-ink">
            Speak in Hinglish.
            <br />
            <span className="italic text-graphite">Read it back as text.</span>
          </h1>

          <p className="mt-6 max-w-[46ch] text-[14.5px] leading-[1.7] text-muted">
            Shabd turns live speech into a clean, timestamped transcript — Hindi, English, or the
            two tangled together. No mode switching, and no retyping the call afterwards.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(user ? '/transcribe' : '/signup')}
              className="btn btn-ink px-5 py-2.5 text-[13.5px]"
            >
              {user ? 'Open workspace' : 'Start transcribing'}
              <Icon name="arrowRight" size={15} />
            </button>
            <button
              type="button"
              onClick={() => scrollTo('demo')}
              className="btn btn-outline px-4 py-2.5 text-[13.5px]"
            >
              <Icon name="play" size={11} />
              See the product
            </button>
          </div>

          <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-faint">
            {['No card needed', 'Audio stays on device', 'Chrome · Edge · Android'].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Icon name="check" size={12} className="text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative animate-rise-in [animation-delay:120ms]">
          <LiveDemo />

          <div className="absolute -bottom-5 -left-3 hidden items-center gap-2.5 rounded-lg border border-line bg-canvas px-3 py-2 shadow-lift sm:flex lg:-left-6">
            <span className="grid h-6 w-6 place-items-center rounded-full border border-accentLine bg-accentSoft text-accent">
              <Icon name="check" size={12} />
            </span>
            <span>
              <span className="block text-[11.5px] font-medium leading-tight text-ink">
                Saved to library
              </span>
              <span className="mt-0.5 block font-mono text-[9px] uppercase leading-none tracking-[0.06em] text-faint">
                4 segments · 01:06
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div className="border-y border-line bg-canvas/60">
      <div className="marquee-mask overflow-hidden py-3.5">
        <div className="flex w-max animate-marquee items-center">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="flex items-center gap-6 whitespace-nowrap px-6 font-mono text-[10px] uppercase tracking-[0.16em] text-faint"
            >
              {item}
              <span className="h-[3px] w-[3px] rounded-full bg-lineStrong" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- tour frames ---------- */

function Window({ children, path = 'transcribe' }) {
  return (
    <div className="overflow-hidden rounded-xl2 border border-line bg-canvas shadow-lift">
      <div className="flex items-center gap-2 border-b border-lineSoft bg-paper px-3.5 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-[7px] w-[7px] rounded-full border border-lineStrong bg-paperDeep" />
          <span className="h-[7px] w-[7px] rounded-full border border-lineStrong bg-paperDeep" />
          <span className="h-[7px] w-[7px] rounded-full border border-lineStrong bg-paperDeep" />
        </span>
        <span className="mx-auto flex max-w-[240px] items-center gap-1.5 truncate rounded-md border border-line bg-canvas px-2.5 py-[3px] font-mono text-[9px] text-faint">
          <Icon name="lock" size={9} />
          shabd.app/{path}
        </span>
        <span className="w-[38px]" aria-hidden="true" />
      </div>
      <div className="flex min-h-[300px] flex-col justify-center p-3.5 md:p-5">{children}</div>
    </div>
  );
}

function CaptureFrame() {
  return <LiveDemo compact />;
}

const LIBRARY_ROWS = [
  { title: 'Sprint planning — onboarding revamp', language: 'mixed', meta: '1:41 · 2h ago' },
  { title: 'Client call — Zepto, week 3', language: 'mixed', meta: '1:58 · Yesterday' },
  { title: 'Interview — Priya, design intern', language: 'en', meta: '1:48 · 4 days ago' },
  { title: 'Podcast clip — voice as an interface', language: 'en', meta: '1:22 · 6 days ago' },
];

function LibraryFrame() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex h-8 w-full max-w-[230px] items-center gap-2 rounded-lg border border-line bg-paper px-2.5 text-[11.5px] text-faint">
          <Icon name="search" size={13} />
          Search titles and transcripts
        </span>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
          6 recordings · 12 min
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-line">
        {LIBRARY_ROWS.map((row, index) => (
          <div
            key={row.title}
            className={cx(
              'flex items-center gap-3 px-3 py-2.5',
              index > 0 && 'border-t border-lineSoft',
              index === 0 && 'bg-paper/60',
            )}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded border border-line bg-canvas text-muted">
              <Icon name="waveform" size={12} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11.5px] font-medium text-ink">{row.title}</span>
              <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.06em] text-faint">
                {row.meta}
              </span>
            </span>
            <LanguageChip language={row.language} className="hidden shrink-0 sm:inline-flex" />
            <Icon name="chevronRight" size={13} className="shrink-0 text-faint" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ListenFrame() {
  return (
    <div className="rounded-lg border border-line bg-paper/50 p-3.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-paper">
            <Icon name="play" size={10} />
          </span>
          <span className="text-[11px] font-medium text-ink">Reading segment 3 of 6</span>
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">1× speed</span>
      </div>

      <div className="mt-3 flex h-8 items-center justify-between gap-[2px]" aria-hidden="true">
        {Array.from({ length: 64 }, (_, index) => {
          const value = 0.2 + Math.abs(Math.sin(index * 0.7) * 0.45 + Math.sin(index * 0.22) * 0.3);
          const passed = index < 26;
          return (
            <span
              key={index}
              style={{ height: `${Math.round(Math.min(1, value) * 100)}%` }}
              className={cx('w-[2px] shrink-0 rounded-full', passed ? 'bg-accent/70' : 'bg-lineStrong')}
            />
          );
        })}
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-graphite">
        <span className="mr-2 font-mono text-[9px] uppercase tracking-[0.06em] text-faint">00:34</span>
        Mera suggestion ye hai ki hum progressive disclosure try karein — pehle sirf email, then the
        rest later.
      </p>

      <div className="mt-3 flex items-center gap-2.5 border-t border-line/80 pt-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-faint">00:41</span>
        <span className="min-w-0 truncate text-[11.5px] leading-relaxed text-faint">
          Haan, aur onboarding screen pe ek short note bhi daal dete hain.
        </span>
      </div>
    </div>
  );
}

const EXPORT_FILES = [
  { ext: 'TXT', name: 'sprint-planning.txt', detail: 'Plain text · 1.4 KB', icon: 'fileText' },
  { ext: 'SRT', name: 'sprint-planning.srt', detail: 'Subtitles · 2.1 KB', icon: 'fileText' },
  { ext: 'MD', name: 'sprint-planning.md', detail: 'Markdown · 1.7 KB', icon: 'fileText' },
];

function ExportFrame() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-medium text-ink">Export session</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
          3 formats
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {EXPORT_FILES.map((file) => (
          <div
            key={file.ext}
            className="flex items-center gap-3 rounded-lg border border-line bg-paper/50 px-3 py-2.5"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded border border-line bg-canvas text-graphite">
              <Icon name={file.icon} size={13} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11.5px] text-ink">{file.name}</span>
              <span className="mt-0.5 block text-[9.5px] text-faint">{file.detail}</span>
            </span>
            <span className="rounded border border-line bg-canvas px-1.5 py-[2px] font-mono text-[8.5px] tracking-[0.08em] text-muted">
              {file.ext}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10.5px] leading-relaxed text-faint">
        Timestamps are preserved in every format. Notes are appended to Markdown.
      </p>
    </div>
  );
}

const FRAMES = {
  capture: CaptureFrame,
  library: LibraryFrame,
  listen: ListenFrame,
  export: ExportFrame,
};

function ProductTour() {
  const [active, setActive] = useState(CHAPTERS[0].id);
  const chapter = CHAPTERS.find((item) => item.id === active) || CHAPTERS[0];
  const Frame = FRAMES[chapter.frame];

  return (
    <section id="demo" className="scroll-mt-24 border-b border-line bg-paper">
      <div className="mx-auto max-w-[1180px] px-5 py-20 md:px-8 md:py-24">
        <div className="max-w-[640px]">
          <p className="micro">The product tour</p>
          <h2 className="mt-3 font-display text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.05] tracking-[-0.015em] text-ink">
            Four screens. One recording.
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
            A walk through the real screens — capture, library, read-aloud and export. Pick a
            chapter and look around.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-10">
          <div className="hidden flex-col gap-1 lg:flex" role="tablist" aria-label="Product tour chapters">
            {CHAPTERS.map((item) => {
              const isActive = item.id === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(item.id)}
                  className={cx(
                    'rounded-lg border-l-2 py-3 pl-4 pr-3 text-left transition-colors duration-200',
                    isActive
                      ? 'border-accent bg-canvas'
                      : 'border-transparent hover:bg-canvas/60',
                  )}
                >
                  <span
                    className={cx(
                      'block font-mono text-[9px] uppercase leading-none tracking-[0.14em]',
                      isActive ? 'text-accent' : 'text-faint',
                    )}
                  >
                    {item.kicker}
                  </span>
                  <span
                    className={cx(
                      'mt-1.5 block text-[13.5px] font-medium leading-tight',
                      isActive ? 'text-ink' : 'text-graphite',
                    )}
                  >
                    {item.title}
                  </span>
                  <span
                    className={cx(
                      'mt-1 block text-[11.5px] leading-relaxed',
                      isActive ? 'text-muted' : 'text-faint',
                    )}
                  >
                    {item.body}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="order-first min-w-0 lg:order-none">
            <div className="grid grid-cols-2 gap-1.5 lg:hidden" role="tablist" aria-label="Product tour chapters">
              {CHAPTERS.map((item) => {
                const isActive = item.id === active;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(item.id)}
                    className={cx(
                      'rounded-md border px-3 py-2 text-left font-mono text-[9.5px] uppercase leading-none tracking-[0.12em] transition-colors duration-200',
                      isActive
                        ? 'border-accent/40 bg-canvas text-accent'
                        : 'border-line text-faint hover:border-lineSoft hover:text-muted',
                    )}
                  >
                    {item.kicker}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-[12.5px] leading-relaxed text-muted lg:hidden">
              <span className="font-medium text-ink">{chapter.title}.</span> {chapter.body}
            </p>

            <div key={chapter.id} className="mt-4 animate-fade-in lg:mt-0">
              <Window path={chapter.id === 'capture' ? 'transcribe' : 'library/session'}>
                <Frame />
              </Window>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: 'Allow the microphone',
      body: 'Chrome or Edge asks once. Nothing is captured until you press start, and the tab shows you when it is live.',
    },
    {
      title: 'Talk in your own mix',
      body: 'Hindi, English, or both in the same sentence. You can move between locales without ending the session.',
    },
    {
      title: 'Keep the text',
      body: 'Edit a line, add a note, read it back aloud, or export it. The recording is already filed in the library.',
    },
  ];

  return (
    <section id="how" className="scroll-mt-24 border-b border-line bg-canvas">
      <div className="mx-auto max-w-[1180px] px-5 py-20 md:px-8 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[560px]">
            <p className="micro">How it works</p>
            <h2 className="mt-3 font-display text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.05] tracking-[-0.015em] text-ink">
              Three steps, no setup.
            </h2>
          </div>
          <p className="max-w-[320px] text-[12.5px] leading-relaxed text-muted">
            No audio pipeline to configure, no API key to paste. Open the tab, allow the mic, speak.
          </p>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="bg-paper px-6 py-7 md:px-7 md:py-8">
              <span className="font-display text-[30px] leading-none text-numeral">
                0{index + 1}
              </span>
              <h3 className="mt-5 text-[14.5px] font-semibold tracking-[-0.005em] text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-[12.5px] leading-[1.65] text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const SENTENCE = [
  { text: 'Toh basically,', tone: 'hi' },
  { text: 'the onboarding flow', tone: 'en' },
  { text: 'ko hum', tone: 'hi' },
  { text: 'two steps', tone: 'en' },
  { text: 'mein todenge, phir', tone: 'hi' },
  { text: 'we can test it', tone: 'en' },
  { text: 'agle hafte.', tone: 'hi' },
];

function Concept() {
  return (
    <section id="concept" className="scroll-mt-24 border-b border-line bg-paper">
      <div className="mx-auto grid max-w-[1180px] gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-16">
        <div>
          <p className="micro">Built around code-mixing</p>
          <h2 className="mt-3 font-display text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.05] tracking-[-0.015em] text-ink">
            It doesn’t make you pick a language.
          </h2>
          <p className="mt-4 max-w-[46ch] text-[13.5px] leading-[1.7] text-muted">
            Most tools force a single locale, so a Hinglish sentence comes back half wrong. Shabd
            treats the mix as the default: the engine listens in Indian English, and the transcript
            keeps both scripts exactly as they were spoken.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-6">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-faint">Languages</dt>
              <dd className="mt-1.5 font-display text-[26px] leading-none text-ink">3</dd>
              <p className="mt-1 text-[11px] text-muted">हिन्दी · English · Mixed</p>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-faint">Leaves device</dt>
              <dd className="mt-1.5 font-display text-[26px] leading-none text-ink">Nothing</dd>
              <p className="mt-1 text-[11px] text-muted">Transcripts stay in the browser</p>
            </div>
          </dl>
        </div>

        <div className="card p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-nightRaised text-[8px] font-medium text-onNight/80">
                SK
              </span>
              <span className="text-[11.5px] text-muted">Sprint planning</span>
            </span>
            <span className="flex items-center gap-2">
              <LanguageChip language="mixed" />
              <span className="font-mono text-[9.5px] text-faint">00:34</span>
            </span>
          </div>

          <p className="mt-6 font-display text-[clamp(1.35rem,2.2vw,1.75rem)] leading-[1.5] tracking-[-0.01em] text-ink">
            {SENTENCE.map((part, index) => (
              <span
                key={`${part.text}-${index}`}
                className={part.tone === 'hi' ? 'text-amber' : 'text-ink'}
              >
                {part.text}{' '}
              </span>
            ))}
            <span className="ml-0.5 inline-block h-[18px] w-[2px] translate-y-[3px] animate-caret bg-accent align-middle" />
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-lineSoft pt-4">
            <span className="flex items-center gap-4 text-[10.5px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-[5px] w-[5px] rounded-full bg-amber" />
                हिन्दी
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-[5px] w-[5px] rounded-full bg-ink" />
                English
              </span>
            </span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint">
              12 words · 7s
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="border-b border-line bg-canvas">
      <div className="mx-auto max-w-[1180px] px-5 py-20 md:px-8 md:py-24">
        <div className="max-w-[560px]">
          <p className="micro">What you get</p>
          <h2 className="mt-3 font-display text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.05] tracking-[-0.015em] text-ink">
            The small things that make it usable.
          </h2>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="group bg-paper px-6 py-7">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-canvas text-graphite transition-colors group-hover:border-lineStrong group-hover:text-accent">
                <Icon name={feature.icon} size={15} />
              </span>
              <h3 className="mt-4 text-[13.5px] font-semibold tracking-[-0.005em] text-ink">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-[1.65] text-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 border-b border-line bg-paper">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div>
          <p className="micro">Straight answers</p>
          <h2 className="mt-3 font-display text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.05] tracking-[-0.015em] text-ink">
            Questions worth asking.
          </h2>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
            Still unsure about something? Create an account and record your first note in under a minute.
          </p>
        </div>

        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 [&::-webkit-details-marker]:hidden">
                <span className="text-[13.5px] font-medium leading-snug text-ink">{item.q}</span>
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line bg-canvas text-muted transition-transform duration-200 group-open:rotate-45">
                  <Icon name="plus" size={11} />
                </span>
              </summary>
              <p className="mt-3 max-w-[62ch] pr-8 text-[12.5px] leading-[1.7] text-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ user, navigate }) {
  return (
    <section className="relative overflow-hidden bg-night">
      <div
        className="hairline-grid-light pointer-events-none absolute inset-0 opacity-20"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1180px] px-5 py-20 text-center md:px-8 md:py-24">
        <span className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-onNight/55">
          <span className="h-[3px] w-[3px] rounded-full bg-live" />
          Free while in beta
        </span>

        <h2 className="mx-auto mt-6 max-w-[720px] font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.02em] text-onNight">
          Stop typing up your own calls.
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-[13.5px] leading-relaxed text-onNight/55">
          Open the workspace, press record, and keep talking in whatever language the thought
          arrives in.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(user ? '/transcribe' : '/signup')}
            className="btn btn-light px-5 py-2.5 text-[13.5px]"
          >
            {user ? 'Open workspace' : 'Create a free account'}
            <Icon name="arrowRight" size={15} />
          </button>
          {!user && (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn px-4 py-2.5 text-[13.5px] text-onNight/70 hover:bg-white/[0.06] hover:text-onNight"
            >
              I already have one
            </button>
          )}
        </div>

        <p className="mt-6 font-mono text-[9.5px] uppercase tracking-[0.14em] text-onNight/35">
          No card · on-device · Chrome, Edge and Android
        </p>
      </div>
    </section>
  );
}

function Footer({ user, navigate }) {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="max-w-[280px]">
            <Wordmark />
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              A speech workspace for people who think out loud — in more than one language.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                Product
              </p>
              <ul className="mt-3 space-y-2">
                {[
                  { label: 'Transcribe', action: () => navigate(user ? '/transcribe' : '/signup') },
                  { label: 'Library', action: () => navigate(user ? '/library' : '/login') },
                  { label: 'Settings', action: () => navigate(user ? '/settings' : '/login') },
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={item.action}
                      className="text-[12px] text-muted transition-colors hover:text-ink"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                Learn
              </p>
              <ul className="mt-3 space-y-2">
                {NAV_LINKS.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => scrollTo(link.id)}
                      className="text-[12px] text-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                Account
              </p>
              <ul className="mt-3 space-y-2">
                {user ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate('/transcribe')}
                      className="text-[12px] text-muted transition-colors hover:text-ink"
                    >
                      Open workspace
                    </button>
                  </li>
                ) : (
                  <>
                    <li>
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-[12px] text-muted transition-colors hover:text-ink"
                      >
                        Sign in
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => navigate('/signup')}
                        className="text-[12px] text-muted transition-colors hover:text-ink"
                      >
                        Create account
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-lineSoft pt-5">
          <p className="text-[11px] text-faint">© 2026 Shabd. Built for people who think out loud.</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            हिन्दी में भी
          </p>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage({ user, navigate }) {
  return (
    <div className="min-h-screen bg-paper">
      <TopBar user={user} navigate={navigate} />
      <main>
        <Hero user={user} navigate={navigate} />
        <Marquee />
        <ProductTour />
        <HowItWorks />
        <Concept />
        <Features />
        <Faq />
        <FinalCta user={user} navigate={navigate} />
      </main>
      <Footer user={user} navigate={navigate} />
    </div>
  );
}
