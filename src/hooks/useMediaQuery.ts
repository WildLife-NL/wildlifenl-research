// Live result of a CSS media query, always false where matchMedia does not exist such as jsdom
import { useCallback, useSyncExternalStore } from 'react';

const canMatch = (): boolean => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!canMatch()) return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query]
  );

  const getSnapshot = () => (canMatch() ? window.matchMedia(query).matches : false);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
};

// Phone layout below 720px, the breakpoint used by every screen
export const PHONE_QUERY = '(max-width: 719px)';
