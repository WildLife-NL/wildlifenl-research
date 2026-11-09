// Header of the experiment hub: breadcrumbs, status, Edit, Stop and Delete with printed reasons, and the section tabs
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Experiment, UpdateExperiment } from '../types/experiment';
import { LivingLab } from '../types/livinglab';
import { deleteExperimentWithChildren, EndExperimentByID, getExperiments, updateExperiment } from '../services/experimentService';
import { getAllLivingLabs } from '../services/livingLabService';
import { useCurrentUser } from '../context/UserContext';
import { useMinLengths } from '../hooks/useMinLengths';
import { getExperimentPermissions } from '../utils/experimentPermissions';
import { describeTiming } from '../utils/experimentStatus';
import { formatPeriod, fromDateInputValue, pluralize, toDateInputValue } from '../utils/format';
import ExperimentDetailsForm, {
  EXPERIMENT_FIELDS,
  ExperimentDetailsErrors,
  ExperimentDetailsValues,
  validateExperimentDetails,
} from './ExperimentDetailsForm';
import TimelineBar from './TimelineBar';
import Banner from './ui/Banner';
import Button from './ui/Button';
import ConfirmDialog from './ui/ConfirmDialog';
import Dialog from './ui/Dialog';
import { Crumb, PageHeader } from './ui/Layout';
import StatusChip from './ui/StatusChip';

export type HubTab = 'overview' | 'questionnaires' | 'messages' | 'data';

const TAB_LABELS: Record<HubTab, string> = {
  overview: 'Overview',
  questionnaires: 'Questionnaires',
  messages: 'Messages',
  data: 'Data',
};

export const hubPath = (tab: HubTab, experimentId: string): string =>
  ({
    overview: `/experiment/${experimentId}`,
    questionnaires: `/questionnairedashboard/${experimentId}`,
    messages: `/messagedashboard/${experimentId}`,
    data: `/experimentdata/${experimentId}`,
  }[tab]);

// Breadcrumbs that lead back into the hub from pages one level deeper, such as a questionnaire
export const hubCrumbs = (experiment: Experiment, tab?: HubTab): Crumb[] => {
  const crumbs: Crumb[] = [
    { label: 'Experiments', to: '/dashboard' },
    { label: experiment.name, to: hubPath('overview', experiment.ID), state: { experiment } },
  ];
  if (tab && tab !== 'overview') crumbs.push({ label: TAB_LABELS[tab], to: hubPath(tab, experiment.ID), state: { experiment } });
  return crumbs;
};

const toFormValues = (experiment: Experiment): ExperimentDetailsValues => ({
  name: experiment.name ?? '',
  description: experiment.description ?? '',
  start: toDateInputValue(experiment.start),
  end: toDateInputValue(experiment.end),
  livingLabID: experiment.livingLab?.ID ?? '',
});

interface ExperimentHeaderProps {
  experiment: Experiment;
  activeTab: HubTab;
  onExperimentChange: (experiment: Experiment) => void;
  showTimeline?: boolean;
}

