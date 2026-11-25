/* Hand-drawn icon set — 24px grid, 1.5 stroke, round joins. */

const paths = {
  mic: (
    <>
      <path d="M12 3.25a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3Z" />
      <path d="M5.75 11.5a6.25 6.25 0 0 0 12.5 0" />
      <path d="M12 17.75v3" />
    </>
  ),
  micOff: (
    <>
      <path d="M9.5 6a2.5 2.5 0 0 1 5 0v4.5" />
      <path d="M9.5 9.5v1.75a2.5 2.5 0 0 0 3.2 2.4" />
      <path d="M5.75 11.5a6.25 6.25 0 0 0 9.6 5.3" />
      <path d="M12 17.75v3" />
      <path d="M4 4l16 16" />
    </>
  ),
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" />,
  pause: (
    <>
      <path d="M9.5 5.5v13" />
      <path d="M14.5 5.5v13" />
    </>
  ),
  play: (
    <path
      d="M8.5 5.9v12.2a.7.7 0 0 0 1.06.6l9.5-6.1a.7.7 0 0 0 0-1.18l-9.5-6.1a.7.7 0 0 0-1.06.58Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  trash: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.4A1.4 1.4 0 0 1 10.9 4h2.2a1.4 1.4 0 0 1 1.4 1.4V7" />
      <path d="M6.7 7l.72 11.7a1.6 1.6 0 0 0 1.6 1.55h6a1.6 1.6 0 0 0 1.6-1.55L17.3 7" />
      <path d="M10.6 11v5.6M13.4 11v5.6" />
    </>
  ),
  pencil: (
    <>
      <path d="M4.5 19.5h4L19 9a2.12 2.12 0 0 0-3-3L5.5 16.5v3Z" />
      <path d="M13.6 6.4l3 3" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="10.5" height="10.5" rx="2" />
      <path d="M15 6.4V5a1.8 1.8 0 0 0-1.8-1.8H5A1.8 1.8 0 0 0 3.2 5v8.2A1.8 1.8 0 0 0 5 15h1.2" />
    </>
  ),
  download: (
    <>
      <path d="M12 4.2v10.6" />
      <path d="M7.6 10.6 12 15l4.4-4.4" />
      <path d="M4.5 19.3h15" />
    </>
  ),
  check: <path d="M5 12.4 9.4 16.8 19 6.8" />,
  x: <path d="M6.2 6.2l11.6 11.6M17.8 6.2 6.2 17.8" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.3" />
      <path d="M15.6 15.6 20 20" />
    </>
  ),
  plus: <path d="M12 5.2v13.6M5.2 12h13.6" />,
  sliders: (
    <>
      <path d="M4 7h8.4M17.6 7H20M4 17h2.4M11.6 17H20" />
      <circle cx="15" cy="7" r="2.3" />
      <circle cx="9" cy="17" r="2.3" />
    </>
  ),
  list: (
    <>
      <path d="M4.5 7h15M4.5 12h15M4.5 17h9.5" />
    </>
  ),
  waveform: <path d="M4 10v4M8 6.6v10.8M12 8.6v6.8M16 5.4v13.2M20 10.4v3.2" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.1" />
      <path d="M12 7.6V12l3.1 1.9" />
    </>
  ),
  chevronLeft: <path d="M14.4 6.2 8.6 12l5.8 5.8" />,
  chevronRight: <path d="M9.6 6.2 15.4 12l-5.8 5.8" />,
  chevronDown: <path d="M6.2 9.4 12 15.2l5.8-5.8" />,
  arrowRight: (
    <>
      <path d="M4.8 12h13.4" />
      <path d="M13.4 7.2 18.2 12l-4.8 4.8" />
    </>
  ),
  arrowUpRight: <path d="M7.4 16.6 16.6 7.4M9.2 7.4h7.4v7.4" />,
  more: (
    <>
      <circle cx="5.6" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="18.4" cy="12" r="1.35" fill="currentColor" stroke="none" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.1" />
      <path d="M4 12h16M12 3.9c2.4 2.2 3.6 5 3.6 8.1s-1.2 5.9-3.6 8.1c-2.4-2.2-3.6-5-3.6-8.1S9.6 6.1 12 3.9Z" />
    </>
  ),
  headphones: (
    <>
      <path d="M4.5 15.2v-2.7a7.5 7.5 0 0 1 15 0v2.7" />
      <path d="M4.5 14.2h1.6a1.2 1.2 0 0 1 1.2 1.2v3.1a1.2 1.2 0 0 1-1.2 1.2H5.7a1.2 1.2 0 0 1-1.2-1.2v-4.3Z" />
      <path d="M19.5 14.2h-1.6a1.2 1.2 0 0 0-1.2 1.2v3.1a1.2 1.2 0 0 0 1.2 1.2h.4a1.2 1.2 0 0 0 1.2-1.2v-4.3Z" />
    </>
  ),
  command: (
    <>
      <path d="M9.4 6.6a2.3 2.3 0 1 0-2.3 2.3h2.3V6.6Z" />
      <path d="M14.6 6.6a2.3 2.3 0 1 1 2.3 2.3h-2.3V6.6Z" />
      <path d="M9.4 17.4a2.3 2.3 0 1 1-2.3-2.3h2.3v2.3Z" />
      <path d="M14.6 17.4a2.3 2.3 0 1 0 2.3-2.3h-2.3v2.3Z" />
      <rect x="9.4" y="8.9" width="5.2" height="6.2" rx="1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.1" />
      <path d="M12 11.1v5M12 7.9v.01" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.4 20 19.4H4L12 4.4Z" />
      <path d="M12 9.8v4.1M12 16.4v.01" />
    </>
  ),
  filter: <path d="M4.5 6.4h15M7.5 12h9M10.5 17.6h3" />,
  calendar: (
    <>
      <rect x="4" y="5.6" width="16" height="14.4" rx="2" />
      <path d="M4 10.2h16M9 3.6v4M15 3.6v4" />
    </>
  ),
  fileText: (
    <>
      <path d="M6.6 3.6h7L19 9v11.4H6.6V3.6Z" />
      <path d="M13.4 3.6V9H19" />
      <path d="M9.4 13h6M9.4 16.4h4" />
    </>
  ),
  volume: (
    <>
      <path d="M11.2 5.6 6.8 9H4.2v6h2.6l4.4 3.4V5.6Z" />
      <path d="M15.2 9.3a3.8 3.8 0 0 1 0 5.4M17.7 6.9a7.2 7.2 0 0 1 0 10.2" />
    </>
  ),
  spark: (
    <path d="M12 4.2l1.5 4.6 4.6 1.5-4.6 1.5L12 16.4l-1.5-4.6L5.9 10.3l4.6-1.5L12 4.2Z" />
  ),
  users: (
    <>
      <circle cx="9.2" cy="9" r="3" />
      <path d="M3.8 19c.6-3 2.8-4.7 5.4-4.7s4.8 1.7 5.4 4.7" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6M17.6 14.7c1.9.5 3.1 2 3.5 4.3" />
    </>
  ),
  logout: (
    <>
      <path d="M13.8 5.6H7.6A1.6 1.6 0 0 0 6 7.2v9.6a1.6 1.6 0 0 0 1.6 1.6h6.2" />
      <path d="M12 12h8.2M17.2 8.8 20.4 12l-3.2 3.2" />
    </>
  ),
  folder: (
    <path d="M3.6 7.4A1.8 1.8 0 0 1 5.4 5.6h3.7l1.8 2.1h7.7a1.8 1.8 0 0 1 1.8 1.8v7.7a1.8 1.8 0 0 1-1.8 1.8H5.4a1.8 1.8 0 0 1-1.8-1.8V7.4Z" />
  ),
  refresh: (
    <>
      <path d="M19.4 12a7.4 7.4 0 1 1-2.2-5.2" />
      <path d="M19.6 4.6v4.6H15" />
    </>
  ),
  bolt: <path d="M13.4 3.6 6.4 13.4h4.4l-1.2 7 7.6-10.2h-4.6l.8-6.6Z" />,
  mail: (
    <>
      <rect x="3.4" y="5.4" width="17.2" height="13.2" rx="2.2" />
      <path d="m4.6 7.4 6.4 4.8a1.7 1.7 0 0 0 2 0l6.4-4.8" />
    </>
  ),
  lock: (
    <>
      <rect x="4.8" y="10.2" width="14.4" height="10" rx="2.2" />
      <path d="M8.4 10.2V7.8a3.6 3.6 0 0 1 7.2 0v2.4" />
      <path d="M12 14.2v2.2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.8 12s3.4-5.4 9.2-5.4S21.2 12 21.2 12s-3.4 5.4-9.2 5.4S2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M5.6 6.8C3.9 8.2 2.8 10 2.8 10s3.4 5.4 9.2 5.4c1.4 0 2.7-.3 3.9-.8" />
      <path d="M9.4 5.1A9.7 9.7 0 0 1 12 4.8c5.8 0 9.2 5.2 9.2 5.2a16 16 0 0 1-2.8 3.3" />
      <path d="M4 4l16 16" />
      <path d="M10.1 10.1a2.6 2.6 0 0 0 3.7 3.7" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19.2 12H5.8" />
      <path d="M10.6 7.2 5.8 12l4.8 4.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.4 5.2 6v5.4c0 4.3 2.9 7.4 6.8 9.2 3.9-1.8 6.8-4.9 6.8-9.2V6L12 3.4Z" />
      <path d="m9 11.9 2.2 2.2 3.9-3.9" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.4" r="3.4" />
      <path d="M5 19.6c.8-3.4 3.5-5.4 7-5.4s6.2 2 7 5.4" />
    </>
  ),
};

export function Icon({ name, size = 18, strokeWidth = 1.5, className = '', ...rest }) {
  const content = paths[name];
  if (!content) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {content}
    </svg>
  );
}

export function BrandMark({ size = 30, className = '' }) {
  return (
    <span
      className={`inline-grid place-items-center rounded-[8px] bg-ink text-onNight ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
          <path d="M4 10v4" />
          <path d="M8.2 7v10" />
          <path d="M12.4 9v6" />
          <path d="M16.6 5.6v12.8" />
          <path d="M20.4 10.4v3.2" />
        </g>
      </svg>
    </span>
  );
}
