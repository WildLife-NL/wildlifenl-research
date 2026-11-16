// One experiment by ID, shown at once from router state when present and refreshed from the API so deep links work
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getExperiments } from '../services/experimentService';
import { Experiment } from '../types/experiment';

interface UseExperimentResult {
  experiment: Experiment | null;
  loading: boolean;
  notFound: boolean;
  error: string | null;
  reload: () => void;
  setExperiment: (experiment: Experiment) => void;
}

export const useExperiment = (id: string | undefined): UseExperimentResult => {
  const location = useLocation();
  const stateExperiment: Experiment | undefined =
    location.state?.experiment?.ID && location.state.experiment.ID === id ? location.state.experiment : undefined;

  const [experiment, setExperiment] = useState<Experiment | null>(stateExperiment ?? null);
  const [loading, setLoading] = useState<boolean>(!stateExperiment);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<number>(0);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setError(null);

    getExperiments()
      .then((experiments) => {
        if (cancelled) return;
        const fresh = experiments.find((candidate) => candidate.ID === id);
        if (fresh) {
          setExperiment(fresh);
          setNotFound(false);
        } else {
          setExperiment(null);
          setNotFound(true);
        }
      })
      .catch((fetchError) => {
        console.error('Error fetching experiment:', fetchError);
        if (!cancelled) setError('Could not load this experiment from the WildlifeNL API. Check your connection and try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { experiment, loading, notFound, error, reload, setExperiment };
};
