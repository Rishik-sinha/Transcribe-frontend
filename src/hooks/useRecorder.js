import { useCallback, useEffect, useRef, useState } from 'react';
import { blobToWavBase64, pcmToWavBase64 } from '../lib/audio';
import { LANGUAGES } from '../lib/languages';
import { transcribeAudio } from '../lib/store';

// Real, live microphone capture.
//
// Audio is recorded with MediaRecorder (kept as a lossless fallback for the
// whole session) AND tapped as raw PCM through the Web Audio API. While the
// user is narrating, the PCM is buffered and a chunk is closed only when a
// short break between sentences is detected (PAUSE_MS of quiet after voice);
// that chunk is then sent to the backend, so transcript segments appear in
// the UI exactly when the speaker pauses. The saved transcript is built from
// those real chunks.
//
// There is deliberately no simulated/demo fallback: if the microphone or the
// transcription service is unavailable we surface an error instead of
// inventing text.

const BAR_COUNT = 60;
const MIC_TIMEOUT_MS = 20000;
const MIN_AUDIO_BYTES = 1500;

// Live chunking is pause-driven, NOT timer-driven. There is no fixed-size
// (e.g. 5 s) chunk cut: a chunk is closed only when the speaker takes a short
// break between sentences, and it is cut exactly at the speech boundary (see
// lastVoiceCutIndex) so a sentence is never split mid-word. FAILSAFE_CHUNK_SEC
// only bounds memory if no pause is ever detected (e.g. constant background
// noise); MIN_CHUNK_SEC just avoids flushing the first instants of a buffer.
const MIN_CHUNK_SEC = 0.9;
const FAILSAFE_CHUNK_SEC = 30;
const PAUSE_MS = 700;
const MIN_TRANSCRIBE_SEC = 0.5;
const VOICE_RMS = 0.012;
const TRAILING_TAIL_MS = 180;

const WORKLET_CODE = `
class ShabdPcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(2048);
    this.offset = 0;
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const block = input[0];
    let index = 0;
    while (index < block.length) {
      const take = Math.min(this.buffer.length - this.offset, block.length - index);
      this.buffer.set(block.subarray(index, index + take), this.offset);
      this.offset += take;
      index += take;
      if (this.offset === this.buffer.length) {
        this.port.postMessage(this.buffer.slice(0));
        this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor('shabd-pcm', ShabdPcmProcessor);
`;

function idleLevels() {
  return Array.from(
    { length: BAR_COUNT },
    (_, index) => 0.06 + Math.abs(Math.sin(index * 0.42)) * 0.07,
  );
}

function supportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function newSegmentId() {
  return `live_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Index just past the last voiced window (+ a short tail) — the exact end of
 * the spoken sentence inside the buffer. Cutting there means a live chunk
 * always ends at a natural speech boundary, never inside a word and never on
 * a timer. Returns 0 when the buffer contains no voice at all.
 */
function lastVoiceCutIndex(samples, rate, minSamples) {
  const windowSize = Math.max(1, Math.floor(rate * 0.05)); // 50 ms windows
  const tail = Math.floor((rate * TRAILING_TAIL_MS) / 1000);
  let lastVoiceEnd = 0;

  for (let start = 0; start + windowSize <= samples.length; start += windowSize) {
    let energy = 0;
    for (let i = start; i < start + windowSize; i += 1) energy += samples[i] * samples[i];
    if (Math.sqrt(energy / windowSize) > VOICE_RMS) lastVoiceEnd = start + windowSize;
  }

  if (!lastVoiceEnd) return 0;
  const withTail = Math.min(samples.length, lastVoiceEnd + tail);
  // Keep at least minSamples so a short but real utterance ("yes.") is still sent.
  return Math.max(withTail, Math.min(minSamples, samples.length));
}

export function useRecorder({ initialLanguage = 'mixed' } = {}) {
  const [status, setStatus] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState(idleLevels);
  const [segments, setSegments] = useState([]);
  const [notice, setNotice] = useState(null);
  const [language, setLanguageState] = useState(initialLanguage);
  const [micLabel, setMicLabel] = useState(null);
  const [liveBusy, setLiveBusy] = useState(0);
  const [liveEngine, setLiveEngine] = useState('');
  const [liveFailed, setLiveFailed] = useState(false);

  const phaseRef = useRef('idle');
  const languageRef = useRef(initialLanguage);
  const segmentsRef = useRef([]);
  const elapsedMsRef = useRef(0);
  const startedAtRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const processorRef = useRef(null);
  const muteGainRef = useRef(null);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const lastLevelAtRef = useRef(0);
  const runIdRef = useRef(0);
  const pausedRef = useRef(false);
  const stopPromiseRef = useRef(Promise.resolve());

  // Live chunk state
  const chunkBuffersRef = useRef([]);
  const chunkSamplesRef = useRef(0);
  const chunkStartSecRef = useRef(0);
  const contextRateRef = useRef(0);
  const lastVoiceAtRef = useRef(0);
  const chunkHasVoiceRef = useRef(false);
  const liveSegmentsRef = useRef([]);
  const liveEngineRef = useRef('');
  const liveFailedRef = useRef(false);
  const pendingChunksRef = useRef(0);
  const queueRef = useRef(Promise.resolve());
  const flushIntervalRef = useRef(null);

  const setPhase = useCallback((next) => {
    phaseRef.current = next;
    setStatus(next);
  }, []);

  const readElapsedMs = useCallback(() => {
    const running = startedAtRef.current ? performance.now() - startedAtRef.current : 0;
    return elapsedMsRef.current + running;
  }, []);

  const tick = useCallback(() => {
    setElapsed(readElapsedMs() / 1000);
  }, [readElapsedMs]);

  const startTimer = useCallback(() => {
    startedAtRef.current = performance.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(tick, 100);
  }, [tick]);

  const pauseTimer = useCallback(() => {
    if (startedAtRef.current) {
      elapsedMsRef.current += performance.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsed(elapsedMsRef.current / 1000);
  }, []);

  const pushLevel = useCallback((value) => {
    setLevels((current) => [...current.slice(1), Math.min(1, Math.max(0.03, value))]);
  }, []);

  /**
   * Cut the currently buffered PCM at the end of the spoken sentence and
   * transcribe it on the server. Live cuts always land at a speech boundary
   * (lastVoiceCutIndex) — there is no fixed-duration cut. `final` takes
   * everything (session stop); `force` skips the minimum-length guard (pause
   * button).
   */
  const flushChunk = useCallback(({ final = false, force = false } = {}) => {
    const rate = contextRateRef.current || 0;
    if (!rate) return Promise.resolve();

    const total = chunkSamplesRef.current;
    if (total <= 0) return Promise.resolve();

    const seconds = total / rate;
    if (!final && !force && seconds < MIN_CHUNK_SEC) return Promise.resolve();

    if (final && seconds < MIN_TRANSCRIBE_SEC) {
      chunkBuffersRef.current = [];
      chunkSamplesRef.current = 0;
      chunkHasVoiceRef.current = false;
      return Promise.resolve();
    }

    // Silence: drop it without spending a transcription request. This also
    // stops the engine from being asked to transcribe an empty room.
    if (!final && !chunkHasVoiceRef.current) {
      chunkBuffersRef.current = [];
      chunkSamplesRef.current = 0;
      chunkStartSecRef.current += seconds;
      return Promise.resolve();
    }

    const merged = new Float32Array(total);
    let offset = 0;
    for (const block of chunkBuffersRef.current) {
      merged.set(block, offset);
      offset += block.length;
    }

    const minSamples = Math.ceil(rate * MIN_TRANSCRIBE_SEC);
    // Every live cut happens at a speech boundary — right after the last
    // voiced sample plus a short tail — never at a fixed time. Only `final`
    // (session stop) takes the whole remaining buffer as-is.
    const cut = final ? total : lastVoiceCutIndex(merged, rate, minSamples);

    const chunk = cut >= total ? merged : merged.slice(0, cut);
    const remainder = cut >= total ? null : merged.slice(cut);
    chunkBuffersRef.current = remainder && remainder.length ? [remainder] : [];
    chunkSamplesRef.current = remainder ? remainder.length : 0;
    // The remainder of a boundary cut is trailing silence by construction; the
    // flag is set again in onSamples as soon as new speech arrives.
    chunkHasVoiceRef.current = false;

    const startSec = chunkStartSecRef.current;
    const chunkSeconds = chunk.length / rate;
    chunkStartSecRef.current += chunkSeconds;

    if (chunkSeconds < MIN_TRANSCRIBE_SEC) return Promise.resolve();

    const runId = runIdRef.current;
    const languageHint = languageRef.current;

    pendingChunksRef.current += 1;
    setLiveBusy(pendingChunksRef.current);

    queueRef.current = queueRef.current.then(async () => {
      try {
        const audioBase64 = pcmToWavBase64(chunk, rate, 16000);
        const result = await transcribeAudio({
          audioBase64,
          mimeType: 'audio/wav',
          language: languageHint,
        });

        if (runId !== runIdRef.current) return;

        if (result?.engine) {
          liveEngineRef.current = result.engine;
          setLiveEngine(result.engine);
        }

        const incoming = (Array.isArray(result?.segments) ? result.segments : [])
          .map((segment) => {
            const text = String(segment?.text || '').trim();
            if (!text) return null;
            const relativeStart = Math.max(0, Number(segment.start) || 0);
            const relativeEnd = Math.max(Number(segment.end) || 0, relativeStart);
            return {
              id: newSegmentId(),
              speaker: 'You',
              start: startSec + relativeStart,
              end: startSec + relativeEnd,
              text,
              lang: segment.lang || languageHint,
            };
          })
          .filter(Boolean);

        if (incoming.length) {
          liveSegmentsRef.current = [...liveSegmentsRef.current, ...incoming];
          setSegments(liveSegmentsRef.current);
        }
      } catch {
        if (runId !== runIdRef.current) return;
        liveFailedRef.current = true;
        setLiveFailed(true);
        setNotice(
          'Live transcription paused — your audio is still being recorded and will be transcribed when you stop.',
        );
      } finally {
        pendingChunksRef.current = Math.max(0, pendingChunksRef.current - 1);
        setLiveBusy(pendingChunksRef.current);
      }
    });

    return queueRef.current;
  }, []);

  const startCaptureNodes = useCallback(
    async (stream, runId) => {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;

      const ctx = new Ctx();
      try {
        await ctx.resume();
      } catch {
        /* already running */
      }

      // The capture may have been discarded while the context was resuming.
      if (runId !== runIdRef.current) {
        ctx.close().catch(() => {});
        return false;
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;

      // A zero-gain path to the destination keeps the graph pulling samples
      // without echoing the microphone back to the speakers.
      const mute = ctx.createGain();
      mute.gain.value = 0;
      mute.connect(ctx.destination);

      source.connect(analyser);
      analyser.connect(mute);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
      muteGainRef.current = mute;
      contextRateRef.current = ctx.sampleRate;

      const onSamples = (block) => {
        if (pausedRef.current) return;
        const copy = new Float32Array(block.length);
        copy.set(block);
        chunkBuffersRef.current.push(copy);
        chunkSamplesRef.current += copy.length;

        let sum = 0;
        for (let i = 0; i < copy.length; i += 1) sum += copy[i] * copy[i];
        if (Math.sqrt(sum / copy.length) > VOICE_RMS) {
          lastVoiceAtRef.current = performance.now();
          chunkHasVoiceRef.current = true;
        }
      };

      let installed = false;
      if (ctx.audioWorklet) {
        try {
          const url = URL.createObjectURL(
            new Blob([WORKLET_CODE], { type: 'application/javascript' }),
          );
          try {
            await ctx.audioWorklet.addModule(url);
          } finally {
            URL.revokeObjectURL(url);
          }
          if (runId !== runIdRef.current) {
            ctx.close().catch(() => {});
            return false;
          }
          const node = new AudioWorkletNode(ctx, 'shabd-pcm');
          node.port.onmessage = (event) => onSamples(event.data);
          source.connect(node);
          node.connect(mute);
          processorRef.current = node;
          installed = true;
        } catch {
          installed = false;
        }
      }

      if (!installed) {
        const node = ctx.createScriptProcessor(4096, 1, 1);
        node.onaudioprocess = (event) => onSamples(event.inputBuffer.getChannelData(0));
        source.connect(node);
        node.connect(mute);
        processorRef.current = node;
      }

      const data = new Uint8Array(analyser.fftSize);
      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const value = (data[i] - 128) / 128;
          sum += value * value;
        }
        const rms = Math.sqrt(sum / data.length);
        const now = performance.now();
        if (now - lastLevelAtRef.current > 55) {
          lastLevelAtRef.current = now;
          pushLevel(Math.pow(Math.min(1, rms * 3.1), 0.72));
        }
      };
      rafRef.current = requestAnimationFrame(loop);

      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
      flushIntervalRef.current = window.setInterval(() => {
        if (pausedRef.current) return;
        const rate = contextRateRef.current || 0;
        if (!rate) return;
        const seconds = chunkSamplesRef.current / rate;
        if (seconds < MIN_CHUNK_SEC) return;
        const quietFor = performance.now() - lastVoiceAtRef.current;
        // Sentence-break detection: when the speaker takes a short break
        // (PAUSE_MS of quiet after voice), close the buffered chunk at the
        // speech boundary and transcribe it now. There is no fixed 5 s cut;
        // FAILSAFE_CHUNK_SEC only bounds memory if no pause is ever detected.
        if (quietFor >= PAUSE_MS || seconds >= FAILSAFE_CHUNK_SEC) {
          void flushChunk();
        }
      }, 250);

      return true;
    },
    [flushChunk, pushLevel],
  );

  const startMediaRecorder = useCallback((stream) => {
    const mimeType = supportedMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    return recorder;
  }, []);

  const stopMediaRecorder = useCallback(
    () =>
      new Promise((resolve) => {
        const recorder = recorderRef.current;
        if (!recorder || recorder.state === 'inactive') {
          recorderRef.current = null;
          resolve(null);
          return;
        }

        const finish = () => {
          recorderRef.current = null;
          const type = recorder.mimeType || 'audio/webm';
          const blob = chunksRef.current.length
            ? new Blob(chunksRef.current, { type })
            : null;
          chunksRef.current = [];
          resolve(blob);
        };

        recorder.onstop = finish;
        recorder.onerror = finish;
        try {
          recorder.stop();
        } catch {
          finish();
        }
      }),
    [],
  );

  const stopCapture = useCallback(async () => {
    pausedRef.current = true;
    pauseTimer();

    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
      flushIntervalRef.current = null;
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;

    const blob = await stopMediaRecorder();

    const processor = processorRef.current;
    processorRef.current = null;
    if (processor) {
      try {
        if (processor.port) processor.port.onmessage = null;
      } catch {
        /* ignore */
      }
      try {
        processor.onaudioprocess = null;
      } catch {
        /* ignore */
      }
      try {
        processor.disconnect();
      } catch {
        /* ignore */
      }
    }

    if (muteGainRef.current) {
      try {
        muteGainRef.current.disconnect();
      } catch {
        /* ignore */
      }
      muteGainRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        /* ignore */
      }
      sourceNodeRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        await audioCtxRef.current.close();
      } catch {
        /* already closed */
      }
      audioCtxRef.current = null;
    }

    return blob;
  }, [pauseTimer, stopMediaRecorder]);

  const resetLiveState = useCallback(() => {
    chunkBuffersRef.current = [];
    chunkSamplesRef.current = 0;
    chunkStartSecRef.current = 0;
    chunkHasVoiceRef.current = false;
    liveSegmentsRef.current = [];
    liveEngineRef.current = '';
    liveFailedRef.current = false;
    pendingChunksRef.current = 0;
    queueRef.current = Promise.resolve();
    segmentsRef.current = [];
    lastVoiceAtRef.current = performance.now();
    setSegments([]);
    setLiveBusy(0);
    setLiveEngine('');
    setLiveFailed(false);
  }, []);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    pausedRef.current = true;
    stopPromiseRef.current = stopCapture();
    setPhase('idle');
    resetLiveState();
    elapsedMsRef.current = 0;
    setElapsed(0);
    setLevels(idleLevels());
    setNotice(null);
    setMicLabel(null);
  }, [resetLiveState, setPhase, stopCapture]);

  const start = useCallback(async () => {
    if (phaseRef.current === 'recording' || phaseRef.current === 'requesting') return;

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    resetLiveState();
    elapsedMsRef.current = 0;
    setElapsed(0);
    setLevels(idleLevels());
    setNotice(null);
    setMicLabel(null);
    setPhase('requesting');

    // A discard can still be tearing down the previous capture; wait for it so
    // it cannot close the new AudioContext or drop the new stream.
    try {
      await stopPromiseRef.current;
    } catch {
      /* teardown already failed; continue with a fresh capture */
    }
    if (runId !== runIdRef.current) return;

    let stream;
    let request = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');

      request = navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      let timer = null;
      const timeout = new Promise((_, reject) => {
        timer = window.setTimeout(() => reject(new Error('timeout')), MIC_TIMEOUT_MS);
      });

      try {
        stream = await Promise.race([request, timeout]);
      } finally {
        if (timer) clearTimeout(timer);
      }

      if (runId !== runIdRef.current) {
        stream?.getTracks().forEach((track) => track.stop());
        return;
      }
    } catch (error) {
      if (runId !== runIdRef.current) return;
      // A late getUserMedia resolution must not keep the microphone open.
      request
        ?.then((late) => {
          if (runId !== runIdRef.current || !streamRef.current) {
            late.getTracks().forEach((track) => track.stop());
          }
        })
        .catch(() => {});
      setPhase('idle');
      if (error?.name === 'NotAllowedError' || error?.message === 'unsupported') {
        setNotice(
          'Microphone access is required to record. Allow the microphone in your browser, then try again.',
        );
      } else {
        setNotice(
          'Could not reach the microphone. Check that a device is connected, then try again.',
        );
      }
      return;
    }

    streamRef.current = stream;
    const track = stream.getAudioTracks()[0];
    if (track?.label) setMicLabel(track.label.replace(/\s*\(.*?\)\s*/g, '').trim());

    try {
      startMediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((item) => item.stop());
      streamRef.current = null;
      setPhase('idle');
      setNotice('This browser cannot record audio. Try Chrome, Edge, or Firefox.');
      return;
    }

    pausedRef.current = false;
    let liveReady = false;
    try {
      liveReady = await startCaptureNodes(stream, runId);
    } catch {
      liveReady = false;
    }

    if (runId !== runIdRef.current) return;

    startTimer();
    setPhase('recording');
    if (!liveReady) {
      setNotice(
        'Live transcription is unavailable in this browser — your audio is still being recorded and will be transcribed when you stop.',
      );
    }
  }, [resetLiveState, setPhase, startCaptureNodes, startMediaRecorder, startTimer]);

  const pause = useCallback(() => {
    if (phaseRef.current !== 'recording') return;
    pausedRef.current = true;
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') {
      try {
        recorder.pause();
      } catch {
        /* ignore */
      }
    }
    pauseTimer();
    void flushChunk({ force: true });
    setPhase('paused');
  }, [flushChunk, pauseTimer, setPhase]);

  const resume = useCallback(() => {
    if (phaseRef.current !== 'paused') return;
    const recorder = recorderRef.current;
    if (recorder?.state === 'paused') {
      try {
        recorder.resume();
      } catch {
        /* ignore */
      }
    }
    pausedRef.current = false;
    lastVoiceAtRef.current = performance.now();
    startTimer();
    setPhase('recording');
  }, [setPhase, startTimer]);

  const stop = useCallback(async () => {
    const empty = {
      audioBase64: null,
      mimeType: 'audio/wav',
      durationSec: 0,
      language: languageRef.current,
      sampleRate: 16000,
      liveSegments: liveSegmentsRef.current.slice(),
      liveEngine: liveEngineRef.current,
      liveFailed: liveFailedRef.current,
    };

    if (phaseRef.current !== 'recording' && phaseRef.current !== 'paused') {
      return empty;
    }

    const durationSec = Math.max(1, Math.round(readElapsedMs() / 1000));
    const blob = await stopCapture();

    // Flush the tail of the recording and wait for every chunk in flight so the
    // transcript is complete before we save it.
    await flushChunk({ final: true });
    await queueRef.current;

    const liveSegments = liveSegmentsRef.current.slice();
    const liveEngine = liveEngineRef.current;
    const liveFailed = liveFailedRef.current;

    runIdRef.current += 1;
    setPhase('idle');
    setLiveBusy(0);

    const base = {
      mimeType: 'audio/wav',
      durationSec,
      language: languageRef.current,
      sampleRate: 16000,
      liveSegments,
      liveEngine,
      liveFailed,
    };

    if (!blob || blob.size < MIN_AUDIO_BYTES) {
      return { ...base, audioBase64: null };
    }

    const audioBase64 = await blobToWavBase64(blob, 16000);
    return { ...base, audioBase64 };
  }, [flushChunk, readElapsedMs, setPhase, stopCapture]);

  const setLanguage = useCallback((next) => {
    if (!LANGUAGES[next]) return;
    languageRef.current = next;
    setLanguageState(next);
  }, []);

  useEffect(
    () => () => {
      runIdRef.current += 1;
      pauseTimer();
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {
          /* ignore */
        }
      }
      if (processorRef.current) {
        try {
          processorRef.current.disconnect();
        } catch {
          /* ignore */
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {
          /* ignore */
        }
      }
    },
    [pauseTimer],
  );

  return {
    status,
    elapsed,
    levels,
    segments,
    notice,
    language,
    micLabel,
    liveBusy,
    liveEngine,
    liveFailed,
    setLanguage,
    start,
    pause,
    resume,
    stop,
    reset,
    hasContent: segments.length > 0,
  };
}
