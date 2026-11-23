import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import '../styles/MessageCreation.css';
import { addMessage } from '../services/messageService';
import { getAllSpecies } from '../services/speciesService';
import { getAllTriggerTypes } from '../services/triggerTypeService';
import { getQuestionnaireByExperimentID } from '../services/questionnaireService';
import { Species } from '../types/species';
import { Questionnaire } from '../types/questionnaire';
import { useCurrentUser } from '../context/UserContext';
import { useExperiment } from '../hooks/useExperiment';
import { minLengthHint, useMinLengths } from '../hooks/useMinLengths';
import { useBeforeUnload, useDocumentTitle } from '../hooks/usePageChrome';
import { hubCrumbs, hubPath } from '../components/ExperimentHeader';
import SeverityPicker from '../components/SeverityPicker';
import Banner from '../components/ui/Banner';
import Button, { ButtonLink } from '../components/ui/Button';
import Combobox from '../components/ui/Combobox';
import { ActionBar, Field, PageHeader, PhoneFrame } from '../components/ui/Layout';
import { LOGO_SRC } from '../appInfo';
import { getExperimentPermissions } from '../utils/experimentPermissions';
import { formatPeriod } from '../utils/format';
import { answerLetter } from '../utils/questionnaireDraft';
import { describeTrigger, TRIGGER_DESCRIPTIONS, triggerLabel } from '../utils/messageTrigger';

const FALLBACK_TRIGGERS = ['encounter', 'answer', 'alarm'];
const MESSAGE_FIELDS: [string, string][] = [
  ['Message', 'name'],
  ['Message', 'text'],
];

type MessageErrors = Partial<Record<'title' | 'text' | 'species' | 'meters' | 'minutes' | 'answer', string>>;

const shortBy = (value: string, min: number | undefined): string | undefined => {
  const length = value.trim().length;
  if (!min || length >= min) return undefined;
  const missing = min - length;
  return `Add at least ${missing} more ${missing === 1 ? 'character' : 'characters'}, the API needs ${min}`;
};

