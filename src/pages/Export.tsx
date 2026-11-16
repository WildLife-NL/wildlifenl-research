import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getExperiments } from '../services/experimentService';
import { addResponseCounts, getResponsesByExperimentID } from '../services/responseService';
import { RateLimitError } from '../services/problemDetails';
import { getConveyancesByExperimentID } from '../services/conveyanceService';
import { getInteractionsByExperimentID } from '../services/interactionService';
import { getAllLivingLabs } from '../services/livingLabService';
import { getAnimalLocationsInLivingLab } from '../services/animalService';
import { loadDetectionRows, loadQuestionnaireExports, loadUserLocationRows, QuestionnaireExports } from '../services/exportService';
import { Experiment } from '../types/experiment';
import { Questionnaire } from '../types/questionnaire';
import { LivingLab } from '../types/livinglab';
import { useCurrentUser } from '../context/UserContext';
import { useDocumentTitle } from '../hooks/usePageChrome';
import ExportPreviewDialog, { useExportPreview } from '../components/ExportPreviewDialog';
import ResponseCountsBanner from '../components/ResponseCountsBanner';
import Banner from '../components/ui/Banner';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { Field, LoadingState, PageHeader, SegmentedControl } from '../components/ui/Layout';
import SortHeader, { nextSort, SortState } from '../components/ui/SortHeader';
import StatusChip from '../components/ui/StatusChip';
import { exportFileName } from '../utils/csv';
import { getStatus } from '../utils/experimentStatus';
import { formatCount, formatDate, formatPeriod, pluralize, slugify } from '../utils/format';
import '../styles/Export.css';

type Scope = 'mine' | 'everyone';
type SortKey = 'name' | 'responses' | 'messageActivity';
type Expansion = QuestionnaireExports | 'loading' | 'error';

