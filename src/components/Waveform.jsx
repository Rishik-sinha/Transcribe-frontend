import { cx } from '../lib/format';

export function Waveform({ levels = [], live = false, className = '' }) {
  return (
    <div
      className={cx('flex h-full w-full items-center justify-center gap-[3px]', className)}
      aria-hidden="true"
    >
      {levels.map((value, index) => {
        const height = Math.max(3, Math.round(Math.min(1, Math.max(0.03, value)) * 100));
        const hot = value > 0.5;
        return (
          <span
            key={index}
            style={{ height: `${height}%` }}
            className={cx(
              'min-w-[2px] max-w-[4px] flex-1 rounded-full transition-[height,background-color] duration-100 ease-linear',
              live
                ? hot
                  ? 'bg-live'
                  : 'bg-onNight/45'
                : 'bg-onNight/25',
            )}
          />
        );
      })}
    </div>
  );
}

export function LevelTrack({ level = 0, className = '' }) {
  const active = level > 0.05;
  const width = active ? Math.min(100, Math.max(3, level * 100)) : 0;
  return (
    <div className={cx('h-[2px] w-full overflow-hidden rounded-full bg-white/10', className)}>
      <div
        className="h-full rounded-full bg-live/80 transition-[width] duration-100 ease-linear"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
