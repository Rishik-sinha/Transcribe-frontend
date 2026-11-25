import { useCallback, useEffect, useRef, useState } from 'react';
import { languageOf } from '../lib/languages';

/**
 * Read-aloud via the browser's speech synthesiser. Kept segment-by-segment so
 * the transcript can highlight whatever is being spoken.
 */
export function useNarration(segments = [], language = 'mixed') {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [active, setActive] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const rateRef = useRef(1);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setActive(null);
    setSpeaking(false);
  }, [supported]);

  const play = useCallback(
    (rate = 1) => {
      if (!supported) return false;
      rateRef.current = rate;
      window.speechSynthesis.cancel();
      const usable = segments.filter((segment) => segment.text?.trim());
      if (!usable.length) return false;

      const voiceLang = languageOf(language).voice;
      setSpeaking(true);
      setActive(0);

      usable.forEach((segment, index) => {
        const utterance = new SpeechSynthesisUtterance(segment.text);
        utterance.lang = voiceLang;
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.onstart = () => setActive(index);
        utterance.onerror = () => {
          setActive(null);
          setSpeaking(false);
        };
        if (index === usable.length - 1) {
          utterance.onend = () => {
            setActive(null);
            setSpeaking(false);
          };
        }
        window.speechSynthesis.speak(utterance);
      });

      return true;
    },
    [segments, supported, language],
  );

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { supported, speaking, active, play, stop };
}