// Previews and downloads for experiment data and for animal data in a living lab
const Export: React.FC = () => {
  const loggedInUser = useCurrentUser();
  useDocumentTitle('Export');
  const { preview, openPreview, closePreview } = useExportPreview();

  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [scope, setScope] = useState<Scope>('mine');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortState<SortKey> | null>({ key: 'name', direction: 'ascending' });
  const [expanded, setExpanded] = useState<Record<string, Expansion>>({});
  const [countsRateLimit, setCountsRateLimit] = useState<RateLimitError | null>(null);
  const [retryingCounts, setRetryingCounts] = useState<boolean>(false);

  const [livingLabs, setLivingLabs] = useState<LivingLab[]>([]);
  const [selectedLabID, setSelectedLabID] = useState<string>('');
  const [animalDataStartDate, setAnimalDataStartDate] = useState<string>('');
  const [animalDataEndDate, setAnimalDataEndDate] = useState<string>('');
  const [animalError, setAnimalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const counted = await addResponseCounts(await getExperiments());
        if (cancelled) return;
        setExperiments(counted.experiments);
        setCountsRateLimit(counted.rateLimit);
      } catch (error) {
        console.error('Error fetching experiments:', error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    getAllLivingLabs()
      .then(setLivingLabs)
      .catch((error) => console.error('Error fetching living labs:', error));
  }, []);

  const visibleExperiments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = experiments.filter((exp) => {
      if (scope === 'mine' && loggedInUser && exp.user?.ID !== loggedInUser.ID) return false;
      return !query || exp.name.toLowerCase().includes(query);
    });
    if (sortConfig) {
      const direction = sortConfig.direction === 'ascending' ? 1 : -1;
      filtered.sort((a, b) => {
        const aValue = sortConfig.key === 'name' ? a.name.toLowerCase() : a[sortConfig.key] ?? 0;
        const bValue = sortConfig.key === 'name' ? b.name.toLowerCase() : b[sortConfig.key] ?? 0;
        if (aValue < bValue) return -direction;
        if (aValue > bValue) return direction;
        return 0;
      });
    }
    return filtered;
  }, [experiments, scope, loggedInUser, searchQuery, sortConfig]);

  const missingCounts = visibleExperiments.filter((exp) => exp.responses === undefined).length;

  // Counts again only the experiments whose response count is missing
  const retryResponseCounts = async () => {
    setRetryingCounts(true);
    const counted = await addResponseCounts(experiments);
    setExperiments(counted.experiments);
    setCountsRateLimit(counted.rateLimit);
    setRetryingCounts(false);
  };

  const toggleExperiment = async (experimentId: string) => {
    const current = expanded[experimentId];
    if (current && current !== 'error') {
      setExpanded((prev) => {
        const updated = { ...prev };
        delete updated[experimentId];
        return updated;
      });
      return;
    }

    setExpanded((prev) => ({ ...prev, [experimentId]: 'loading' }));
    try {
      const data = await loadQuestionnaireExports(experimentId);
      setExpanded((prev) => (experimentId in prev ? { ...prev, [experimentId]: data } : prev));
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
      setExpanded((prev) => (experimentId in prev ? { ...prev, [experimentId]: 'error' } : prev));
    }
  };

  const previewResponses = (experiment: Experiment) =>
    openPreview({
      title: `Responses · ${experiment.name}`,
      fileName: exportFileName('Responses', experiment.name),
      emptyText: 'No responses found for this experiment yet.',
      note: 'One row per answer an app user gave. Times are shown as the API sends them (UTC).',
      load: () => getResponsesByExperimentID(experiment.ID),
    });

  const previewConveyances = (experiment: Experiment) =>
    openPreview({
      title: `Delivered messages · ${experiment.name}`,
      fileName: exportFileName('Conveyances', experiment.name),
      emptyText: 'No messages have been delivered to app users for this experiment yet.',
      note: 'One row per message delivered to an app user (a conveyance). Times are shown as the API sends them (UTC).',
      load: () => getConveyancesByExperimentID(experiment.ID),
    });

  const previewInteractions = (experiment: Experiment) =>
    openPreview({
      title: `Interactions · ${experiment.name}`,
      fileName: exportFileName('Interactions', experiment.name),
      emptyText: 'No interactions were reported in the living lab of this experiment during its period.',
      note: 'One row per sighting, damage or collision an app user reported in the living lab during the experiment. Times are shown as the API sends them (UTC).',
      load: () => getInteractionsByExperimentID(experiment.ID),
    });

  const previewUserLocations = (experiment: Experiment) =>
    openPreview({
      title: `App user locations · ${experiment.name}`,
      fileName: exportFileName('UserLocations', experiment.name),
      emptyText: 'No app user locations were recorded in the living lab of this experiment during its period.',
      note: 'One row per GPS reading of an app user in the living lab during the experiment, newest first. Times are shown as the API sends them (UTC).',
      load: () => loadUserLocationRows(experiment.ID),
    });

  const previewQuestionnaire = (questionnaire: Questionnaire, rows: any[]) =>
    openPreview({
      title: `Responses · ${questionnaire.name}`,
      fileName: exportFileName('QuestionnaireResponses', questionnaire.name),
      emptyText: 'No responses found for this questionnaire yet.',
      note: 'One row per answer to this questionnaire. Times are shown as the API sends them (UTC).',
      load: () => Promise.resolve(rows),
    });

  // Whole local days, as the period fields promise
  const getAnimalDataPeriod = (): { lab: LivingLab; start: string; end: string } | null => {
    const lab = livingLabs.find((candidate) => candidate.ID === selectedLabID);
    if (!lab || !animalDataStartDate || !animalDataEndDate) {
      setAnimalError('Choose a living lab and both dates of the period first.');
      return null;
    }
    const start = new Date(`${animalDataStartDate}T00:00:00`);
    const end = new Date(`${animalDataEndDate}T23:59:59.999`);
    if (start > end) {
      setAnimalError('The From date must be on or before the To date.');
      return null;
    }
    setAnimalError(null);
    return { lab, start: start.toISOString(), end: end.toISOString() };
  };

  const animalFileName = (prefix: string, lab: LivingLab) =>
    `${prefix}_${slugify(lab.name)}_${animalDataStartDate}_${animalDataEndDate}.csv`;

  const handleShowAnimalLocations = () => {
    const period = getAnimalDataPeriod();
    if (!period) return;
    openPreview({
      title: `Animal locations · ${period.lab.name}`,
      fileName: animalFileName('AnimalLocations', period.lab),
      emptyText: 'No animal locations were recorded in this living lab during the period.',
      note: 'GPS readings of tagged animals inside the living lab. Times are shown as the API sends them (UTC).',
      load: () => getAnimalLocationsInLivingLab(period.lab, period.start, period.end),
    });
  };

  const handleShowDetections = () => {
    const period = getAnimalDataPeriod();
    if (!period) return;
    openPreview({
      title: `Detections · ${period.lab.name}`,
      fileName: animalFileName('Detections', period.lab),
      emptyText: 'No detections were recorded in this living lab during the period.',
      note: 'One row per detected animal, the detection columns repeat for every animal.',
      load: () => loadDetectionRows(period.lab, period.start, period.end),
    });
  };

  const showOwner = scope === 'everyone';
  const columnCount = showOwner ? 8 : 7;

  const renderQuestionnaireRows = (experiment: Experiment) => {
    const state = expanded[experiment.ID];
    if (!state) return null;

    if (state === 'loading' || state === 'error') {
      return (
        <tr className="rc-export__sub">
          <td colSpan={columnCount} className="rc-export__sub-message">
            {state === 'loading' ? (
              <span className="rc-cluster rc-muted">
                <span className="rc-spinner" aria-hidden="true" /> Loading questionnaires…
              </span>
            ) : (
              <span className="rc-error">Couldn't load the questionnaires of this experiment. Close and open the row to try again.</span>
            )}
          </td>
        </tr>
      );
    }

    if (state.questionnaires.length === 0) {
      return (
        <tr className="rc-export__sub">
          <td colSpan={columnCount} className="rc-export__sub-message rc-muted">
            This experiment has no questionnaires.
          </td>
        </tr>
      );
    }

    return state.questionnaires.map((questionnaire) => {
      const loaded = state.responsesById[questionnaire.ID];
      const rows = loaded ?? [];
      return (
        <tr className="rc-export__sub" key={questionnaire.ID} data-testid={`export-questionnaire-row-${questionnaire.ID}`}>
          <td data-label="" />
          <td className="rc-table__lead rc-export__sub-name">
            <span>{questionnaire.name}</span>
            <span className="rc-mono rc-muted rc-small">{questionnaire.identifier || '—'}</span>
          </td>
          {showOwner && <td data-label="" />}
          <td data-label="Interaction type" className="rc-muted">
            {questionnaire.interactionType?.name ?? '—'}
          </td>
          <td data-label="Questions" className="rc-muted">
            {questionnaire.questions ? pluralize(questionnaire.questions.length, 'question') : '—'}
          </td>
          <td data-label="Responses" className={`rc-table__num${rows.length ? '' : ' rc-muted'}`}>
            {loaded === null ? '—' : formatCount(rows.length)}
          </td>
          <td data-label="" />
          <td data-label="Export as CSV" className="rc-table__actions">
            {loaded === null ? (
              <span className="rc-error">Couldn't load its responses, close and open the row to try again</span>
            ) : rows.length ? (
              <Button size="sm" onClick={() => previewQuestionnaire(questionnaire, rows)}>
                Responses of this questionnaire
              </Button>
            ) : (
              <span className="rc-muted rc-small">No responses yet</span>
            )}
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="rc-page">
      <PageHeader
        title="Export"
        meta={
          <span className="rc-lede">
            Download CSV files of what your experiments collected, or animal data recorded in a living lab. Every export shows a preview of the first
            rows before you download.
          </span>
        }
      />

      <section className="rc-card rc-card--flush" aria-labelledby="experiment-data-title">
        <div className="rc-card__bar">
          <h2 id="experiment-data-title" className="rc-section-title rc-export__title">
            Experiment data
          </h2>
          <SegmentedControl<Scope>
            label="Whose experiments"
            size="sm"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'mine', label: 'Mine' },
              { value: 'everyone', label: "Everyone's" },
            ]}
          />
          <label className="rc-search rc-export__search">
            <Icon name="search" />
            <span className="rc-visually-hidden">Search experiments</span>
            <input
              type="search"
              className="rc-input rc-export__search-input"
              placeholder="Search experiments"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              data-testid="export-search-input"
            />
          </label>
        </div>

        {!loading && missingCounts > 0 && (
          <div className="rc-export__message">
            <ResponseCountsBanner missing={missingCounts} rateLimit={countsRateLimit} retrying={retryingCounts} onRetry={retryResponseCounts} />
          </div>
        )}

        {loading ? (
          <LoadingState label="Loading experiments…" />
        ) : loadError ? (
          <div className="rc-export__message">
            <Banner tone="error" title="Couldn't load experiments.">
              The WildlifeNL API did not answer. Reload the page to try again.
            </Banner>
          </div>
        ) : visibleExperiments.length === 0 ? (
          <p className="rc-export__message rc-muted">
            {experiments.length === 0 ? 'There are no experiments to export yet.' : 'No experiments match. Try Everyone\'s or another search.'}
          </p>
        ) : (
          <div className="rc-table-wrap">
            <table className="rc-table rc-table--stack rc-export__table" data-testid="export-table">
              <caption className="rc-visually-hidden">Experiments with their exports, open a row to see its questionnaires</caption>
              <thead>
                <tr>
                  <th scope="col" className="rc-export__toggle-col">
                    <span className="rc-visually-hidden">Questionnaires</span>
                  </th>
                  <SortHeader label="Experiment" sortKey="name" sort={sortConfig} onSort={(key) => setSortConfig((current) => nextSort(current, key))} />
                  {showOwner && <th scope="col">Owner</th>}
                  <th scope="col">Status</th>
                  <th scope="col">Period</th>
                  <SortHeader label="Responses" sortKey="responses" sort={sortConfig} onSort={(key) => setSortConfig((current) => nextSort(current, key))} numeric />
                  <SortHeader label="Delivered" sortKey="messageActivity" sort={sortConfig} onSort={(key) => setSortConfig((current) => nextSort(current, key))} numeric />
                  <th scope="col">Export as CSV</th>
                </tr>
              </thead>
              <tbody>
                {visibleExperiments.map((experiment) => {
                  const status = getStatus(experiment.start, experiment.end);
                  const isOpen = !!expanded[experiment.ID];
                  const upcoming = status === 'Upcoming';
                  return (
                    <React.Fragment key={experiment.ID}>
                      <tr className={`rc-export__row${isOpen ? ' is-open' : ''}`} data-testid={`export-row-${experiment.ID}`}>
                        <td data-label="" className="rc-export__toggle-col">
                          <button
                            type="button"
                            className="rc-btn rc-btn--quiet rc-btn--icon rc-btn--sm"
                            aria-expanded={isOpen}
                            aria-label={`${isOpen ? 'Hide' : 'Show'} questionnaires of ${experiment.name}`}
                            onClick={() => toggleExperiment(experiment.ID)}
                          >
                            <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={12} />
                          </button>
                        </td>
                        <td className="rc-table__lead rc-table__name">
                          <Link to={`/experiment/${experiment.ID}`} state={{ experiment }} className="rc-name-link">
                            {experiment.name}
                          </Link>
                        </td>
                        {showOwner && <td data-label="Owner">{experiment.user?.name ?? '—'}</td>}
                        <td data-label="Status">
                          <StatusChip status={status} size="sm" />
                        </td>
                        <td data-label="Period" className="rc-table__nowrap">
                          {formatPeriod(experiment.start, experiment.end)}
                        </td>
                        <td data-label="Responses" className={`rc-table__num${upcoming || experiment.responses === undefined ? ' rc-muted' : ''}`}>
                          {upcoming && !experiment.responses ? '—' : formatCount(experiment.responses)}
                        </td>
                        <td data-label="Delivered" className={`rc-table__num${upcoming ? ' rc-muted' : ''}`}>
                          {upcoming && !experiment.messageActivity ? '—' : formatCount(experiment.messageActivity ?? 0)}
                        </td>
                        <td data-label="Export as CSV" className="rc-table__actions">
                          {upcoming ? (
                            <span className="rc-muted rc-small">Nothing collected yet · starts {formatDate(experiment.start)}</span>
                          ) : (
                            <span className="rc-cluster rc-export__buttons">
                              <Button size="sm" onClick={() => previewResponses(experiment)} data-testid={`export-responses-${experiment.ID}`}>
                                Responses
                              </Button>
                              <Button size="sm" onClick={() => previewConveyances(experiment)} data-testid={`export-conveyances-${experiment.ID}`}>
                                Delivered messages
                              </Button>
                              <Button size="sm" onClick={() => previewInteractions(experiment)} data-testid={`export-interactions-${experiment.ID}`}>
                                Interactions
                              </Button>
                              <Button size="sm" onClick={() => previewUserLocations(experiment)} data-testid={`export-user-locations-${experiment.ID}`}>
                                App user locations
                              </Button>
                            </span>
                          )}
                        </td>
                      </tr>
                      {renderQuestionnaireRows(experiment)}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="rc-card__note">
          <strong className="rc-export__term">Responses</strong> – one row per answer an app user gave. <strong className="rc-export__term">Delivered messages</strong>{' '}
          (conveyances) – one row per message delivered to an app user. <strong className="rc-export__term">Interactions</strong> – one row per sighting,
          damage or collision reported in the experiment's living lab during its period. <strong className="rc-export__term">App user locations</strong> – one row
          per GPS reading of an app user there and then. Without a living lab both cover everywhere. Files are named after the experiment and the export date.
        </p>
      </section>

      <section className="rc-card" aria-labelledby="animal-data-title" data-testid="animal-data-export">
        <div className="rc-stack rc-stack--sm">
          <h2 id="animal-data-title" className="rc-section-title">
            Animal data in a living lab
          </h2>
          <p className="rc-muted">Independent of your experiments. Choose a living lab and a period.</p>
        </div>

        <div className="rc-export__animal-fields">
          <Field id="animal-lab" label="Living lab" className="rc-export__lab-field">
            {(control) => (
              <select
                {...control}
                className="rc-select"
                value={selectedLabID}
                onChange={(event) => setSelectedLabID(event.target.value)}
                data-testid="export-livinglab-select"
              >
                <option value="">Choose a living lab</option>
                {livingLabs.map((lab) => (
                  <option key={lab.ID} value={lab.ID}>
                    {lab.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="animal-from" label="From">
            {(control) => (
              <input
                {...control}
                type="date"
                className="rc-input"
                value={animalDataStartDate}
                onChange={(event) => setAnimalDataStartDate(event.target.value)}
                data-testid="export-start-date-input"
              />
            )}
          </Field>
          <Field id="animal-until" label="To">
            {(control) => (
              <input
                {...control}
                type="date"
                className="rc-input"
                value={animalDataEndDate}
                onChange={(event) => setAnimalDataEndDate(event.target.value)}
                data-testid="export-end-date-input"
              />
            )}
          </Field>
          <span className="rc-help rc-export__days">Whole days, local time.</span>
        </div>

        {animalError && <Banner tone="error">{animalError}</Banner>}

        <div className="rc-export__options">
          <div className="rc-export__option">
            <Button size="md" onClick={handleShowAnimalLocations} data-testid="export-animal-locations-button">
              Preview animal locations
            </Button>
            <span>GPS readings of tagged animals inside the living lab during the period: animal, species, time, latitude, longitude.</span>
          </div>
          <div className="rc-export__option">
            <Button size="md" onClick={handleShowDetections} data-testid="export-detections-button">
              Preview detections
            </Button>
            <span>Camera and sensor detections of animals in the living lab during the period: sensor, species, time, location.</span>
          </div>
        </div>
      </section>

      <ExportPreviewDialog preview={preview} onClose={closePreview} />
    </div>
  );
};

export default Export;
