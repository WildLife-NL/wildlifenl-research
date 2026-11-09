// Small page-level hooks: the document title, a one-time flash banner passed through navigation and the leave-page guard
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface Flash {
  tone: 'success' | 'info' | 'error';
  title: string;
  text?: string;
}

// Sets the browser tab title, so screen reader users hear where they landed
export const useDocumentTitle = (title: string | null | undefined): void => {
  useEffect(() => {
    document.title = title ? `${title} · ResearchConnect` : 'ResearchConnect · WildlifeNL';
  }, [title]);
};

// Reads location.state.flash once and removes it from history, so a refresh does not show it again
export const useFlash = (): [Flash | null, () => void] => {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState<Flash | null>(() => location.state?.flash ?? null);

  useEffect(() => {
    if (!location.state?.flash) return;
    setFlash(location.state.flash);
    const { flash: _shown, ...rest } = location.state;
    navigate(`${location.pathname}${location.search}`, { replace: true, state: Object.keys(rest).length ? rest : null });
  }, [location, navigate]);

  return [flash, () => setFlash(null)];
};

// Browser prompt before closing or reloading the tab while there are unsaved changes
export const useBeforeUnload = (when: boolean): void => {
  useEffect(() => {
    if (!when) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when]);
};
