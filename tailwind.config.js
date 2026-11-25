/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Surfaces — flat cool graphite, no warmth. */
        canvas: '#FBFCFD',
        paper: '#F1F3F4',
        paperDeep: '#E7EAEC',
        night: '#0C1116',
        nightRaised: '#1A222A',

        /* Text on light — near-black to quiet gray, all >= 4.5:1 on canvas. */
        ink: '#10161C',
        graphite: '#263139',
        slate: '#3A454E',
        muted: '#5B6973',
        faint: '#626D76',
        numeral: '#7E8991',

        /* Hairlines on light. */
        line: '#DDE2E5',
        lineSoft: '#EAEDEF',
        lineStrong: '#C6CDD2',

        /* Accent — deep cyan. Reserved for live/active states and focus only. */
        accent: '#0B7285',
        accentDeep: '#095E6E',
        accentSoft: '#E3F2F5',
        accentLine: '#B9DCE4',
        accentOnDark: '#46A7BE',

        /* Live capture — the same cyan, used only while recording. */
        live: '#0B7285',
        liveDeep: '#095E6E',
        liveSoft: '#E3F2F5',

        /* Danger — destructive actions and validation only. */
        danger: '#A9352B',
        dangerDeep: '#8A2A22',
        dangerSoft: '#F9E9E7',
        dangerLine: '#EAC9C4',
        dangerOnDark: '#E08A80',

        /* Hindi script — a restrained amber, text only. */
        amber: '#7A5C25',
        amberSoft: '#F5EFE2',
        amberLine: '#E5DCC6',

        /* Text on dark surfaces. */
        onNight: '#E4EAEF',
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 1px rgba(16,22,28,0.04), 0 10px 30px -22px rgba(16,22,28,0.28)',
        lift: '0 2px 4px rgba(16,22,28,0.05), 0 18px 44px -28px rgba(16,22,28,0.32)',
        console:
          'inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 60px -44px rgba(4,8,11,0.8)',
      },
      borderRadius: {
        xl2: '14px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        caret: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '100%': { transform: 'scale(2.6)', opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.36s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.18s ease both',
        'toast-in': 'toast-in 0.26s cubic-bezier(0.22, 1, 0.36, 1) both',
        caret: 'caret 1.1s steps(1) infinite',
        'ping-slow': 'ping-slow 1.9s cubic-bezier(0, 0, 0.2, 1) infinite',
        marquee: 'marquee 42s linear infinite',
        'rise-in': 'rise-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
