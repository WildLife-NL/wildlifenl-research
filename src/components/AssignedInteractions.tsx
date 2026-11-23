// Interactions the app gave one of an experiment's questionnaires, with who reported each one and which questionnaire it got
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Experiment } from '../types/experiment';
import { Interaction } from '../types/interaction';
import { Questionnaire } from '../types/questionnaire';
import { getInteractionsWithQuestionnaireByExperimentID } from '../services/interactionService';
import { NOT_ON_THIS_API } from '../services/problemDetails';
import { formatDateTime, pluralize } from '../utils/format';
import { LoadingState } from './ui/Layout';
import SortHeader, { nextSort, SortState } from './ui/SortHeader';

type SortKey = 'timestamp' | 'user' | 'questionnaire';

const sortValue = (interaction: Interaction, key: SortKey): string | number => {
  if (key === 'timestamp') return new Date(interaction.timestamp).getTime() || 0;
  if (key === 'user') return interaction.user?.name?.toLowerCase() ?? '';
  return interaction.questionnaire?.name?.toLowerCase() ?? '';
};

interface AssignedInteractionsProps {
  experiment: Experiment;
  questionnaires: Questionnaire[];
}

const AssignedInteractions: React.FC<AssignedInteractionsProps> = ({ experiment, questionnaires }) => {
  const [interactions, setInteractions] = useState<Interaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionnaireFilter, setQuestionnaireFilter] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<SortState<SortKey> | null>({ key: 'timestamp', direction: 'descending' });

  useEffect(() => {
    let cancelled = false;
    getInteractionsWithQuestionnaireByExperimentID(experiment.ID)
      .then((rows) => !cancelled && setInteractions(rows))
      .catch((loadError) => {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : '';
        setError(
          message === NOT_ON_THIS_API
            ? 'This list is not available on this WildlifeNL API yet.'
            : `Couldn't load these interactions. ${message || 'Reload the page to try again.'}`
        );
      });
    return () => {
      cancelled = true;
    };
  }, [experiment.ID]);

  const visible = useMemo(() => {
    const filtered = (interactions ?? []).filter(
      (interaction) => questionnaireFilter === 'All' || interaction.questionnaire?.ID === questionnaireFilter
    );
    if (sortConfig) {
      const direction = sortConfig.direction === 'ascending' ? 1 : -1;
      filtered.sort((a, b) => {
        const aValue = sortValue(a, sortConfig.key);
        const bValue = sortValue(b, sortConfig.key);
        if (aValue < bValue) return -direction;
        if (aValue > bValue) return direction;
        return 0;
      });
    }
    return filtered;
  }, [interactions, questionnaireFilter, sortConfig]);

  const onSort = (key: SortKey) => setSortConfig((current) => nextSort(current, key));

  return (
    <section className="rc-card rc-card--flush" aria-labelledby="assigned-interactions-title" data-testid="assigned-interactions">
      <div className="rc-card__bar">
        <h2 id="assigned-interactions-title" className="rc-section-title">
          Interactions that got a questionnaire
        </h2>
        {interactions && <span className="rc-muted">{pluralize(visible.length, 'interaction')}</span>}
        {interactions && interactions.length > 0 && questionnaires.length > 1 && (
          <label className="rc-inline-select rc-toolbar__end">
            <span className="rc-inline-select__label">Questionnaire</span>
            <select value={questionnaireFilter} onChange={(event) => setQuestionnaireFilter(event.target.value)} data-testid="assigned-questionnaire-filter">
              <option value="All">All</option>
              {questionnaires.map((questionnaire) => (
                <option key={questionnaire.ID} value={questionnaire.ID}>
                  {questionnaire.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error ? (
        <p className="rc-hub__card-message rc-error">{error}</p>
      ) : !interactions ? (
        <LoadingState label="Loading interactions…" />
      ) : interactions.length === 0 ? (
        <p className="rc-hub__card-message rc-muted">No interaction in this experiment has been given one of its questionnaires yet.</p>
      ) : visible.length === 0 ? (
        <p className="rc-hub__card-message rc-muted">No interaction has been given this questionnaire yet.</p>
      ) : (
        <div className="rc-table-wrap">
          <table className="rc-table rc-table--stack" data-testid="assigned-interactions-table">
            <caption className="rc-visually-hidden">Interactions that got one of this experiment's questionnaires</caption>
            <thead>
              <tr>
                <SortHeader label="Reported" sortKey="timestamp" sort={sortConfig} onSort={onSort} />
                <th scope="col">Interaction</th>
                <SortHeader label="Reported by" sortKey="user" sort={sortConfig} onSort={onSort} />
                <SortHeader label="Questionnaire" sortKey="questionnaire" sort={sortConfig} onSort={onSort} />
              </tr>
            </thead>
            <tbody>
              {visible.map((interaction) => {
                const assigned = interaction.questionnaire!;
                const full = questionnaires.find((candidate) => candidate.ID === assigned.ID);
                const userName = interaction.user?.name;
                const unnamed = !userName || userName === interaction.user?.ID;
                return (
                  <tr key={interaction.ID} data-testid={`assigned-interaction-${interaction.ID}`}>
                    <td className="rc-table__lead rc-table__nowrap">{formatDateTime(interaction.timestamp)}</td>
                    <td data-label="Interaction">
                      <span>
                        {interaction.type?.name ?? '—'}
                        {interaction.species?.commonName && <span className="rc-muted"> · {interaction.species.commonName}</span>}
                      </span>
                    </td>
                    <td data-label="Reported by" className={unnamed ? 'rc-mono rc-small' : undefined}>
                      {userName || interaction.user?.ID || '—'}
                    </td>
                    <td data-label="Questionnaire">
                      <span>
                        <Link to={`/questionnaire/${assigned.ID}`} state={{ questionnaire: full, experiment }} className="rc-name-link">
                          {assigned.name}
                        </Link>
                        {assigned.identifier && <span className="rc-mono rc-muted rc-small"> {assigned.identifier}</span>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="rc-card__note">
        Sightings, damage and collisions the app followed up with one of this experiment's questionnaires. Times are in your local time. The Interactions
        export on the Data tab has every field of these reports.
      </p>
    </section>
  );
};

export default AssignedInteractions;
