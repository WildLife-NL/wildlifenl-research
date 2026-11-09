import { useEffect, useState } from 'react';
import '../styles/Experiment.css';
import { Experiment } from '../types/experiment';
import { getResponsesByExperimentID, getResponseCountByExperimentID } from '../services/responseService';
import { getConveyancesByExperimentID } from '../services/conveyanceService';
import { getInteractionsByExperimentID } from '../services/interactionService';
import { loadQuestionnaireExports, loadUserLocationRows, QuestionnaireExports } from '../services/exportService';
import ExperimentPage from '../components/ExperimentPage';
import ExportPreviewDialog, { useExportPreview } from '../components/ExportPreviewDialog';
import Banner from '../components/ui/Banner';
import Button from '../components/ui/Button';
import { LoadingState } from '../components/ui/Layout';
import { exportFileName } from '../utils/csv';
import { getStatus } from '../utils/experimentStatus';
import { formatCount, formatDate, pluralize } from '../utils/format';

// null while loading, 'error' when the API could not give the rows
type RowCount = number | 'error' | null;

const formatRowCount = (count: RowCount): string => (count === null ? '…' : count === 'error' ? '—' : pluralize(count, 'row'));

// Data tab of the hub: this experiment's exports, the same previews and files as the Export page
const ExperimentDataContent: React.FC<{ experiment: Experiment }> = ({ experiment }) => {
  const { preview, openPreview, closePreview } = useExportPreview();
  const [responses, setResponses] = useState<RowCount>(null);
  const [interactions, setInteractions] = useState<RowCount>(null);
  const [userLocations, setUserLocations] = useState<RowCount>(null);
  const [questionnaireExports, setQuestionnaireExports] = useState<QuestionnaireExports | null>(null);
  const [questionnaireError, setQuestionnaireError] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    getResponseCountByExperimentID(experiment.ID)
      .then((count) => !cancelled && setResponses(count))
      .catch(() => !cancelled && setResponses('error'));
    getInteractionsByExperimentID(experiment.ID)
      .then((rows) => !cancelled && setInteractions(rows.length))
      .catch(() => !cancelled && setInteractions('error'));
    loadUserLocationRows(experiment.ID)
      .then((rows) => !cancelled && setUserLocations(rows.length))
      .catch(() => !cancelled && setUserLocations('error'));
    loadQuestionnaireExports(experiment.ID)
      .then((data) => !cancelled && setQuestionnaireExports(data))
      .catch((error) => {
        console.error('Error fetching questionnaire exports:', error);
        if (!cancelled) setQuestionnaireError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [experiment.ID]);

  const status = getStatus(experiment.start, experiment.end);

  return (
    <>
      {status === 'Upcoming' && (
        <Banner tone="info" title="Nothing collected yet.">
          Collecting starts on {formatDate(experiment.start)}. The exports below fill up once the experiment is live.
        </Banner>
      )}

      <section className="rc-card rc-card--flush" aria-labelledby="datasets-title">
        <div className="rc-card__bar">
          <h2 id="datasets-title" className="rc-section-title">
            Export as CSV
          </h2>
        </div>
        <ul className="rc-hub__datasets">
          <li className="rc-hub__dataset">
            <div className="rc-hub__dataset-text">
              <p className="rc-strong">All responses</p>
              <p className="rc-help">One row per answer an app user gave, across every questionnaire.</p>
            </div>
            <span className="rc-hub__dataset-count">{formatRowCount(responses)}</span>
            <Button
              size="md"
              onClick={() =>
                openPreview({
                  title: `Responses · ${experiment.name}`,
                  fileName: exportFileName('Responses', experiment.name),
                  emptyText: 'No responses found for this experiment yet.',
                  note: 'One row per answer an app user gave. Times are shown as the API sends them (UTC).',
                  load: () => getResponsesByExperimentID(experiment.ID),
                })
              }
              data-testid="data-responses-button"
            >
              Preview responses
            </Button>
          </li>
          {!questionnaireExports && !questionnaireError && (
            <li className="rc-hub__dataset rc-hub__dataset--sub">
              <LoadingState label="Loading questionnaires…" />
            </li>
          )}
          {questionnaireError && (
            <li className="rc-hub__dataset rc-hub__dataset--sub">
              <span className="rc-error">Couldn't load the questionnaires of this experiment. Reload the page to try again.</span>
            </li>
          )}
          {questionnaireExports?.questionnaires.map((questionnaire) => {
            const loaded = questionnaireExports.responsesById[questionnaire.ID];
            const rows = loaded ?? [];
            return (
              <li key={questionnaire.ID} className="rc-hub__dataset rc-hub__dataset--sub">
                <div className="rc-hub__dataset-text">
                  <p>
                    <span className="rc-strong">{questionnaire.name}</span>{' '}
                    <span className="rc-mono rc-muted rc-small">{questionnaire.identifier}</span>
                  </p>
                  <p className="rc-help">
                    Responses to this questionnaire only · {questionnaire.interactionType?.name ?? 'no interaction type'}
                  </p>
                </div>
                <span className="rc-hub__dataset-count">{loaded === null ? 'not loaded' : `${formatCount(rows.length)} rows`}</span>
                <Button
                  size="md"
                  unavailable={rows.length === 0}
                  onClick={() =>
                    openPreview({
                      title: `Responses · ${questionnaire.name}`,
                      fileName: exportFileName('QuestionnaireResponses', questionnaire.name),
                      emptyText: 'No responses found for this questionnaire yet.',
                      load: () => Promise.resolve(rows),
                    })
                  }
                >
                  {rows.length ? 'Preview' : loaded === null ? 'Unavailable' : 'No responses yet'}
                </Button>
                {loaded === null && <span className="rc-error">Couldn't load its responses. Reload the page to try again.</span>}
              </li>
            );
          })}
          <li className="rc-hub__dataset">
            <div className="rc-hub__dataset-text">
              <p className="rc-strong">Delivered messages</p>
              <p className="rc-help">One row per message delivered to an app user, also called conveyances.</p>
            </div>
            <span className="rc-hub__dataset-count">{pluralize(experiment.messageActivity ?? 0, 'row')}</span>
            <Button
              size="md"
              onClick={() =>
                openPreview({
                  title: `Delivered messages · ${experiment.name}`,
                  fileName: exportFileName('Conveyances', experiment.name),
                  emptyText: 'No messages have been delivered to app users for this experiment yet.',
                  note: 'One row per message delivered to an app user (a conveyance). Times are shown as the API sends them (UTC).',
                  load: () => getConveyancesByExperimentID(experiment.ID),
                })
              }
              data-testid="data-conveyances-button"
            >
              Preview delivered messages
            </Button>
          </li>
          <li className="rc-hub__dataset">
            <div className="rc-hub__dataset-text">
              <p className="rc-strong">Interactions</p>
              <p className="rc-help">One row per sighting, damage or collision an app user reported in the living lab during the experiment.</p>
            </div>
            <span className="rc-hub__dataset-count">{formatRowCount(interactions)}</span>
            <Button
              size="md"
              onClick={() =>
                openPreview({
                  title: `Interactions · ${experiment.name}`,
                  fileName: exportFileName('Interactions', experiment.name),
                  emptyText: 'No interactions were reported in the living lab of this experiment during its period.',
                  note: 'One row per sighting, damage or collision an app user reported in the living lab during the experiment. Times are shown as the API sends them (UTC).',
                  load: () => getInteractionsByExperimentID(experiment.ID),
                })
              }
              data-testid="data-interactions-button"
            >
              Preview interactions
            </Button>
          </li>
          <li className="rc-hub__dataset">
            <div className="rc-hub__dataset-text">
              <p className="rc-strong">App user locations</p>
              <p className="rc-help">One row per GPS reading of an app user in the living lab during the experiment.</p>
            </div>
            <span className="rc-hub__dataset-count">{formatRowCount(userLocations)}</span>
            <Button
              size="md"
              onClick={() =>
                openPreview({
                  title: `App user locations · ${experiment.name}`,
                  fileName: exportFileName('UserLocations', experiment.name),
                  emptyText: 'No app user locations were recorded in the living lab of this experiment during its period.',
                  note: 'One row per GPS reading of an app user in the living lab during the experiment, newest first. Times are shown as the API sends them (UTC).',
                  load: () => loadUserLocationRows(experiment.ID),
                })
              }
              data-testid="data-user-locations-button"
            >
              Preview app user locations
            </Button>
          </li>
        </ul>
        <p className="rc-card__note">
          Interactions and app user locations cover everywhere when the experiment has no living lab. Files are named after the experiment or questionnaire and
          the export date. Animal data in a living lab is on the Export page.
        </p>
      </section>

      <ExportPreviewDialog preview={preview} onClose={closePreview} />
    </>
  );
};

const ExperimentData: React.FC = () => (
  <ExperimentPage activeTab="data">{(experiment) => <ExperimentDataContent key={experiment.ID} experiment={experiment} />}</ExperimentPage>
);

export default ExperimentData;
