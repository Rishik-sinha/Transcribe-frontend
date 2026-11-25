export const LANGUAGES = {
  mixed: {
    id: 'mixed',
    label: 'Mixed',
    detail: 'Hindi + English',
    asr: 'en-IN',
    voice: 'en-IN',
  },
  hi: {
    id: 'hi',
    label: 'Hindi',
    detail: 'हिन्दी',
    asr: 'hi-IN',
    voice: 'hi-IN',
  },
  en: {
    id: 'en',
    label: 'English',
    detail: 'English',
    asr: 'en-US',
    voice: 'en-IN',
  },
};

export const LANGUAGE_ORDER = ['mixed', 'hi', 'en'];

export const ASR_OPTIONS = [
  { id: 'mixed', label: 'Mixed · Hindi + English', asr: 'en-IN' },
  { id: 'hi', label: 'Hindi · हिन्दी', asr: 'hi-IN' },
  { id: 'en', label: 'English · US', asr: 'en-US' },
];

export function languageOf(value) {
  return LANGUAGES[value] || LANGUAGES.mixed;
}

const DEVANAGARI = /[\u0900-\u097F]/;
const LATIN = /[A-Za-z]/;

/**
 * Speech engines rarely agree on a label for code-mixing, so we look at the
 * output itself: Devanagari + Latin in one transcript means mixed.
 */
export function detectLanguage(text, fallback = 'mixed') {
  const devanagari = DEVANAGARI.test(text);
  const latin = LATIN.test(text);
  if (devanagari && latin) return 'mixed';
  if (devanagari) return 'hi';
  if (latin) return fallback === 'hi' ? 'hi' : fallback === 'en' ? 'en' : 'mixed';
  return fallback;
}

export function detectFromSegments(segments = [], fallback = 'mixed') {
  const combined = segments.map((segment) => segment.text).join(' ');
  if (!combined.trim()) return fallback;
  return detectLanguage(combined, fallback);
}
