import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icons';
import { cx } from '../lib/format';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  busy = false,
  tone = 'danger',
  onConfirm,
  onClose,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => cancelRef.current?.focus(), 40);
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-5">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[430px] animate-fade-up rounded-xl2 border border-line bg-canvas p-6 shadow-lift"
      >
        <div className="flex items-start gap-3.5">
          <span
            className={cx(
              'grid h-9 w-9 shrink-0 place-items-center rounded-full',
              tone === 'danger' ? 'bg-dangerSoft text-danger' : 'bg-paper text-graphite',
            )}
          >
            <Icon name={tone === 'danger' ? 'alert' : 'info'} size={17} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-[24px] leading-tight tracking-[-0.01em] text-ink">{title}</h2>
            {description && (
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{description}</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button ref={cancelRef} type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={cx('btn', tone === 'danger' ? 'btn-danger' : 'btn-ink')}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
