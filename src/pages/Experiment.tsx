import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Experiment.css';
import { Experiment as ExperimentType } from '../types/experiment';
import { Message } from '../types/message';
import { Questionnaire } from '../types/questionnaire';
import { getQuestionnaireByExperimentID } from '../services/questionnaireService';
import { getMessagesByExperimentID } from '../services/messageService';
import { getResponseCountByExperimentID } from '../services/responseService';
import ExperimentPage from '../components/ExperimentPage';
import { hubPath } from '../components/ExperimentHeader';
import Banner from '../components/ui/Banner';
import { ButtonLink } from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { LoadingState } from '../components/ui/Layout';
import { getStatus } from '../utils/experimentStatus';
import { formatCount, formatDate } from '../utils/format';
import { getReadiness, ReadinessItem } from '../utils/readiness';

const ChecklistIcon: React.FC<{ state: ReadinessItem['state'] }> = ({ state }) => (
  <span className={`rc-checklist__icon rc-checklist__icon--${state}`} aria-hidden="true">
    {state === 'done' && <Icon name="check" size={12} />}
    {state === 'warn' && '!'}
  </span>
);

const STATE_WORDS: Record<ReadinessItem['state'], string> = { done: 'Ready', warn: 'Needs attention', todo: 'Still to come' };

