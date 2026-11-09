import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Experiment.css';
import { Questionnaire } from '../types/questionnaire';
import { Experiment } from '../types/experiment';
import { InteractionType } from '../types/interactiontype';
import { getQuestionnaireByExperimentID } from '../services/questionnaireService';
import { getAllInteractions } from '../services/interactionTypeService';
import { useCurrentUser } from '../context/UserContext';
import ExperimentPage from '../components/ExperimentPage';
import Banner from '../components/ui/Banner';
import Button, { ButtonLink } from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { EmptyState, LoadingState } from '../components/ui/Layout';
import SortHeader, { nextSort, SortState } from '../components/ui/SortHeader';
import { getExperimentPermissions } from '../utils/experimentPermissions';
import { formatCount, formatDate } from '../utils/format';

type SortKey = 'name' | 'identifier' | 'interactionType' | 'questions';

const sortValue = (questionnaire: Questionnaire, key: SortKey): string | number => {
  if (key === 'questions') return questionnaire.questions?.length ?? 0;
  if (key === 'interactionType') return questionnaire.interactionType?.name?.toLowerCase() ?? '';
  return (questionnaire[key] ?? '').toLowerCase();
};

// Questionnaires tab of the hub: filter, search and open, or start a new one while the experiment is upcoming
const QuestionnaireList: React.FC<{ experiment: Experiment }> = ({ experiment }) => {
  const user = useCurrentUser();
  const permissions = getExperimentPermissions(experiment, user);

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [interactionTypes, setInteractionTypes] = useState<InteractionType[]>([]);
  const [selectedInteractionType, setSelectedInteractionType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortState<SortKey> | null>({ key: 'name', direction: 'ascending' });

  useEffect(() => {
    let cancelled = false;
    getQuestionnaireByExperimentID(experiment.ID)
      .then((fetched) => !cancelled && setQuestionnaires(fetched ?? []))
      .catch((error) => {
        console.error('Error fetching questionnaires:', error);
        if (!cancelled) setLoadError(true);
      })
      .finally(() => !cancelled && setIsLoading(false));
    getAllInteractions()
      .then((types) => !cancelled && setInteractionTypes(types))
      .catch((error) => console.error('Failed to fetch interaction types:', error));
    return () => {
      cancelled = true;
    };
  }, [experiment.ID]);

  const visible = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = questionnaires.filter(
      (questionnaire) =>
        (selectedInteractionType === 'All' || questionnaire.interactionType?.name === selectedInteractionType) &&
        (!query || questionnaire.name.toLowerCase().includes(query) || (questionnaire.identifier ?? '').toLowerCase().includes(query))
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
  }, [questionnaires, selectedInteractionType, searchQuery, sortConfig]);

  const newReason = permissions.canEdit
    ? undefined
    : permissions.isOwner
    ? 'Questionnaires can only be added while the experiment is upcoming.'
    : `${permissions.reasons.edit}.`;

  // An unavailable action is a real button, a link could still open in a new tab
  const newButton = permissions.canEdit ? (
    <ButtonLink to={`/questionnairecreation/${experiment.ID}`} state={{ experiment }} variant="primary" icon="plus" data-testid="add-questionnaire-button">
      New questionnaire
    </ButtonLink>
  ) : (
    <Button variant="primary" icon="plus" unavailable aria-describedby="new-questionnaire-reason" data-testid="add-questionnaire-button">
      New questionnaire
    </Button>
  );

  if (isLoading) return <LoadingState label="Loading questionnaires…" testId="loading-container" />;

  if (loadError) {
    return (
      <Banner tone="error" title="Couldn't load the questionnaires.">
        Reload the page to try again.
      </Banner>
    );
  }

  if (questionnaires.length === 0) {
    return (
      <EmptyState title="No questionnaires yet" action={newButton}>
        A questionnaire is what app users fill in after a sighting, damage or collision report.
        {permissions.canEdit ? ` Add one before ${formatDate(experiment.start)}.` : ` ${newReason}`}
      </EmptyState>
    );
  }

  return (
    <div className="rc-stack" data-testid="questionnaire-dashboard-container">
      <div className="rc-toolbar" data-testid="filters-container">
        <label className="rc-inline-select">
          <span className="rc-inline-select__label">Interaction type</span>
          <select value={selectedInteractionType} onChange={(event) => setSelectedInteractionType(event.target.value)}>
            <option value="All">All</option>
            {interactionTypes.map((type) => (
              <option key={type.ID} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        <label className="rc-search">
          <Icon name="search" />
          <span className="rc-visually-hidden">Search questionnaires</span>
          <input
            type="search"
            className="rc-input"
            placeholder="Search by name"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            data-testid="search-input"
          />
        </label>
        <div className="rc-toolbar__end">{newButton}</div>
      </div>
      {newReason && (
        <p id="new-questionnaire-reason" className="rc-help rc-hub__toolbar-note">
          {newReason}
        </p>
      )}

      <div className="rc-card rc-card--flush">
        <div className="rc-table-wrap" data-testid="table-container">
          <table className="rc-table rc-table--stack" data-testid="questionnaires-table">
            <caption className="rc-visually-hidden">Questionnaires of this experiment</caption>
            <thead>
              <tr>
                <SortHeader label="Name" sortKey="name" sort={sortConfig} onSort={(key) => setSortConfig((current) => nextSort(current, key))} />
                <SortHeader label="Internal name" sortKey="identifier" sort={sortConfig} onSort={(key) => setSortConfig((current) => nextSort(current, key))} />
                <SortHeader label="Interaction type" sortKey="interactionType" sort={sortConfig} onSort={(key) => setSortConfig((current) => nextSort(current, key))} />
                <SortHeader label="Questions" sortKey="questions" sort={sortConfig} onSort={(key) => setSortConfig((current) => nextSort(current, key))} numeric />
              </tr>
            </thead>
            <tbody>
              {visible.map((questionnaire) => {
                const questionCount = questionnaire.questions?.length ?? 0;
                return (
                  <tr key={questionnaire.ID} data-testid={`questionnaire-row-${questionnaire.ID}`}>
                    <td className="rc-table__lead rc-table__name">
                      <Link to={`/questionnaire/${questionnaire.ID}`} state={{ questionnaire, experiment }} className="rc-name-link">
                        {questionnaire.name}
                      </Link>
                    </td>
                    <td data-label="Internal name" className="rc-mono rc-small">
                      {questionnaire.identifier || <span className="rc-muted">—</span>}
                    </td>
                    <td data-label="Interaction type">{questionnaire.interactionType?.name ?? '—'}</td>
                    <td data-label="Questions" className="rc-table__num">
                      {questionCount === 0 ? <span className="rc-hub__warn">0 · add questions</span> : formatCount(questionCount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && <p className="rc-card__note">No questionnaires match these filters.</p>}
      </div>
    </div>
  );
};

const QuestionnaireDashboard: React.FC = () => (
  <ExperimentPage activeTab="questionnaires">{(experiment) => <QuestionnaireList key={experiment.ID} experiment={experiment} />}</ExperimentPage>
);

export default QuestionnaireDashboard;
