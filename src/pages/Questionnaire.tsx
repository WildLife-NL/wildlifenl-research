import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../styles/Questionnaire.css';
import { Questionnaire as QuestionnaireType, UpdatedQuestionnaire } from '../types/questionnaire';
import { Experiment } from '../types/experiment';
import { InteractionType } from '../types/interactiontype';
import { Message } from '../types/message';
import { getQuestionnaireByID, deleteQuestionnaireWithChildren, updateQuestionnaireByID, cloneQuestionnaire } from '../services/questionnaireService';
import { getExperiments, getMyExperiments } from '../services/experimentService';
import { getMessagesByExperimentID } from '../services/messageService';
import { getAllInteractions } from '../services/interactionTypeService';
import { getMinLength } from '../services/schemaService';
import { useCurrentUser } from '../context/UserContext';
import { useMinLengths } from '../hooks/useMinLengths';
import { useBeforeUnload, useDocumentTitle, useFlash } from '../hooks/usePageChrome';
import { hubCrumbs, hubPath } from '../components/ExperimentHeader';
import { ExperimentNotFound } from '../components/ExperimentPage';
import QuestionCard from '../components/QuestionCard';
import QuestionnaireDetailsForm, {
  QuestionnaireDetailsErrors,
  QuestionnaireDetailsValues,
  validateQuestionnaireDetails,
} from '../components/QuestionnaireDetailsForm';
import Banner from '../components/ui/Banner';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Dialog from '../components/ui/Dialog';
import Icon from '../components/ui/Icon';
import { ActionBar, Field, LoadingState, PageHeader, PhoneFrame } from '../components/ui/Layout';
import StatusChip from '../components/ui/StatusChip';
import { getExperimentPermissions } from '../utils/experimentPermissions';
import { getStatus } from '../utils/experimentStatus';
import { formatDate, pluralize } from '../utils/format';
import {
  answerLetter,
  DraftQuestion,
  flowSummary,
  Issue,
  linkedMessagesByQuestion,
  messagesLinkedTo,
  newQuestion,
  orphanedLinks,
  OriginalIds,
  originalIdsOf,
  QuestionKind,
  saveQuestionnaireDraft,
  sortedQuestions,
  toAddQuestions,
  toDraft,
  validateDraft,
} from '../utils/questionnaireDraft';

const RULE_FIELDS: [string, string][] = [
  ['Question', 'text'],
  ['Answer', 'text'],
];

const PASS_LINES: Record<string, string> = {
  text: 'Every question has text',
  description: 'Every question has a description',
  answers: 'Every multiple-choice question has written answers',
  flow: 'Every follow-up points to a later question',
  pattern: 'Every pattern is a valid regular expression',
};

const snapshot = (draft: DraftQuestion[]) => JSON.stringify(toAddQuestions(draft));

const defaultExpanded = (draft: DraftQuestion[]): Set<string> => {
  const sorted = sortedQuestions(draft);
  return new Set((sorted.length <= 3 ? sorted : sorted.slice(0, 1)).map((question) => question.key));
};

const QuestionPreview: React.FC<{ title: string; question: DraftQuestion | undefined; number: number; total: number; canEdit: boolean }> = ({
  title,
  question,
  number,
  total,
  canEdit,
}) => (
  <PhoneFrame
    label={`Question ${number} as shown in the WildlifeNL app`}
    caption="Approximation of the WildlifeNL app. Updates as you edit the selected question."
  >
    {question ? (
      <>
        <p className="rc-qpreview__meta">
          {title} · {number} of {total}
        </p>
        <p className="rc-qpreview__question">{question.text.trim() || 'Your question'}</p>
        {question.description.trim() && <p className="rc-qpreview__description">{question.description}</p>}
        {question.kind === 'multiple' && (
          <div className="rc-qpreview__answers">
            {question.answers.map((answer, index) => (
              <span key={answer.key} className="rc-qpreview__answer">
                <span className={`rc-qpreview__mark${question.allowMultiple ? ' rc-qpreview__mark--square' : ''}`} aria-hidden="true" />
                {answer.text.trim() || `Answer ${answerLetter(index)}`}
              </span>
            ))}
          </div>
        )}
        {(question.kind === 'open' || question.allowOpen) && <span className="rc-qpreview__input">Type your answer…</span>}
        <span className="rc-qpreview__next">Next</span>
      </>
    ) : (
      <p className="rc-qpreview__description">{canEdit ? 'Add a question to see it here.' : 'There are no questions to preview.'}</p>
    )}
  </PhoneFrame>
);