// Overview tab of the hub: go-live checklist, description, details and activity
const ExperimentOverview: React.FC<{ experiment: ExperimentType }> = ({ experiment }) => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[] | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  // null while loading, undefined when the API could not count them
  const [responses, setResponses] = useState<number | null | undefined>(null);
  const [childrenError, setChildrenError] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getQuestionnaireByExperimentID(experiment.ID), getMessagesByExperimentID(experiment.ID)])
      .then(([foundQuestionnaires, foundMessages]) => {
        if (cancelled) return;
        setQuestionnaires(foundQuestionnaires ?? []);
        setMessages(foundMessages ?? []);
      })
      .catch((error) => {
        console.error('Error fetching questionnaires and messages:', error);
        if (!cancelled) setChildrenError(true);
      });
    getResponseCountByExperimentID(experiment.ID)
      .then((count) => !cancelled && setResponses(count))
      .catch(() => !cancelled && setResponses(undefined));
    return () => {
      cancelled = true;
    };
  }, [experiment.ID]);

  const status = getStatus(experiment.start, experiment.end);
  const readiness = questionnaires && messages ? getReadiness(experiment, questionnaires, messages) : null;

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(experiment.ID);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Could not copy the experiment ID:', error);
    }
  };

  return (
    <div className="rc-split">
      <div className="rc-split__main">
        {status === 'Upcoming' ? (
          <section className="rc-card" aria-labelledby="readiness-title" data-testid="readiness-checklist">
            <div className="rc-card__header">
              <h2 id="readiness-title" className="rc-section-title">
                Before this goes live
              </h2>
              {readiness && (
                <span className="rc-muted rc-small">
                  {readiness.ready} of {readiness.items.length} ready
                </span>
              )}
            </div>
            {childrenError && (
              <Banner tone="error" title="Couldn't load questionnaires and messages.">
                Reload the page to see the checklist.
              </Banner>
            )}
            {!readiness && !childrenError && <LoadingState label="Checking questionnaires and messages…" />}
            {readiness && (
              <ol className="rc-checklist">
                {readiness.items.map((item) => (
                  <li key={item.id} className="rc-checklist__item">
                    <ChecklistIcon state={item.state} />
                    <div className="rc-checklist__body">
                      <p className="rc-checklist__title">
                        <span className="rc-visually-hidden">{STATE_WORDS[item.state]}: </span>
                        {item.title}
                      </p>
                      <p className="rc-checklist__text">{item.text}</p>
                    </div>
                    {item.action && (
                      <Link className="rc-checklist__action" to={item.action.to} state={{ experiment }}>
                        {item.action.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : (
          <Banner tone="info" title={status === 'Live' ? 'Live.' : 'Completed.'}>
            {status === 'Live'
              ? `App users have been receiving its questionnaires and messages since ${formatDate(experiment.start)}. Questionnaires and messages are locked, you can still stop the experiment.`
              : `The experiment ended on ${formatDate(experiment.end)}. Everything is read-only, the data stays exportable and questionnaires can be cloned into an upcoming experiment.`}
          </Banner>
        )}

        <section className="rc-card" aria-labelledby="description-title">
          <h2 id="description-title" className="rc-section-title">
            Description
          </h2>
          <p className="rc-body">{experiment.description || 'No description.'}</p>
        </section>

        <section className="rc-card" aria-labelledby="details-title">
          <h2 id="details-title" className="rc-section-title">
            Details
          </h2>
          <dl className="rc-dl">
            <dt>Start</dt>
            <dd>{formatDate(experiment.start)}</dd>
            <dt>End</dt>
            <dd>{experiment.end ? formatDate(experiment.end) : 'No end date, runs until stopped'}</dd>
            <dt>Living lab</dt>
            <dd>{experiment.livingLab?.name ?? 'No living lab'}</dd>
            <dt>Owner</dt>
            <dd>{experiment.user?.name ?? '—'}</dd>
            <dt>Experiment ID</dt>
            <dd className="rc-hub__id">
              <code className="rc-code">{experiment.ID}</code>
              <button type="button" className="rc-btn rc-btn--secondary rc-btn--sm" onClick={copyId}>
                <Icon name={copied ? 'check' : 'copy'} size={14} />
                {copied ? 'Copied' : 'Copy'}
              </button>
              <span className="rc-visually-hidden" role="status">
                {copied ? 'Experiment ID copied' : ''}
              </span>
            </dd>
          </dl>
        </section>
      </div>

      <aside className="rc-split__aside rc-split__aside--sticky">
        <section className="rc-card" aria-labelledby="activity-title">
          <h2 id="activity-title" className="rc-section-title">
            Activity
          </h2>
          <dl className="rc-stats">
            <div>
              <dt>Responses collected</dt>
              <dd data-testid="activity-responses">{responses === null ? '…' : formatCount(responses)}</dd>
            </div>
            <div>
              <dt>Questionnaires with responses</dt>
              <dd>
                {formatCount(experiment.questionnaireActivity ?? 0)} of {formatCount(experiment.numberOfQuestionnaires ?? 0)}
              </dd>
            </div>
            <div>
              <dt>Messages delivered</dt>
              <dd>{formatCount(experiment.messageActivity ?? 0)}</dd>
            </div>
          </dl>
          <p className="rc-help">
            {status === 'Upcoming' ? `Collecting starts on ${formatDate(experiment.start)}. ` : ''}Counts come from the WildlifeNL API and refresh when you open
            this page.
          </p>
          <ButtonLink to={hubPath('data', experiment.ID)} state={{ experiment }} variant="secondary">
            Export data for this experiment
          </ButtonLink>
        </section>

        <section className="rc-card rc-card--sunken" aria-labelledby="lifecycle-title">
          <h2 id="lifecycle-title" className="rc-subhead">
            How the lifecycle works
          </h2>
          <ul className="rc-bullets">
            <li>
              <strong>Upcoming</strong> – everything is editable, delete is allowed.
            </li>
            <li>
              <strong>Live</strong> – app users receive questionnaires and messages, only Stop is allowed.
            </li>
            <li>
              <strong>Completed</strong> – read-only, data stays exportable and questionnaires can be cloned.
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
};

const Experiment: React.FC = () => (
  <ExperimentPage activeTab="overview" showTimeline testId="experiment-overview">
    {(experiment) => <ExperimentOverview key={`${experiment.ID}-${experiment.start}-${experiment.end ?? ''}`} experiment={experiment} />}
  </ExperimentPage>
);

export default Experiment;
