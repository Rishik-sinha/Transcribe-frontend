import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Icon } from './icons';
import { cx } from '../lib/format';

const ToastContext = createContext({ push: () => {} });

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const counter = useRef(0);

  const push = useCallback((message, options = {}) => {
    const id = (counter.current += 1);
    const tone = options.tone || 'default';
    setItems((current) => [...current.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, options.duration || 3400);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex w-[min(360px,calc(100vw-2.5rem))] flex-col items-end gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cx(
              'pointer-events-auto flex w-full animate-toast-in items-start gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-[12.5px] leading-snug shadow-lift',
              item.tone === 'error'
                ? 'border-white/10 bg-night text-onNight'
                : 'border-white/10 bg-ink text-onNight',
            )}
          >
            <Icon
              name={item.tone === 'error' ? 'alert' : 'check'}
              size={15}
              className={cx('mt-[1px] shrink-0', item.tone === 'error' ? 'text-dangerOnDark' : 'text-accentOnDark')}
            />
            <span className="flex-1">{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
