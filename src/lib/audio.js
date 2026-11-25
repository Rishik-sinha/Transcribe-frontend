// Browser-side audio helpers: turn a MediaRecorder blob into a 16 kHz mono
// 16-bit PCM WAV, base64-encoded, which is the format the backend's AI
// providers reliably accept (Gemini does not accept webm/opus inline data).

function encodeWavBase64(samples, sampleRate) {
  const dataLength = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** Linear resample of mono float samples. Good enough for speech recognition. */
function resample(samples, sourceRate, targetRate) {
  if (sourceRate === targetRate) return samples;
  const ratio = sourceRate / targetRate;
  const length = Math.max(1, Math.floor(samples.length / ratio));
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const position = i * ratio;
    const index = Math.floor(position);
    const fraction = position - index;
    const a = samples[index] ?? 0;
    const b = samples[index + 1] ?? a;
    out[i] = a + (b - a) * fraction;
  }
  return out;
}

/**
 * Encode raw mono PCM samples captured from an AudioContext as a 16 kHz mono
 * WAV, base64-encoded. Used to stream short chunks to the backend while the
 * user is still speaking.
 */
export function pcmToWavBase64(samples, sourceRate, targetRate = 16000) {
  return encodeWavBase64(resample(samples, sourceRate, targetRate), targetRate);
}

/**
 * Decode any browser-supported audio blob and re-encode it as 16 kHz mono WAV.
 * Returns base64 of the WAV file (without the data: prefix).
 */
export async function blobToWavBase64(blob, targetSampleRate = 16000) {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    const offline = new OfflineAudioContext(
      1,
      Math.max(1, Math.ceil(decoded.duration * targetSampleRate)),
      targetSampleRate,
    );
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return encodeWavBase64(rendered.getChannelData(0), targetSampleRate);
  } finally {
    ctx.close().catch(() => {});
  }
}