// Message composer: content, one trigger out of three described choices, severity, and a preview of what app users receive
const MessageCreation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { experiment } = useExperiment(id);
  const { hints, load: loadMinLengths } = useMinLengths(MESSAGE_FIELDS);
  useDocumentTitle('New message');

  const presetAnswerID: string | undefined = location.state?.answerID;

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [trigger, setTrigger] = useState<string>(presetAnswerID ? 'answer' : location.state?.trigger ?? 'encounter');
  const [triggerTypes, setTriggerTypes] = useState<string[]>(FALLBACK_TRIGGERS);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [speciesID, setSpeciesID] = useState('');
  const [meters, setMeters] = useState('');
  const [minutes, setMinutes] = useState('');
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[] | null>(null);
  const [questionnaireID, setQuestionnaireID] = useState('');
  const [questionID, setQuestionID] = useState('');
  const [answerID, setAnswerID] = useState(presetAnswerID ?? '');
  const [severity, setSeverity] = useState(3);
  const [errors, setErrors] = useState<MessageErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useBeforeUnload((title !== '' || text !== '') && !submitting);

  useEffect(() => {
    getAllTriggerTypes()
      .then((types) => types.length && setTriggerTypes(types))
      .catch((error) => console.error('Error fetching trigger types:', error));
    getAllSpecies()
      .then(setSpeciesList)
      .catch((error) => console.error('Error fetching species:', error));
  }, []);

  useEffect(() => {
    if (!id) return;
    getQuestionnaireByExperimentID(id)
      .then((found) => setQuestionnaires(found ?? []))
      .catch((error) => {
        console.error('Error fetching questionnaires:', error);
        setQuestionnaires([]);
      });
  }, [id]);

  // A preset answer (from an older link) selects its questionnaire and question
  useEffect(() => {
    if (!presetAnswerID || !questionnaires) return;
    for (const questionnaire of questionnaires) {
      for (const question of questionnaire.questions ?? []) {
        if ((question.answers ?? []).some((answer) => answer.ID === presetAnswerID)) {
          setQuestionnaireID(questionnaire.ID);
          setQuestionID(question.ID);
          return;
        }
      }
    }
  }, [presetAnswerID, questionnaires]);

  const permissions = experiment ? getExperimentPermissions(experiment, user) : null;
  const canAdd = !!permissions?.canEdit;

  const species = speciesList.find((candidate) => candidate.ID === speciesID);
  const speciesOptions = useMemo(
    () =>
      speciesList
        .map((candidate) => ({ value: candidate.ID, label: candidate.commonName || candidate.name, secondary: candidate.commonName ? `(${candidate.name})` : undefined }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [speciesList]
  );

  const questionnaire = questionnaires?.find((candidate) => candidate.ID === questionnaireID);
  const questions = [...(questionnaire?.questions ?? [])].sort((a, b) => a.index - b.index).filter((question) => (question.answers ?? []).length > 0);
  const question = questions.find((candidate) => candidate.ID === questionID);
  const answers = [...(question?.answers ?? [])].sort((a, b) => a.index - b.index);
  const answer = answers.find((candidate) => candidate.ID === answerID);

  const required: boolean[] = [!!title.trim(), !!text.trim()];
  if (trigger === 'encounter') required.push(!!speciesID, Number(meters) >= 1, Number(minutes) >= 1);
  if (trigger === 'answer') required.push(!!answerID);
  const filled = required.filter(Boolean).length;

  const sendsWhen = describeTrigger({
    trigger,
    species,
    encounterMeters: Number(meters) || undefined,
    encounterMinutes: Number(minutes) || undefined,
    questionText: question?.text,
    answerText: answer?.text,
    livingLab: experiment?.livingLab?.name,
  });

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (submitting || !canAdd) return;
    setSubmitting(true);
    setSubmitError(null);

    let minLengths;
    try {
      minLengths = await loadMinLengths();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not load the validation rules. Please try again.');
      setSubmitting(false);
      return;
    }

    const found: MessageErrors = {
      title: !title.trim() ? 'Write the notification title' : shortBy(title, minLengths['Message.name']),
      text: !text.trim() ? 'Write the message app users read' : shortBy(text, minLengths['Message.text']),
    };
    if (trigger === 'encounter') {
      if (!speciesID) found.species = 'Choose the species of the encounter';
      if (!(Number(meters) >= 1)) found.meters = 'Enter a distance of 1 metre or more';
      if (!(Number(minutes) >= 1)) found.minutes = 'Enter 1 minute or more';
    }
    if (trigger === 'answer' && !answerID) found.answer = 'Choose the answer that sends this message';
    (Object.keys(found) as (keyof MessageErrors)[]).forEach((key) => !found[key] && delete found[key]);
    setErrors(found);
    if (Object.keys(found).length || !id) {
      setSubmitting(false);
      return;
    }

    const messageData: Record<string, unknown> = {
      name: title.trim(),
      text: text.trim(),
      severity,
      trigger,
      experimentID: id,
    };
    if (trigger === 'encounter') {
      messageData.speciesID = speciesID;
      messageData.encounterMeters = Number(meters);
      messageData.encounterMinutes = Number(minutes);
    } else if (trigger === 'answer') {
      messageData.answerID = answerID;
    } else if (speciesID) {
      messageData.speciesID = speciesID;
    }

    try {
      await addMessage(messageData);
      navigate(hubPath('messages', id), {
        state: { experiment, flash: { tone: 'success', title: 'Message created.', text: `“${title.trim()}” is sent when: ${sendsWhen}` } },
      });
    } catch (error) {
      console.error('Error adding message:', error);
      setSubmitError(error instanceof Error ? error.message : 'Please check your input and try again.');
      setSubmitting(false);
    }
  };

  const speciesField = (optional: boolean) => (
    <Field id="message-species" label="Species" hint={optional ? 'optional' : undefined} error={errors.species} help="Search by common or scientific name.">
      {(control) => (
        <Combobox
          id={control.id}
          aria-describedby={control['aria-describedby']}
          aria-invalid={control['aria-invalid']}
          options={speciesOptions}
          value={speciesID}
          onChange={setSpeciesID}
          placeholder={speciesList.length ? 'Red deer' : 'Loading species…'}
          testId="message-species-input"
        />
      )}
    </Field>
  );

  return (
    <>
      <div className="rc-page rc-page--detail">
        <PageHeader
          breadcrumbs={experiment ? [...hubCrumbs(experiment, 'messages'), { label: 'New message' }] : [{ label: 'Experiments', to: '/dashboard' }, { label: 'New message' }]}
          title="New message"
          meta={
            experiment && (
              <span>
                Sent to app users{experiment.livingLab ? ` in ${experiment.livingLab.name}` : ''} while the experiment is live, {formatPeriod(experiment.start, experiment.end)}.
              </span>
            )
          }
        />

        {experiment && !canAdd && (
          <Banner tone="info" title="Read-only.">
            {permissions?.isOwner ? 'Messages can only be added while the experiment is upcoming.' : `${permissions?.reasons.edit}.`}
          </Banner>
        )}
        {submitError && (
          <Banner tone="error" title="Couldn't create the message.">
            {submitError}
          </Banner>
        )}

        <div className="rc-split">
          <form className="rc-split__main rc-split__main--tight rc-form" onSubmit={handleSubmit} noValidate id="message-form">
            <section className="rc-card" aria-labelledby="content-title">
              <h2 id="content-title" className="rc-section-title">
                Content
              </h2>
              <Field id="message-title" label="Title" hint={['notification title', minLengthHint(hints['Message.name'])].filter(Boolean).join(' · ')} error={errors.title}>
                {(control) => (
                  <input {...control} type="text" className="rc-input rc-input--lg" value={title} onChange={(event) => setTitle(event.target.value)} data-testid="message-title-input" />
                )}
              </Field>
              <Field
                id="message-text"
                label="Text"
                hint={[minLengthHint(hints['Message.text']), 'shown exactly as written'].filter(Boolean).join(' · ')}
                error={errors.text}
                help={`${text.length} ${text.length === 1 ? 'character' : 'characters'}`}
              >
                {(control) => <textarea {...control} rows={4} className="rc-textarea" value={text} onChange={(event) => setText(event.target.value)} data-testid="message-text-input" />}
              </Field>
            </section>

            <section className="rc-card" aria-labelledby="trigger-title">
              <h2 id="trigger-title" className="rc-section-title">
                When to send
              </h2>
              <fieldset className="rc-fieldset">
                <legend className="rc-muted rc-message__legend">Choose one trigger. Only the fields that trigger needs are shown.</legend>
                {triggerTypes.map((type) => {
                  const selected = trigger === type;
                  return (
                    <div key={type} className={`rc-radio-card${selected ? ' is-selected' : ''}`}>
                      <label className="rc-radio-card__head">
                        <input type="radio" name="trigger" value={type} checked={selected} onChange={() => setTrigger(type)} data-testid={`trigger-${type}`} />
                        <span className="rc-radio-card__text">
                          <span className="rc-radio-card__title">{triggerLabel(type)}</span>
                          <span className="rc-radio-card__desc">{TRIGGER_DESCRIPTIONS[type] ?? 'Sent when this trigger fires.'}</span>
                        </span>
                      </label>

                      {selected && type === 'encounter' && (
                        <div className="rc-radio-card__body">
                          <div className="rc-message__grow">{speciesField(false)}</div>
                          <Field id="message-meters" label="Within" error={errors.meters} className="rc-message__unit">
                            {(control) => (
                              <span className="rc-unit-input">
                                <input {...control} type="number" min={1} inputMode="numeric" value={meters} onChange={(event) => setMeters(event.target.value)} data-testid="message-meters-input" />
                                <span className="rc-unit-input__suffix">m</span>
                              </span>
                            )}
                          </Field>
                          <Field id="message-minutes" label="Readings within" error={errors.minutes} className="rc-message__unit">
                            {(control) => (
                              <span className="rc-unit-input">
                                <input {...control} type="number" min={1} inputMode="numeric" value={minutes} onChange={(event) => setMinutes(event.target.value)} data-testid="message-minutes-input" />
                                <span className="rc-unit-input__suffix">min</span>
                              </span>
                            )}
                          </Field>
                        </div>
                      )}

                      {selected && type === 'answer' && (
                        <div className="rc-radio-card__body rc-message__answer">
                          {questionnaires && questionnaires.every((candidate) => !(candidate.questions ?? []).some((q) => (q.answers ?? []).length)) ? (
                            <p className="rc-muted">No questionnaire of this experiment has multiple-choice answers yet. Add questions first.</p>
                          ) : (
                            <>
                              <Field id="message-questionnaire" label="Questionnaire">
                                {(control) => (
                                  <select
                                    {...control}
                                    className="rc-select"
                                    value={questionnaireID}
                                    onChange={(event) => {
                                      setQuestionnaireID(event.target.value);
                                      setQuestionID('');
                                      setAnswerID('');
                                    }}
                                    data-testid="message-questionnaire-select"
                                  >
                                    <option value="">{questionnaires ? 'Choose a questionnaire' : 'Loading questionnaires…'}</option>
                                    {(questionnaires ?? []).map((candidate) => (
                                      <option key={candidate.ID} value={candidate.ID}>
                                        {candidate.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </Field>
                              <Field id="message-question" label="Question">
                                {(control) => (
                                  <select
                                    {...control}
                                    className="rc-select"
                                    value={questionID}
                                    disabled={!questionnaire}
                                    onChange={(event) => {
                                      setQuestionID(event.target.value);
                                      setAnswerID('');
                                    }}
                                    data-testid="message-question-select"
                                  >
                                    <option value="">{questionnaire && !questions.length ? 'No multiple-choice questions' : 'Choose a question'}</option>
                                    {questions.map((candidate, index) => (
                                      <option key={candidate.ID} value={candidate.ID}>
                                        {index + 1}. {candidate.text}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </Field>
                              <Field id="message-answer" label="Answer" error={errors.answer}>
                                {(control) => (
                                  <select
                                    {...control}
                                    className="rc-select"
                                    value={answerID}
                                    disabled={!question}
                                    onChange={(event) => setAnswerID(event.target.value)}
                                    data-testid="message-answer-select"
                                  >
                                    <option value="">Choose an answer</option>
                                    {answers.map((candidate, index) => (
                                      <option key={candidate.ID} value={candidate.ID}>
                                        {answerLetter(index)} · {candidate.text}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </Field>
                            </>
                          )}
                        </div>
                      )}

                      {selected && type === 'alarm' && (
                        <div className="rc-radio-card__body">
                          <div className="rc-message__grow">{speciesField(true)}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </fieldset>
            </section>

            <section className="rc-card" aria-labelledby="importance-title">
              <h2 id="importance-title" className="rc-section-title">
                Importance
              </h2>
              <SeverityPicker value={severity} onChange={setSeverity} />
            </section>
          </form>

          <aside className="rc-split__aside rc-split__aside--sticky">
            <section className="rc-card rc-card--tight" aria-labelledby="message-preview-title">
              <h2 id="message-preview-title" className="rc-section-title">
                Preview
              </h2>
              <PhoneFrame label="Notification as app users receive it" variant="notification" caption="Approximation of the WildlifeNL app notification. Updates as you type.">
                <div className="rc-notification">
                  <div className="rc-notification__app">
                    <img src={LOGO_SRC} alt="" />
                    <strong>WildlifeNL</strong>
                    <span className="rc-notification__time">now</span>
                  </div>
                  <p className="rc-notification__title">{title.trim() || 'Notification title'}</p>
                  <p className="rc-notification__text">{text.trim() || 'The text app users read appears here.'}</p>
                </div>
              </PhoneFrame>
            </section>
            <section className="rc-card rc-card--sunken" aria-labelledby="sends-when-title">
              <h2 id="sends-when-title" className="rc-subhead">
                Sends when
              </h2>
              <p className="rc-message__sentence" data-testid="sends-when">
                {sendsWhen}
              </p>
              <p className="rc-help">Delivered messages are counted per message and exportable as conveyances.</p>
            </section>
          </aside>
        </div>
      </div>

      <ActionBar status={`${filled} of ${required.length} required fields filled`}>
        <ButtonLink to={id ? hubPath('messages', id) : '/dashboard'} state={{ experiment }} variant="quiet">
          Cancel
        </ButtonLink>
        <Button
          type="submit"
          form="message-form"
          variant="primary"
          busy={submitting}
          busyLabel="Creating…"
          unavailable={!canAdd}
          data-testid="submit-message-button"
        >
          Create message
        </Button>
      </ActionBar>
    </>
  );
};

export default MessageCreation;
