import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import '../styles/MessageCreation.css';
import '../styles/Experiment.css';
import { Message as MessageType } from '../types/message';
import { DeleteMessageByID, getMessagesByExperimentID } from '../services/messageService';
import { useCurrentUser } from '../context/UserContext';
import { useExperiment } from '../hooks/useExperiment';
import { useDocumentTitle } from '../hooks/usePageChrome';
import { hubCrumbs, hubPath } from '../components/ExperimentHeader';
import { ExperimentNotFound } from '../components/ExperimentPage';
import Banner from '../components/ui/Banner';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { LoadingState, PageHeader, PhoneFrame } from '../components/ui/Layout';
import { LOGO_SRC } from '../appInfo';
import { getExperimentPermissions } from '../utils/experimentPermissions';
import { formatCount, pluralize } from '../utils/format';
import { describeTrigger, severityLabel, speciesLabel, triggerLabel } from '../utils/messageTrigger';

// One message: what it says, when it is sent and how often it was delivered, deletable while the experiment is upcoming
const Message: React.FC = () => {
  const { id, messageId } = useParams<{ id: string; messageId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { experiment } = useExperiment(id);

  const stateMessage: MessageType | undefined = location.state?.message?.ID === messageId ? location.state.message : undefined;
  const [message, setMessage] = useState<MessageType | null>(stateMessage ?? null);
  const [loading, setLoading] = useState<boolean>(!stateMessage);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  useDocumentTitle(message?.name ?? 'Message');

  useEffect(() => {
    if (!id || !messageId) return;
    let cancelled = false;
    getMessagesByExperimentID(id)
      .then((messages) => {
        if (!cancelled) setMessage((messages ?? []).find((candidate) => candidate.ID === messageId) ?? null);
      })
      .catch((error) => {
        console.error('Error fetching message:', error);
        if (!cancelled) setLoadError(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, messageId]);

  if (!message && loading) {
    return (
      <div className="rc-page">
        <LoadingState label="Loading the message…" />
      </div>
    );
  }

  if (!message && loadError) {
    return (
      <div className="rc-page">
        <Banner tone="error" title="Couldn't load the message.">
          The WildlifeNL API did not answer. Reload the page to try again.
        </Banner>
      </div>
    );
  }

  if (!message) {
    return <ExperimentNotFound what="message" />;
  }

  const permissions = experiment ? getExperimentPermissions(experiment, user) : null;
  const canDelete = !!permissions?.canEdit;
  const deleteReason = canDelete
    ? undefined
    : permissions && !permissions.isOwner
    ? `${permissions.reasons.edit}.`
    : 'Messages lock once the experiment is live.';

  const sentence = describeTrigger({
    trigger: message.trigger,
    species: message.species,
    encounterMeters: message.encounterMeters,
    encounterMinutes: message.encounterMinutes,
    answerText: message.answer?.text,
    livingLab: experiment?.livingLab?.name,
  });

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await DeleteMessageByID(message.ID);
      navigate(hubPath('messages', id as string), {
        state: { experiment, flash: { tone: 'success', title: 'Message deleted.', text: `“${message.name}” will not be sent.` } },
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete the message. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="rc-page rc-page--detail">
      <PageHeader
        breadcrumbs={experiment ? [...hubCrumbs(experiment, 'messages'), { label: message.name }] : [{ label: 'Experiments', to: '/dashboard' }, { label: message.name }]}
        eyebrow={`Message · ${triggerLabel(message.trigger)}`}
        title={message.name}
        titleTestId="message-title"
        meta={
          <>
            <span className="rc-hub__severity">
              <span className="rc-swatch" style={{ background: `var(--rc-sev-${message.severity})` }} aria-hidden="true" />
              Severity {severityLabel(message.severity).toLowerCase()}
            </span>
            <span>· Delivered {pluralize(message.activity ?? 0, 'time')}</span>
          </>
        }
        actions={
          <Button
            variant="danger-quiet"
            onClick={() => setDeleteOpen(true)}
            unavailable={!canDelete}
            aria-describedby={deleteReason ? 'message-actions-note' : undefined}
            data-testid="delete-message-button"
          >
            Delete
          </Button>
        }
        actionsNote={deleteReason}
        actionsNoteId="message-actions-note"
      />

      <div className="rc-split">
        <div className="rc-split__main">
          <section className="rc-card" aria-labelledby="message-content-title">
            <h2 id="message-content-title" className="rc-section-title">
              Content
            </h2>
            <dl className="rc-dl">
              <dt>Title</dt>
              <dd>{message.name}</dd>
              <dt>Text</dt>
              <dd className="rc-body">{message.text}</dd>
            </dl>
          </section>

          <section className="rc-card" aria-labelledby="message-trigger-title">
            <h2 id="message-trigger-title" className="rc-section-title">
              When it is sent
            </h2>
            <p className="rc-body">{sentence}</p>
            <dl className="rc-dl">
              <dt>Trigger</dt>
              <dd>{triggerLabel(message.trigger)}</dd>
              {message.species && (
                <>
                  <dt>Species</dt>
                  <dd>{speciesLabel(message.species)}</dd>
                </>
              )}
              {message.trigger === 'encounter' && (
                <>
                  <dt>Within</dt>
                  <dd>{message.encounterMeters ? `${formatCount(message.encounterMeters)} m` : '—'}</dd>
                  <dt>Readings within</dt>
                  <dd>{message.encounterMinutes ? pluralize(message.encounterMinutes, 'minute') : '—'}</dd>
                </>
              )}
              {message.answer && (
                <>
                  <dt>Answer</dt>
                  <dd>{message.answer.text}</dd>
                </>
              )}
              <dt>Severity</dt>
              <dd>
                {message.severity} · {severityLabel(message.severity)}
              </dd>
            </dl>
          </section>
        </div>

        <aside className="rc-split__aside rc-split__aside--sticky">
          <section className="rc-card rc-card--tight" aria-labelledby="message-view-preview">
            <h2 id="message-view-preview" className="rc-section-title">
              Preview
            </h2>
            <PhoneFrame label="Notification as app users receive it" variant="notification" caption="Approximation of the WildlifeNL app notification.">
              <div className="rc-notification">
                <div className="rc-notification__app">
                  <img src={LOGO_SRC} alt="" />
                  <strong>WildlifeNL</strong>
                  <span className="rc-notification__time">now</span>
                </div>
                <p className="rc-notification__title">{message.name}</p>
                <p className="rc-notification__text">{message.text}</p>
              </div>
            </PhoneFrame>
          </section>
          <section className="rc-card rc-card--sunken" aria-labelledby="message-activity-title">
            <h2 id="message-activity-title" className="rc-subhead">
              Activity
            </h2>
            <p>
              Delivered to app users <strong>{pluralize(message.activity ?? 0, 'time')}</strong>.
            </p>
            <p className="rc-help">Each delivery is one row in the delivered messages export of the experiment.</p>
          </section>
        </aside>
      </div>

      {deleteError && !deleteOpen && <Banner tone="error">{deleteError}</Banner>}

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete “${message.name}”?`}
        confirmLabel="Delete message"
        busyLabel="Deleting…"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      >
        App users will not receive it. This can't be undone.
      </ConfirmDialog>
    </div>
  );
};

export default Message;
