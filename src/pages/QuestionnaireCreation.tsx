import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/ExperimentCreation.css';
import { AddQuestionnaire } from '../types/questionnaire';
import { InteractionType } from '../types/interactiontype';
import { addQuestionnaire } from '../services/questionnaireService';
import { getAllInteractions } from '../services/interactionTypeService';
import { getMinLength } from '../services/schemaService';
import { useCurrentUser } from '../context/UserContext';
import { useExperiment } from '../hooks/useExperiment';
import { getExperimentPermissions } from '../utils/experimentPermissions';
import { useMinLengths } from '../hooks/useMinLengths';
import { useDocumentTitle } from '../hooks/usePageChrome';
import { hubCrumbs, hubPath } from '../components/ExperimentHeader';
import QuestionnaireDetailsForm, {
  QuestionnaireDetailsErrors,
  QuestionnaireDetailsValues,
  validateQuestionnaireDetails,
} from '../components/QuestionnaireDetailsForm';
import Banner from '../components/ui/Banner';
import Button, { ButtonLink } from '../components/ui/Button';
import { ActionBar, PageHeader } from '../components/ui/Layout';
import { formatDate } from '../utils/format';

// New questionnaire for an experiment, it opens in the builder once created so questions can be added
const QuestionnaireCreation: React.FC = () => {
  const { id: experimentID } = useParams<{ id: string }>(); // Get experimentID from URL
  const navigate = useNavigate();
  const { experiment } = useExperiment(experimentID);
  const user = useCurrentUser();
  const permissions = experiment ? getExperimentPermissions(experiment, user) : null;
  const canAdd = !!permissions?.canEdit;
  const { hints } = useMinLengths([['Questionnaire', 'name']]);
  useDocumentTitle('New questionnaire');

  const [values, setValues] = useState<QuestionnaireDetailsValues>({ name: '', identifier: '', interactionTypeID: '' });
  const [errors, setErrors] = useState<QuestionnaireDetailsErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [interactionTypes, setInteractionTypes] = useState<InteractionType[]>([]);

  useEffect(() => {
    getAllInteractions()
      .then(setInteractionTypes)
      .catch((error) => console.error('Failed to fetch interaction types:', error));
  }, []);

  const requiredFilled = [values.name.trim(), values.interactionTypeID].filter(Boolean).length;

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (submitting || !canAdd) return;
    setSubmitting(true);
    setSubmitError(null);

    let nameMinLength: number | undefined;
    try {
      nameMinLength = await getMinLength('Questionnaire', 'name');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not load the validation rules. Please try again.');
      setSubmitting(false);
      return;
    }

    const found = validateQuestionnaireDetails(values, nameMinLength);
    setErrors(found);
    if (Object.keys(found).length || !experimentID) {
      setSubmitting(false);
      return;
    }

    const questionnaireData: AddQuestionnaire = {
      experimentID,
      name: values.name.trim(),
      identifier: values.identifier.trim(),
      interactionTypeID: values.interactionTypeID,
    };

    try {
      const created = await addQuestionnaire(questionnaireData);
      navigate(`/questionnaire/${created.ID}`, {
        state: {
          questionnaire: { ...created, questions: created.questions ?? [] },
          experiment,
          flash: { tone: 'success', title: 'Questionnaire created.', text: 'Add its questions below, then save.' },
        },
      });
    } catch (error) {
      console.error('Error adding questionnaire:', error);
      setSubmitError(error instanceof Error ? error.message : 'Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="rc-page rc-page--detail">
        <PageHeader
          breadcrumbs={experiment ? [...hubCrumbs(experiment, 'questionnaires'), { label: 'New questionnaire' }] : [{ label: 'Experiments', to: '/dashboard' }, { label: 'New questionnaire' }]}
          title="New questionnaire"
          meta={
            <span>
              {experiment ? `For ${experiment.name}, editable until ${formatDate(experiment.start)}. ` : ''}You add the questions in the next step.
            </span>
          }
        />

        <form className="rc-form" onSubmit={handleSubmit} noValidate id="questionnaire-form">
          {experiment && !canAdd && (
            <Banner tone="info" title="Read-only.">
              {permissions?.isOwner ? 'Questionnaires can only be added while the experiment is upcoming.' : `${permissions?.reasons.edit}.`}
            </Banner>
          )}
          {submitError && (
            <Banner tone="error" title="Couldn't create the questionnaire.">
              {submitError}
            </Banner>
          )}
          <section className="rc-card" aria-labelledby="questionnaire-details-title">
            <h2 id="questionnaire-details-title" className="rc-section-title">
              Details
            </h2>
            <QuestionnaireDetailsForm
              idPrefix="new-questionnaire"
              values={values}
              onChange={setValues}
              errors={errors}
              interactionTypes={interactionTypes}
              nameMinLength={hints['Questionnaire.name']}
              interactionAs="cards"
            />
          </section>
        </form>
      </div>

      <ActionBar status={`${requiredFilled} of 2 required fields filled`}>
        <ButtonLink to={experimentID ? hubPath('questionnaires', experimentID) : '/dashboard'} state={{ experiment }} variant="quiet">
          Cancel
        </ButtonLink>
        <Button
          type="submit"
          form="questionnaire-form"
          variant="primary"
          busy={submitting}
          busyLabel="Creating…"
          unavailable={!canAdd}
          data-testid="submit-questionnaire-button"
        >
          Create questionnaire
        </Button>
      </ActionBar>
    </>
  );
};

export default QuestionnaireCreation;
