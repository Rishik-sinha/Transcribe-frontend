// Small formatting helpers shared across the workspace.

export function cx(...args) {
  return args.filter(Boolean).join(' ');
}

export function formatClock(seconds = 0) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** 4:12 · 1:04:12 */
export function formatDuration(seconds = 0) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function timecode(seconds = 0) {
  return formatClock(seconds);
}

export function wordCount(text = '') {
  const matches = String(text).match(/[\p{L}\p{N}'’]+/gu);
  return matches ? matches.length : 0;
}

export function countWords(segments = []) {
  return segments.reduce((total, segment) => total + wordCount(segment.text), 0);
}

export function formatRelative(iso) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Math.max(0, Date.now() - then);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })} · ${d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function srtTime(seconds = 0) {
  const s = Math.max(0, seconds);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(Math.floor(s % 60)).padStart(2, '0');
  const ms = String(Math.round((s % 1) * 1000)).padStart(3, '0');
  return `${hh}:${mm}:${ss},${ms}`;
}

export function slugify(value = '') {
  return (
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'transcript'
  );
}

export function plainText(session) {
  const header = [session.title, formatDate(session.createdAt)];
  return [
    header.filter(Boolean).join('  ·  '),
    '',
    ...(session.segments || []).map(
      (segment) => `[${timecode(segment.start)}] ${segment.speaker || 'You'}: ${segment.text}`,
    ),
  ].join('\n');
}

export function toSrt(session) {
  return (session.segments || [])
    .map((segment, index) => {
      return [
        String(index + 1),
        `${srtTime(segment.start)} --> ${srtTime(Math.max(segment.end, segment.start + 1))}`,
        segment.text,
        '',
      ].join('\n');
    })
    .join('\n');
}

export function toMarkdown(session) {
  const lines = [`# ${session.title || 'Untitled session'}`, ''];
  lines.push(
    `_${formatDateTime(session.createdAt)} · ${formatDuration(session.durationSec)} · ${countWords(
      session.segments,
    )} words_`,
    '',
  );
  (session.segments || []).forEach((segment) => {
    lines.push(`**${segment.speaker || 'You'}** · \`${timecode(segment.start)}\``);
    lines.push('');
    lines.push(segment.text);
    lines.push('');
  });
  if (session.notes) {
    lines.push('---', '', '### Notes', '', session.notes);
  }
  return lines.join('\n');
}

export function downloadFile(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  }
}
