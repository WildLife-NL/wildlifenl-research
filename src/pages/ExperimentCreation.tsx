import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ExperimentCreation.css';
import { getAllLivingLabs } from '../services/livingLabService';
import { addExperiment } from '../services/experimentService';
import { LivingLab } from '../types/livinglab';
import { useMinLengths } from '../hooks/useMinLengths';
import { useBeforeUnload, useDocumentTitle } from '../hooks/usePageChrome';
import ExperimentDetailsForm, {
  EXPERIMENT_FIELDS,
  ExperimentDetailsErrors,
  ExperimentDetailsValues,
  validateExperimentDetails,
} from '../components/ExperimentDetailsForm';
import Banner from '../components/ui/Banner';
import Button, { ButtonLink } from '../components/ui/Button';
import { ActionBar, PageHeader } from '../components/ui/Layout';
import { fromDateInputValue } from '../utils/format';

const EMPTY: ExperimentDetailsValues = { name: '', description: '', start: '', end: '', livingLabID: '' };

// New experiment form, the experiment opens in its hub once created
const ExperimentCreation: React.FC = () => {
  const navigate = useNavigate();
  useDocumentTitle('New experiment');
  const { hints, load: loadMinLengths } = useMinLengths(EXPERIMENT_FIELDS);

  const [values, setValues] = useState<ExperimentDetailsValues>(EMPTY);
  const [errors, setErrors] = useState<ExperimentDetailsErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [livingLabs, setLivingLabs] = useState<LivingLab[]>([]);
  const [loadingLabs, setLoadingLabs] = useState<boolean>(true);

  const dirty = values.name !== '' || values.description !== '' || values.start !== '';
  useBeforeUnload(dirty && !submitting);

  useEffect(() => {
    getAllLivingLabs()
      .then(setLivingLabs)
      .catch((error) => console.error('Failed to fetch living labs:', error))
      .finally(() => setLoadingLabs(false));
  }, []);

  const requiredFilled = [values.name.trim(), values.description.trim(), values.start].filter(Boolean).length;

  const handleSubmitExperiment = async (event?: FormEvent) => {
    event?.preventDefault();
    if (submitting) return;
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

    const found = validateExperimentDetails(values, minLengths);
    setErrors(found);
    if (Object.keys(found).length) {
      setSubmitting(false);
      return;
    }

    const experimentData = {
      name: values.name.trim(),
      description: values.description.trim(),
      start: fromDateInputValue(values.start),
      ...(values.end && { end: fromDateInputValue(values.end) }),
      ...(values.livingLabID && { livingLabID: values.livingLabID }),
    };

    try {
      const created = await addExperiment(experimentData);
      navigate(`/experiment/${created.ID}`, {
        state: {
          experiment: created,
          flash: { tone: 'success', title: 'Experiment created.', text: 'Add questionnaires and messages before it goes live.' },
        },
      });
    } catch (error) {
      console.error('Error adding experiment:', error);
      setSubmitError(error instanceof Error ? error.message : 'Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="rc-page rc-page--detail">
        <PageHeader
          breadcrumbs={[{ label: 'Experiments', to: '/dashboard' }, { label: 'New experiment' }]}
          title="New experiment"
          meta={<span>Questionnaires and messages are added once the experiment exists, all of it stays editable until the start date.</span>}
        />

        <form className="rc-form" onSubmit={handleSubmitExperiment} noValidate id="experiment-form">
          {submitError && (
            <Banner tone="error" title="Couldn't create the experiment.">
              {submitError}
            </Banner>
          )}
          <section className="rc-card" aria-labelledby="experiment-details-title">
            <h2 id="experiment-details-title" className="rc-section-title">
              Details
            </h2>
            <ExperimentDetailsForm
              idPrefix="new-experiment"
              values={values}
              onChange={setValues}
              errors={errors}
              livingLabs={livingLabs}
              labsLoading={loadingLabs}
              minLengths={hints}
            />
          </section>
        </form>
      </div>

      <ActionBar status={`${requiredFilled} of 3 required fields filled`}>
        <ButtonLink to="/dashboard" variant="quiet">
          Cancel
        </ButtonLink>
        <Button
          type="submit"
          form="experiment-form"
          variant="primary"
          busy={submitting}
          busyLabel="Creating…"
          data-testid="submit-experiment-button"
        >
          Create experiment
        </Button>
      </ActionBar>
    </>
  );
};

export default ExperimentCreation;