const ExperimentHeader: React.FC<ExperimentHeaderProps> = ({ experiment, activeTab, onExperimentChange, showTimeline }) => {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const permissions = getExperimentPermissions(experiment, user);
  const { hints, load: loadMinLengths } = useMinLengths(EXPERIMENT_FIELDS);

  const [notice, setNotice] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [values, setValues] = useState<ExperimentDetailsValues>(() => toFormValues(experiment));
  const [errors, setErrors] = useState<ExperimentDetailsErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [livingLabs, setLivingLabs] = useState<LivingLab[]>([]);
  const [labsLoading, setLabsLoading] = useState(false);

  const [confirm, setConfirm] = useState<'stop' | 'delete' | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (!editOpen || livingLabs.length) return;
    setLabsLoading(true);
    getAllLivingLabs()
      .then(setLivingLabs)
      .catch((error) => console.error('Failed to fetch living labs:', error))
      .finally(() => setLabsLoading(false));
  }, [editOpen, livingLabs.length]);

  // A failed refresh does not undo a change that already succeeded, the page catches up on the next visit
  const refresh = async () => {
    try {
      const fresh = (await getExperiments()).find((candidate) => candidate.ID === experiment.ID);
      if (fresh) onExperimentChange(fresh);
    } catch (error) {
      console.error('Error refreshing experiment:', error);
    }
  };

  const openEdit = () => {
    setValues(toFormValues(experiment));
    setErrors({});
    setSaveError(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    let minLengths;
    try {
      minLengths = await loadMinLengths();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not load the validation rules. Please try again.');
      setSaving(false);
      return;
    }
    const found = validateExperimentDetails(values, minLengths);
    setErrors(found);
    if (Object.keys(found).length) {
      setSaving(false);
      return;
    }

    const payload: UpdateExperiment = {
      ID: experiment.ID,
      name: values.name.trim(),
      description: values.description.trim(),
      start: fromDateInputValue(values.start),
      ...(values.end && { end: fromDateInputValue(values.end) }),
      ...(values.livingLabID && { livingLabID: values.livingLabID }),
    };

    try {
      await updateExperiment(experiment.ID, payload);
      await refresh();
      setEditOpen(false);
      setNotice('Details saved.');
    } catch (error) {
      console.error('Error updating experiment:', error);
      setSaveError(error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    setConfirmBusy(true);
    setConfirmError(null);
    try {
      if (confirm === 'stop') {
        await EndExperimentByID(experiment.ID);
        await refresh();
        setConfirm(null);
        setNotice('Experiment stopped. App users no longer receive its questionnaires and messages, the data stays exportable.');
      } else if (confirm === 'delete') {
        await deleteExperimentWithChildren(experiment.ID);
        navigate('/dashboard', {
          state: { flash: { tone: 'success', title: 'Experiment deleted.', text: `“${experiment.name}” and its questionnaires and messages are gone.` } },
        });
      }
    } catch (error) {
      console.error('Error changing experiment:', error);
      setConfirmError(error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setConfirmBusy(false);
    }
  };

  const questionnaireCount = experiment.numberOfQuestionnaires ?? 0;
  const messageCount = experiment.numberOfMessages ?? 0;
  const ownerName = experiment.user?.name ?? 'unknown';
  const showStop = permissions.status !== 'Completed';

  // One printed sentence per unavailable action, plus what Delete takes with it
  const notes = permissions.isOwner
    ? [
        permissions.reasons.edit,
        showStop ? permissions.reasons.stop : undefined,
        permissions.reasons.delete,
        permissions.canDelete ? `Delete also removes its ${pluralize(questionnaireCount, 'questionnaire')} and ${pluralize(messageCount, 'message')}.` : undefined,
      ]
    : [permissions.reasons.edit];
  const actionsNote = Array.from(new Set(notes.filter(Boolean).map((note) => (note!.endsWith('.') ? note : `${note}.`)))).join(' ');
  const noteId = `experiment-actions-note-${experiment.ID}`;

  const crumbs: Crumb[] =
    activeTab === 'overview'
      ? [{ label: 'Experiments', to: '/dashboard' }, { label: experiment.name }]
      : [...hubCrumbs(experiment), { label: TAB_LABELS[activeTab] }];

  const tabs: { tab: HubTab; count?: number }[] = [
    { tab: 'overview' },
    { tab: 'questionnaires', count: questionnaireCount },
    { tab: 'messages', count: messageCount },
    { tab: 'data' },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={crumbs}
        eyebrow={`Experiment · ${experiment.livingLab ? `Living lab ${experiment.livingLab.name}` : 'No living lab'} · Owner ${ownerName}${
          permissions.isOwner ? ' (you)' : ''
        }`}
        title={experiment.name}
        titleTestId="experiment-title"
        meta={
          <>
            <StatusChip status={permissions.status} />
            <span>
              {describeTiming(experiment.start, experiment.end)} · {formatPeriod(experiment.start, experiment.end)}
            </span>
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={openEdit}
              unavailable={!permissions.canEdit}
              aria-describedby={!permissions.canEdit ? noteId : undefined}
              data-testid="edit-experiment-button"
            >
              Edit details
            </Button>
            {showStop && (
              <Button
                variant="secondary"
                onClick={() => setConfirm('stop')}
                unavailable={!permissions.canStop}
                aria-describedby={!permissions.canStop ? noteId : undefined}
                data-testid="stop-experiment-button"
              >
                Stop experiment
              </Button>
            )}
            <Button
              variant="danger-quiet"
              onClick={() => setConfirm('delete')}
              unavailable={!permissions.canDelete}
              aria-describedby={noteId}
              data-testid="delete-experiment-button"
            >
              Delete
            </Button>
          </>
        }
        actionsNote={actionsNote}
        actionsNoteId={noteId}
      />

      {notice && (
        <Banner tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Banner>
      )}

      {showTimeline && <TimelineBar experiment={experiment} />}

      <nav className="rc-tabs" aria-label="Experiment sections">
        {tabs.map(({ tab, count }) => (
          <Link key={tab} to={hubPath(tab, experiment.ID)} state={{ experiment }} aria-current={tab === activeTab ? 'page' : undefined} data-testid={`hub-tab-${tab}`}>
            {TAB_LABELS[tab]}
            {count !== undefined && <span className="rc-count">{count}</span>}
          </Link>
        ))}
      </nav>

      <Dialog
        open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        title="Edit details"
        description="Details can change until the experiment goes live."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)} unavailable={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} busy={saving} busyLabel="Saving…" data-testid="save-experiment-button">
              Save details
            </Button>
          </>
        }
      >
        {saveError && (
          <Banner tone="error" title="Couldn't save the details.">
            {saveError}
          </Banner>
        )}
        <ExperimentDetailsForm
          idPrefix="edit-experiment"
          values={values}
          onChange={setValues}
          errors={errors}
          livingLabs={livingLabs}
          labsLoading={labsLoading}
          minLengths={hints}
        />
      </Dialog>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === 'stop' ? `Stop “${experiment.name}”?` : `Delete “${experiment.name}”?`}
        confirmLabel={confirm === 'stop' ? 'Stop experiment' : 'Delete experiment'}
        busyLabel={confirm === 'stop' ? 'Stopping…' : 'Deleting…'}
        busy={confirmBusy}
        error={confirmError}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirm(null);
          setConfirmError(null);
        }}
      >
        {confirm === 'stop'
          ? "App users stop receiving its questionnaires and messages today. Collected data stays exportable. This can't be undone."
          : `Its ${pluralize(questionnaireCount, 'questionnaire')} and ${pluralize(messageCount, 'message')} are removed too. This can't be undone.`}
      </ConfirmDialog>
    </>
  );
};

export default ExperimentHeader;