// Questionnaire builder: details, editable question cards, flow, checks and a phone preview, read-only once the experiment is live
const QuestionnaireBuilder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useCurrentUser();
  const [flash, dismissFlash] = useFlash();

  const stateQuestionnaire: QuestionnaireType | undefined = location.state?.questionnaire?.ID === id ? location.state.questionnaire : undefined;
  const stateExperiment: Experiment | undefined = location.state?.experiment;
  const stateExperimentId = stateExperiment?.ID;

  const [questionnaire, setQuestionnaire] = useState<QuestionnaireType | null>(stateQuestionnaire ?? null);
  const [experiment, setExperiment] = useState<Experiment | null>(stateExperiment ?? stateQuestionnaire?.experiment ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [interactionTypes, setInteractionTypes] = useState<InteractionType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [draft, setDraft] = useState<DraftQuestion[]>(() => toDraft(stateQuestionnaire));
  const [baseline, setBaseline] = useState<string>(() => snapshot(toDraft(stateQuestionnaire)));
  const [original, setOriginal] = useState<OriginalIds>(() => originalIdsOf(stateQuestionnaire));
  const [expanded, setExpanded] = useState<Set<string>>(() => defaultExpanded(toDraft(stateQuestionnaire)));
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveBlocked, setSaveBlocked] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dirtyRef = useRef<boolean>(false);
  const { hints, load: loadRules } = useMinLengths(RULE_FIELDS);
  const { hints: nameHints } = useMinLengths([['Questionnaire', 'name']]);

  const [editOpen, setEditOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [details, setDetails] = useState<QuestionnaireDetailsValues>({ name: '', identifier: '', interactionTypeID: '' });
  const [detailErrors, setDetailErrors] = useState<QuestionnaireDetailsErrors>({});
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [cloneTargets, setCloneTargets] = useState<Experiment[] | null>(null);
  const [cloneTargetID, setCloneTargetID] = useState('');

  useDocumentTitle(questionnaire?.name ?? 'Questionnaire');

  // Replaces the stored copy and the draft, used after loading and after saving
  const applyQuestionnaire = useCallback((fresh: QuestionnaireType) => {
    const freshDraft = toDraft(fresh);
    setQuestionnaire(fresh);
    setDraft(freshDraft);
    setBaseline(snapshot(freshDraft));
    setOriginal(originalIdsOf(fresh));
    setExpanded(defaultExpanded(freshDraft));
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const fetched = await getQuestionnaireByID(id);
        if (cancelled) return;
        fetched.questions = fetched.questions || [];
        // Edits made while this request was on its way are kept, only the stored copy is refreshed
        if (dirtyRef.current) {
          setQuestionnaire(fetched);
          setOriginal(originalIdsOf(fetched));
          setBaseline(snapshot(toDraft(fetched)));
        } else {
          applyQuestionnaire(fetched);
        }
        const experimentId = fetched.experiment?.ID ?? stateExperimentId;
        if (experimentId) {
          const [experiments, experimentMessages] = await Promise.all([
            getExperiments(),
            getMessagesByExperimentID(experimentId).catch(() => [] as Message[]),
          ]);
          if (cancelled) return;
          setExperiment(experiments.find((candidate) => candidate.ID === experimentId) ?? fetched.experiment ?? null);
          setMessages(experimentMessages ?? []);
        }
      } catch (error) {
        console.error('Error fetching questionnaire:', error);
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Failed to fetch questionnaire.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, stateExperimentId, applyQuestionnaire]);

  useEffect(() => {
    getAllInteractions()
      .then(setInteractionTypes)
      .catch((error) => console.error('Failed to fetch interaction types:', error));
  }, []);

  const permissions = experiment ? getExperimentPermissions(experiment, user) : null;
  const canEdit = !!permissions?.canEdit;
  const status = experiment ? getStatus(experiment.start, experiment.end) : null;

  const sorted = useMemo(() => sortedQuestions(draft), [draft]);
  const numberOf = useMemo(() => new Map(sorted.map((question, index) => [question.key, index + 1])), [sorted]);
  const linkedByQuestion = useMemo(() => linkedMessagesByQuestion(draft, messages), [draft, messages]);
  const linkedByAnswer = useMemo(() => {
    const result: Record<string, Message[]> = {};
    messages.forEach((message) => {
      if (message.answer?.ID) result[message.answer.ID] = [...(result[message.answer.ID] ?? []), message];
    });
    return result;
  }, [messages]);
  // Every stored answer is deleted on save, so links count from the stored copy, not from what is left in the draft
  const linkedStored = useMemo(() => messagesLinkedTo(originalIdsOf(questionnaire).answerIDs, messages), [questionnaire, messages]);
  const linkedCount = linkedStored.length;
  const orphanLinks = useMemo(() => orphanedLinks(draft, linkedStored), [draft, linkedStored]);

  const issues = useMemo(
    () => validateDraft(draft, { question: hints['Question.text'], answer: hints['Answer.text'] }, linkedByQuestion, orphanLinks),
    [draft, hints, linkedByQuestion, orphanLinks]
  );
  const errors = issues.filter((issue) => issue.level === 'error');
  const suggestions = issues.filter((issue) => issue.level === 'suggestion');
  const dirty = snapshot(draft) !== baseline;
  dirtyRef.current = dirty;
  useBeforeUnload(dirty && canEdit);

  const messagesLink = { to: experiment ? hubPath('messages', experiment.ID) : '/dashboard', state: { experiment } };

  const updateQuestion = (next: DraftQuestion) => setDraft((current) => current.map((question) => (question.key === next.key ? next : question)));

  // Re-sorts the cards once a position is committed, so typing never moves the field away
  const commitPosition = () => setDraft((current) => sortedQuestions(current));

  const addQuestion = (kind: QuestionKind) => {
    const position = draft.reduce((max, question) => Math.max(max, Number.isNaN(question.position) ? 0 : question.position), 0) + 1;
    const created = newQuestion(kind, position);
    setDraft((current) => [...current, created]);
    setExpanded((current) => new Set(current).add(created.key));
    setFocusedKey(created.key);
  };

  const duplicateQuestion = (source: DraftQuestion) => {
    const copy: DraftQuestion = {
      ...newQuestion(source.kind, source.position + 1),
      text: source.text,
      description: source.description,
      allowMultiple: source.allowMultiple,
      allowOpen: source.allowOpen,
      pattern: source.pattern,
    };
    copy.answers = source.answers.map((answer) => ({ key: `${copy.key}-${answer.key}`, text: answer.text, next: answer.next }));
    setDraft((current) => {
      const shifted = current.map((question) =>
        question.key !== source.key && question.position > source.position ? { ...question, position: question.position + 1 } : question
      );
      const index = shifted.findIndex((question) => question.key === source.key);
      return [...shifted.slice(0, index + 1), copy, ...shifted.slice(index + 1)];
    });
    setExpanded((current) => new Set(current).add(copy.key));
  };

  const removeQuestion = (key: string) =>
    setDraft((current) =>
      current
        .filter((question) => question.key !== key)
        .map((question) => ({ ...question, answers: question.answers.map((answer) => (answer.next === key ? { ...answer, next: null } : answer)) }))
    );

  const toggleExpanded = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleSave = async () => {
    if (!questionnaire || !experiment || saving || saveBlocked) return;
    setSaving(true);
    setSaveError(null);
    setNotice(null);

    let rules;
    try {
      rules = await loadRules();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not load the validation rules. Please try again.');
      setSaving(false);
      return;
    }

    // Messages are read again right before saving, a link we cannot see must never be deleted by accident
    let freshMessages: Message[];
    try {
      freshMessages = (await getMessagesByExperimentID(experiment.ID)) ?? [];
      setMessages(freshMessages);
    } catch (error) {
      console.error('Error checking linked messages:', error);
      setSaveError("Couldn't check whether messages are linked to these answers, so nothing was saved. Please try again.");
      setSaving(false);
      return;
    }
    const freshLinked = messagesLinkedTo(original.answerIDs, freshMessages);

    const blocking = validateDraft(
      draft,
      { question: rules['Question.text'], answer: rules['Answer.text'] },
      linkedMessagesByQuestion(draft, freshMessages),
      orphanedLinks(draft, freshLinked)
    ).filter((issue) => issue.level === 'error');
    if (blocking.length) {
      setShowErrors(true);
      setExpanded((current) => {
        const next = new Set(current);
        blocking.forEach((issue) => issue.questionKey && next.add(issue.questionKey));
        return next;
      });
      setSaveError(`${pluralize(blocking.length, 'problem')} to fix first: ${blocking[0].message}${blocking.length > 1 ? ' The Checks panel lists the rest.' : ''}`);
      setSaving(false);
      return;
    }

    try {
      await saveQuestionnaireDraft(questionnaire.ID, original, draft, (kind, deletedId) =>
        setOriginal((current) =>
          kind === 'answer'
            ? { ...current, answerIDs: current.answerIDs.filter((candidate) => candidate !== deletedId) }
            : { ...current, questionIDs: current.questionIDs.filter((candidate) => candidate !== deletedId) }
        )
      );
      const fresh = await getQuestionnaireByID(questionnaire.ID);
      fresh.questions = fresh.questions || [];
      applyQuestionnaire(fresh);
      setShowErrors(false);
      setNotice(`Questionnaire saved. ${pluralize(fresh.questions.length, 'question')} and ${pluralize(
        fresh.questions.reduce((sum, question) => sum + (question.answers?.length ?? 0), 0),
        'answer'
      )} are stored.`);
    } catch (error) {
      console.error('Error saving questions and answers:', error);
      const message = error instanceof Error ? error.message : 'Please try again.';
      setSaveError(`Saving stopped part way: ${message} Your edits are still here, save again to finish.`);
      // What is stored now becomes the starting point, so a retry deletes exactly what is left
      try {
        const current = await getQuestionnaireByID(questionnaire.ID);
        current.questions = current.questions || [];
        setQuestionnaire(current);
        setOriginal(originalIdsOf(current));
        setBaseline(snapshot(toDraft(current)));
      } catch {
        // Without the stored copy a retry could add every question twice, so saving waits for a reload
        setSaveBlocked(true);
        setSaveError(`Saving stopped part way: ${message} The stored questions could not be read back, reload the page before saving again.`);
      }
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    const reset = toDraft(questionnaire);
    setDraft(reset);
    setExpanded(defaultExpanded(reset));
    setShowErrors(false);
    setSaveError(null);
  };

  const openEdit = () => {
    if (!questionnaire) return;
    setDetails({ name: questionnaire.name, identifier: questionnaire.identifier ?? '', interactionTypeID: questionnaire.interactionType?.ID ?? '' });
    setDetailErrors({});
    setDialogError(null);
    setEditOpen(true);
  };

  const openClone = async () => {
    if (!questionnaire) return;
    setDetails({ name: `Copy of ${questionnaire.name}`, identifier: questionnaire.identifier ?? '', interactionTypeID: questionnaire.interactionType?.ID ?? '' });
    setDetailErrors({});
    setDialogError(null);
    setCloneTargetID('');
    setCloneTargets(null);
    setCloneOpen(true);
    try {
      const mine = await getMyExperiments();
      setCloneTargets((mine || []).filter((candidate) => getStatus(candidate.start, candidate.end) === 'Upcoming'));
    } catch (error) {
      console.error('Error fetching experiments:', error);
      setCloneTargets([]);
      setDialogError('Failed to fetch your experiments. Please try again.');
    }
  };

  const loadNameMinLength = async (): Promise<number | undefined | null> => {
    try {
      return await getMinLength('Questionnaire', 'name');
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : 'Could not load the validation rules. Please try again.');
      return null;
    }
  };

  const saveDetails = async () => {
    if (!questionnaire || !experiment || dialogBusy) return;
    setDialogBusy(true);
    setDialogError(null);
    const min = await loadNameMinLength();
    const found = min === null ? null : validateQuestionnaireDetails(details, min);
    if (found) setDetailErrors(found);
    if (!found || Object.keys(found).length) {
      setDialogBusy(false);
      return;
    }

    const updatedData: UpdatedQuestionnaire = {
      name: details.name.trim(),
      identifier: details.identifier.trim(),
      experimentID: experiment.ID,
      interactionTypeID: details.interactionTypeID,
    };
    try {
      await updateQuestionnaireByID(questionnaire.ID, updatedData);
      const fresh = await getQuestionnaireByID(questionnaire.ID);
      setQuestionnaire({ ...fresh, questions: fresh.questions || [] });
      setEditOpen(false);
      setNotice('Details saved.');
    } catch (error) {
      console.error('Error updating questionnaire:', error);
      setDialogError(error instanceof Error ? error.message : 'Failed to update the questionnaire. Please try again.');
    } finally {
      setDialogBusy(false);
    }
  };

  const saveClone = async () => {
    if (!questionnaire || dialogBusy) return;
    setDialogBusy(true);
    setDialogError(null);
    const min = await loadNameMinLength();
    const found = min === null ? null : validateQuestionnaireDetails(details, min);
    if (found) setDetailErrors(found);
    if (found && !cloneTargetID) setDialogError('Choose the experiment that receives the copy.');
    if (!found || Object.keys(found).length || !cloneTargetID) {
      setDialogBusy(false);
      return;
    }

    try {
      const clone = await cloneQuestionnaire(questionnaire.ID, {
        experimentID: cloneTargetID,
        name: details.name.trim(),
        identifier: details.identifier.trim(),
        interactionTypeID: details.interactionTypeID,
      });
      setCloneOpen(false);
      navigate(`/questionnaire/${clone.ID}`, {
        state: {
          questionnaire: clone,
          experiment: cloneTargets?.find((candidate) => candidate.ID === cloneTargetID),
          flash: { tone: 'success', title: 'Questionnaire cloned.', text: `“${clone.name}” has the same questions and answers as “${questionnaire.name}”.` },
        },
      });
    } catch (error) {
      console.error('Error cloning questionnaire:', error);
      setDialogError(error instanceof Error ? error.message : 'Failed to clone the questionnaire. Please try again.');
    } finally {
      setDialogBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!questionnaire) return;
    setDialogBusy(true);
    setDialogError(null);
    try {
      await deleteQuestionnaireWithChildren(questionnaire.ID);
      navigate(experiment ? hubPath('questionnaires', experiment.ID) : '/dashboard', {
        state: { experiment, flash: { tone: 'success', title: 'Questionnaire deleted.', text: `“${questionnaire.name}” and its questions are gone.` } },
      });
    } catch (error) {
      console.error('Error deleting questionnaire:', error);
      setDialogError(error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setDialogBusy(false);
    }
  };

  if (loading && !questionnaire) {
    return (
      <div className="rc-page">
        <LoadingState label="Loading the questionnaire…" />
      </div>
    );
  }

  if (!questionnaire) {
    return loadError ? (
      <div className="rc-page">
        <Banner tone="error" title="Couldn't load the questionnaire.">
          {loadError}
        </Banner>
      </div>
    ) : (
      <ExperimentNotFound what="questionnaire" />
    );
  }

  const totalQuestions = sorted.length;
  const previewQuestion = sorted.find((question) => question.key === focusedKey) ?? sorted[0];
  const previewNumber = previewQuestion ? numberOf.get(previewQuestion.key) ?? 1 : 1;
  const flow = flowSummary(draft);
  const sharedPositions = sorted.length - new Set(sorted.map((question) => question.position)).size;
  const typedQuestions = draft.some((question) => question.kind === 'open' || question.allowOpen);

  const editReason = canEdit ? undefined : permissions && !permissions.isOwner ? `${permissions.reasons.edit}.` : 'Questions lock once the experiment is live.';
  const deleteReason = !canEdit ? editReason : linkedCount ? 'Delete the messages linked to its answers first.' : undefined;

  const readOnlyText = !experiment
    ? 'Loading the experiment…'
    : permissions && !permissions.isOwner
    ? `Only ${experiment.user?.name ?? 'the owner'} can edit this questionnaire. You can still clone it into one of your upcoming experiments.`
    : status === 'Completed'
    ? `The experiment ended on ${formatDate(experiment.end)}. You can still clone this questionnaire into an upcoming experiment.`
    : `The experiment went live on ${formatDate(experiment.start)}. You can still clone this questionnaire into an upcoming experiment.`;

  const checkCategories = ['text', 'description', 'answers', 'flow', 'pattern', 'links'] as const;
  const checkLines: { key: string; kind: 'pass' | 'error' | 'suggestion'; text: string }[] = [];
  checkCategories.forEach((category) => {
    const found = errors.filter((issue: Issue) => issue.check === category);
    if (found.length) {
      found.slice(0, 4).forEach((issue) => checkLines.push({ key: issue.id, kind: 'error', text: issue.message }));
      if (found.length > 4) checkLines.push({ key: `${category}-more`, kind: 'error', text: `${found.length - 4} more like this.` });
    } else if (PASS_LINES[category] && draft.length > 0 && (category !== 'pattern' || typedQuestions)) {
      const minText = category === 'text' && hints['Question.text'] ? ` of ${hints['Question.text']}+ characters` : '';
      checkLines.push({ key: `${category}-pass`, kind: 'pass', text: `${PASS_LINES[category]}${minText}` });
    }
  });
  suggestions.forEach((issue) => checkLines.push({ key: issue.id, kind: 'suggestion', text: issue.message }));

  return (
    <>
      <div className="rc-page rc-page--detail">
        {flash && (
          <Banner tone={flash.tone} title={flash.title} onDismiss={dismissFlash}>
            {flash.text}
          </Banner>
        )}

        <PageHeader
          breadcrumbs={experiment ? [...hubCrumbs(experiment, 'questionnaires'), { label: questionnaire.name }] : [{ label: 'Experiments', to: '/dashboard' }, { label: questionnaire.name }]}
          eyebrow={
            <>
              Questionnaire · Interaction type {questionnaire.interactionType?.name ?? '—'}
              {questionnaire.identifier && (
                <>
                  {' '}
                  · Internal name <span className="rc-mono rc-questionnaire__identifier">{questionnaire.identifier}</span>
                </>
              )}
            </>
          }
          title={questionnaire.name}
          titleTestId="questionnaire-title"
          meta={
            <>
              {status && <StatusChip status={status} label={`Experiment ${status.toLowerCase()}`} />}
              <span>
                {canEdit && experiment ? `Editable until ${formatDate(experiment.start)} · ` : ''}
                {pluralize(totalQuestions, 'question')}
                {linkedCount ? ` · ${pluralize(linkedCount, 'linked message')}` : ''}
              </span>
            </>
          }
          actions={
            <>
              <Button variant="secondary" onClick={openEdit} unavailable={!canEdit} aria-describedby={editReason ? 'questionnaire-actions-note' : undefined} data-testid="edit-questionnaire-button">
                Edit details
              </Button>
              <Button variant="secondary" onClick={openClone} data-testid="clone-questionnaire-button">
                Clone to another experiment…
              </Button>
              <Button
                variant="danger-quiet"
                onClick={() => {
                  setDialogError(null);
                  setDeleteOpen(true);
                }}
                unavailable={!!deleteReason}
                aria-describedby={deleteReason ? 'questionnaire-actions-note' : undefined}
                data-testid="delete-questionnaire-button"
              >
                Delete
              </Button>
            </>
          }
          actionsNote={editReason && deleteReason && editReason !== deleteReason ? `${editReason} ${deleteReason}` : editReason ?? deleteReason}
          actionsNoteId="questionnaire-actions-note"
        />

        {!canEdit && (
          <Banner tone="info" title="Read-only.">
            {readOnlyText}
          </Banner>
        )}
        {notice && (
          <Banner tone="success" onDismiss={() => setNotice(null)}>
            {notice}
          </Banner>
        )}
        {saveError && (
          <Banner tone="error" title="Couldn't save the questionnaire." onDismiss={() => setSaveError(null)}>
            {saveError}
          </Banner>
        )}

        <div className="rc-split">
          <div className="rc-split__main rc-split__main--tight">
            {sorted.length === 0 && !canEdit && <p className="rc-muted">This questionnaire has no questions.</p>}
            {draft.map((question) => (
              <QuestionCard
                key={question.key}
                question={question}
                number={numberOf.get(question.key) ?? 1}
                sorted={sorted}
                numberOf={numberOf}
                readOnly={!canEdit || saving}
                expanded={expanded.has(question.key)}
                issues={issues.filter((issue) => issue.questionKey === question.key)}
                showErrors={showErrors}
                linkedByAnswer={linkedByAnswer}
                messagesLink={messagesLink}
                onToggle={() => toggleExpanded(question.key)}
                onChange={updateQuestion}
                onCommitPosition={commitPosition}
                onDuplicate={() => duplicateQuestion(question)}
                onRemove={() => removeQuestion(question.key)}
                onFocus={() => setFocusedKey(question.key)}
              />
            ))}

            {canEdit && (
              <section className="rc-card rc-card--dashed" aria-labelledby="add-question-title">
                <h2 id="add-question-title" className="rc-subhead">
                  Add a question
                </h2>
                <div className="rc-choice-grid">
                  <button type="button" className="rc-choice" onClick={() => addQuestion('multiple')} disabled={saving} data-testid="add-multiple-choice-question">
                    <span className="rc-choice__title">Multiple choice</span>
                    <span className="rc-choice__desc">
                      App users pick one or more answers you define. Answers can branch to a later question or trigger a message.
                    </span>
                  </button>
                  <button type="button" className="rc-choice" onClick={() => addQuestion('open')} disabled={saving} data-testid="add-open-question">
                    <span className="rc-choice__title">Open answer</span>
                    <span className="rc-choice__desc">App users type a reply. Optionally check it against a pattern, for example a postcode.</span>
                  </button>
                </div>
              </section>
            )}
          </div>

          <aside className="rc-split__aside rc-split__aside--sticky">
            <section className="rc-card rc-card--tight" aria-labelledby="flow-title">
              <h2 id="flow-title" className="rc-section-title">
                Flow
              </h2>
              {flow.length ? (
                <ol className="rc-questionnaire__flow">
                  {flow.map((line) => (
                    <li key={line.key}>
                      {line.text}
                      {line.detail && <span className="rc-muted"> · {line.detail}</span>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rc-muted">No questions yet.</p>
              )}
              <p className="rc-help">
                Questions sharing a position are shown in random order.{' '}
                {sharedPositions ? `${pluralize(sharedPositions, 'question')} share a position right now.` : 'No shared positions right now.'}
              </p>
            </section>

            {canEdit && (
              <section className="rc-card rc-card--tight" aria-labelledby="checks-title" data-testid="questionnaire-checks">
                <h2 id="checks-title" className="rc-section-title">
                  Checks
                </h2>
                <ul className="rc-checks">
                  {checkLines.map((line) => (
                    <li key={line.key}>
                      <span
                        className={`rc-checklist__icon ${
                          line.kind === 'pass' ? 'rc-checklist__icon--done' : line.kind === 'error' ? 'rc-checklist__icon--error' : 'rc-checklist__icon--warn'
                        }`}
                        aria-hidden="true"
                      >
                        {line.kind === 'pass' ? <Icon name="check" size={10} /> : '!'}
                      </span>
                      <span>
                        <span className="rc-visually-hidden">{line.kind === 'pass' ? 'Passed: ' : line.kind === 'error' ? 'Problem: ' : 'Suggestion: '}</span>
                        {line.text}
                      </span>
                    </li>
                  ))}
                  {checkLines.length === 0 && <li className="rc-muted">Add a question to run the checks.</li>}
                </ul>
              </section>
            )}

            <section className="rc-card rc-card--tight" aria-labelledby="preview-title">
              <h2 id="preview-title" className="rc-section-title">
                Preview
              </h2>
              <QuestionPreview title={questionnaire.name} question={previewQuestion} number={previewNumber} total={totalQuestions} canEdit={canEdit} />
            </section>
          </aside>
        </div>
      </div>

      {canEdit && (
        <ActionBar
          tone={dirty ? 'warning' : 'neutral'}
          status={
            dirty
              ? `Unsaved changes${errors.length ? ` · ${pluralize(errors.length, 'problem')}` : ''}${suggestions.length ? ` · ${pluralize(suggestions.length, 'suggestion')}` : ''}`
              : 'No unsaved changes'
          }
        >
          <Button variant="quiet" onClick={discard} unavailable={!dirty || saving}>
            Discard changes
          </Button>
          <Button variant="primary" onClick={handleSave} busy={saving} busyLabel="Saving…" unavailable={!dirty || saveBlocked} data-testid="save-questions-button">
            Save questionnaire
          </Button>
        </ActionBar>
      )}

      <Dialog
        open={editOpen}
        onClose={() => !dialogBusy && setEditOpen(false)}
        title="Edit details"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)} unavailable={dialogBusy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveDetails} busy={dialogBusy} busyLabel="Saving…">
              Save details
            </Button>
          </>
        }
      >
        {dialogError && <Banner tone="error">{dialogError}</Banner>}
        <QuestionnaireDetailsForm
          idPrefix="edit-questionnaire"
          values={details}
          onChange={setDetails}
          errors={detailErrors}
          interactionTypes={interactionTypes}
          nameMinLength={nameHints['Questionnaire.name']}
        />
      </Dialog>

      <Dialog
        open={cloneOpen}
        onClose={() => !dialogBusy && setCloneOpen(false)}
        title="Clone to another experiment"
        description={`The copy gets the saved questions and answers of “${questionnaire.name}”${dirty ? ', not your unsaved changes' : ''}. Only your upcoming experiments can receive it.`}
        size="md"
        testId="clone-questionnaire-popup"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCloneOpen(false)} unavailable={dialogBusy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveClone} busy={dialogBusy} busyLabel="Cloning…" unavailable={!cloneTargets?.length}>
              Clone questionnaire
            </Button>
          </>
        }
      >
        {dialogError && <Banner tone="error">{dialogError}</Banner>}
        <Field id="clone-target" label="Experiment">
          {(control) => (
            <select {...control} className="rc-select" value={cloneTargetID} onChange={(event) => setCloneTargetID(event.target.value)} disabled={!cloneTargets?.length}>
              <option value="">
                {cloneTargets === null ? 'Loading your experiments…' : cloneTargets.length ? 'Choose an upcoming experiment' : 'You have no upcoming experiments'}
              </option>
              {(cloneTargets ?? []).map((target) => (
                <option key={target.ID} value={target.ID}>
                  {target.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <QuestionnaireDetailsForm
          idPrefix="clone-questionnaire"
          values={details}
          onChange={setDetails}
          errors={detailErrors}
          interactionTypes={interactionTypes}
          nameMinLength={nameHints['Questionnaire.name']}
        />
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete “${questionnaire.name}”?`}
        confirmLabel="Delete questionnaire"
        busyLabel="Deleting…"
        busy={dialogBusy}
        error={dialogError}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      >
        The questionnaire and its {pluralize(original.questionIDs.length, 'question')} are removed from the experiment. This can't be undone.
      </ConfirmDialog>
    </>
  );
};

// A new questionnaire ID, for example after a clone, starts the builder fresh instead of reusing the old draft
const Questionnaire: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <QuestionnaireBuilder key={id} />;
};

export default Questionnaire;
