# Shabd — frontend

A speech workspace for real-time, multilingual transcription. This folder is the
complete client: a public landing page, local accounts, microphone capture, a live
transcript, and a library with full CRUD.

```bash
npm install
npm run dev      # http://localhost:5173 (proxies /api → :5000)
npm run build
```

## The flow

```
/            Landing page — what it does, a live demo, the tour, FAQ
  ↓ Start free / Start transcribing
/signup      Create an account   ←→  /login  (tabs on the same screen)
  ↓
/transcribe  Workspace: capture, library, session editor, settings
```

Signed-out visits to `/transcribe`, `/library` or `/settings` are redirected to
the sign-in screen. Signed-in visits to `/login` or `/signup` go to the workspace.

## What actually works right now

| Feature | How |
| --- | --- |
| Landing page | Editorial layout, animated live transcript, four-chapter product tour, code-mixing explainer, FAQ |
| Accounts | Supabase Auth via the Express API (sign-up, sign-in, sign-out, profile edits, password change) |
| Live capture | `getUserMedia` + `MediaRecorder` captures the real microphone audio; Web Audio `AnalyserNode` drives the input levels |
| Live transcript | Raw PCM is cut at natural pauses and each chunk is sent to `POST /api/ai/transcribe`, so real words appear while you speak |
| Real transcript | The saved session is built from those transcribed chunks; if one fails, the full WAV is sent on stop |
| Code-mixed output | Recognition locale is switchable mid-session (`en-IN` / `hi-IN` / `en-US`) |
| Library CRUD | Create on save, read, rename, edit any segment, delete — scoped per account |
| Export | `.txt`, `.srt`, `.md` per session, plus JSON for the whole workspace |
| Read aloud | `speechSynthesis`, segment by segment, with progress highlight |
| Search | `⌘K` palette over titles + transcript text, plus library filters and sort |

There is no simulated/demo stream. If the microphone or transcription service
is unavailable the app shows an error instead of inventing a transcript.

## Storage

Accounts, settings and transcripts live in Supabase behind the Express API.
The client keeps only the auth session token in web storage.

## Structure

```
src/
  App.jsx                 public routes + auth gate
  Workspace.jsx           signed-in shell: sidebar, pages, shortcuts, sign-out
  pages/                  LandingPage · AuthPage · Transcribe · Library · Session · Settings
  components/             Sidebar, LiveDemo, CommandPalette, ConfirmDialog, Toast, Waveform, ui primitives
  hooks/                  useAuth · useRecorder · useSessions · useNarration · useRoute · useSettings
  lib/                    auth · store (data) · format (time, export, clipboard) · languages
  api/client.js           fetch wrapper for the Express backend
```

## Design system

**Graphite + Cyan** — a flat, cool monochrome system where one color carries meaning.
All colors live as tokens in `tailwind.config.js`; components never hardcode hex.

- **Surfaces.** Cool off-white canvas (`canvas #FBFCFD`) and paper (`paper #F1F3F4`); one near-black night surface (`night #0C1116`) reserved for the capture console, auth panel, and dark CTA.
- **Text.** An ink-to-gray ramp (`ink #10161C` → `faint #626D76`, all ≥ 4.5:1 on light surfaces) plus `onNight #E4EAEF` on dark. Numerals and timecodes use `numeral #7E8991` (≥ 3:1) in JetBrains Mono.
- **Cyan is semantic.** Deep cyan (`accent #0B7285`, `accentOnDark #46A7BE` on night) appears *only* for live/active state — the recording dot, waveform peaks, active tabs, focus rings. Solid CTAs are `bg-ink` so cyan keeps its meaning.
- **Danger & Hindi.** Muted red (`danger #A9352B`) for destructive actions only; restrained amber (`amber #7A5C25`) for Hindi script.
- **Geometry.** 8–14 px radii, 1 px hairlines (`line` tokens), shadows that barely exist. **No gradients, no glass, no backdrop blur** — scrims are solid `bg-ink/40`.
- **Grain.** A 2% noise overlay sits above the whole app so large flat areas read as material rather than as a screenshot. Hairline grid patterns (`.hairline-grid` / `.hairline-grid-light`) give dark panels quiet texture.
- **Motion.** The landing tour and demo are real DOM, not a video file, so they stay sharp and respond to `prefers-reduced-motion`. To use a recorded reel instead, drop an `.mp4` in `public/` and swap the frame in `LandingPage.jsx` for a `<video>`.

## Data flow

`src/lib/store.js` is the only module that touches persistence:

```js
listSessions()            → GET    /api/transcriptions
getSession(id)            → GET    /api/transcriptions/:id
createSession(draft)      → POST   /api/transcriptions
updateSession(id, patch)  → PATCH  /api/transcriptions/:id
deleteSession(id)         → DELETE /api/transcriptions/:id
transcribeAudio(draft)    → POST   /api/ai/transcribe
getEngineInfo()           → GET    /api/ai/engine
```

`hooks/useRecorder.js` captures the microphone with `MediaRecorder` (kept as the
full-session fallback) and taps raw PCM through the Web Audio API. While you
speak, it cuts short chunks at natural pauses, converts each to 16 kHz mono WAV,
and posts it to `/api/ai/transcribe`. Returned segments are offset onto the
session timeline and shown immediately. On stop, the remaining chunk is flushed
and the live segments are saved; if any chunk failed, the complete recording is
transcribed in one request instead.

## Browser notes

- Chrome / Edge: full support (live transcript + levels + read-aloud).
- Firefox / Safari: microphone recording and live chunking work through the Web
  Audio API; the fallback `ScriptProcessorNode` path is used where
  `AudioWorklet` is unavailable.
- Brave: live transcription is unaffected by Shields because it runs on the
  server, not the browser's speech recognition.

## Not built yet

Audio storage/playback of the original recording.
