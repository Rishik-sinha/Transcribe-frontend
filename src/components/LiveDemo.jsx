import { useEffect, useMemo, useState } from 'react';
import { Icon } from './icons';
import { cx, formatClock, wordCount } from '../lib/format';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const SCRIPT = [
  { text: 'Toh basically, hum onboarding ko do steps mein todna chahte hain.', time: '00:04' },
  { text: 'Pehle sirf email poocho, then the rest of the details — step by step.', time: '00:19' },
  { text: 'Aur haan, the copy on step two needs to be much shorter.', time: '00:31' },
];

const BAR_COUNT = 60;

/**
 * A scripted rendering of the product's core loop: speech in, timestamped text
 * out. It is real DOM (not a video), so it stays sharp on every screen and can
 * follow the reader's motion preferences.
 */
export function LiveDemo({ compact = false, className = '' }) {
  const reduced = usePrefersReducedMotion();
  const [lines, setLines] = useState([]);
  const [typing, setTyping] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (reduced) {
      setLines(SCRIPT);
      setTyping('');
      return undefined;
    }

    setLines([]);
    setTyping('');

    let alive = true;
    let timer = null;
    let lineIndex = 0;
    let wordIndex = 0;
    let holdTicks = 0;

    const tick = () => {
      if (!alive) return;
      const words = SCRIPT[lineIndex].text.split(' ');

      if (holdTicks > 0) {
        holdTicks -= 1;
        timer = setTimeout(tick, 160);
        return;
      }

      wordIndex += 1;
      setTyping(words.slice(0, wordIndex).join(' '));

      if (wordIndex >= words.length) {
        const finished = SCRIPT[lineIndex];
        setLines((current) =>
          lineIndex === SCRIPT.length - 1 ? [] : [...current.slice(-2), finished],
        );
        setTyping('');
        holdTicks = 9;
        lineIndex = (lineIndex + 1) % SCRIPT.length;
        wordIndex = 0;
      }

      timer = setTimeout(tick, 95 + Math.random() * 70);
    };

    timer = setTimeout(tick, 800);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced) return undefined;
    const id = setInterval(() => setFrame((value) => value + 1), 120);
    return () => clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    const id = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const bars = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, index) => {
        if (reduced) {
          return 0.1 + Math.abs(Math.sin(index * 0.55) * Math.cos(index * 0.21)) * 0.55;
        }
        const left = Math.abs(Math.sin(index * 0.62 + frame * 0.21));
        const right = Math.abs(Math.cos(index * 0.29 - frame * 0.13));
        return Math.min(1, 0.16 + left * 0.58 + right * 0.32);
      }),
    [frame, reduced],
  );

  const words =
    wordCount(lines.map((line) => line.text).join(' ')) + wordCount(typing);

  return (
    <div
      className={cx(
        'overflow-hidden rounded-xl2 border border-white/[0.07] bg-night shadow-console',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5">
        <span className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inset-0 animate-ping-slow rounded-full bg-live" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-live" />
          </span>
          <span className="font-mono text-[9.5px] uppercase leading-none tracking-[0.14em] text-onNight/60">
            {compact ? 'Live' : 'Recording'}
          </span>
        </span>

        <span className="flex items-center gap-2.5">
          <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2 py-[2px] text-[9px] uppercase leading-none tracking-[0.08em] text-onNight/55 sm:inline">
            Mixed · hi + en
          </span>
          <span className="font-mono text-[10.5px] leading-none tabular text-onNight/45">
            {formatClock(seconds)}
          </span>
        </span>
      </div>

      <div className={compact ? 'px-4 py-4' : 'px-4 py-4 sm:px-5 sm:py-5'}>
        <div
          className={cx(
            'flex items-center justify-between gap-[2px]',
            compact ? 'h-9' : 'h-12',
          )}
          aria-hidden="true"
        >
          {bars.map((value, index) => (
            <span
              key={index}
              style={{ height: `${Math.max(6, Math.round(value * 100))}%` }}
              className={cx(
                'min-w-[2px] max-w-[4px] flex-1 rounded-full transition-[height] duration-100 ease-linear',
                value > 0.74 ? 'bg-live' : 'bg-onNight/30',
              )}
            />
          ))}
        </div>

        <div
          className={
            compact
              ? 'mt-3 min-h-[108px] space-y-2'
              : 'mt-4 min-h-[132px] space-y-2.5'
          }
        >
          {lines.map((line, index) => (
            <div key={`${line.time}-${index}`} className="flex gap-3">
              <span className="mt-[3px] shrink-0 font-mono text-[9.5px] leading-[1.55] tabular text-onNight/35">
                {line.time}
              </span>
              <p
                className={cx(
                  'text-onNight/85',
                  compact
                    ? 'text-[12.5px] leading-[1.6]'
                    : 'text-[13px] leading-[1.65] sm:text-[13.5px]',
                )}
              >
                {line.text}
              </p>
            </div>
          ))}

          <div className="flex min-h-[20px] gap-3">
            <span className="mt-[3px] w-[26px] shrink-0 font-mono text-[9.5px] leading-[1.55] tabular text-onNight/35">
              {typing ? '··' : ''}
            </span>
            <p
              className={cx(
                'text-onNight/55',
                compact
                  ? 'text-[12.5px] leading-[1.6]'
                  : 'text-[13px] leading-[1.65] sm:text-[13.5px]',
              )}
            >
              {typing}
              {!reduced && (
                <span className="ml-[2px] inline-block h-[12px] w-[2px] translate-y-[2px] animate-caret bg-live align-middle" />
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-2.5 font-mono text-[9px] uppercase leading-none tracking-[0.12em] text-onNight/35">
        <span className="tabular">
          {words} words · {lines.length} {lines.length === 1 ? 'segment' : 'segments'}
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="shield" size={11} />
          On device
        </span>
      </div>
    </div>
  );
}
