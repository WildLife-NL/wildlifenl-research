// Experiment name, description, period and living lab, used by New experiment and the Edit details dialog
import { LivingLab } from '../types/livinglab';
import { Field } from './ui/Layout';
import { minLengthHint, MinLengths } from '../hooks/useMinLengths';

export interface ExperimentDetailsValues {
  name: string;
  description: string;
  start: string;
  end: string;
  livingLabID: string;
}

export type ExperimentDetailsErrors = Partial<Record<keyof ExperimentDetailsValues, string>>;

export const EXPERIMENT_FIELDS: [string, string][] = [
  ['Experiment', 'name'],
  ['Experiment', 'description'],
];

const missingCharacters = (value: string, min: number | undefined): string | undefined => {
  const length = value.trim().length;
  if (!min || length >= min) return undefined;
  const missing = min - length;
  return `Add at least ${missing} more ${missing === 1 ? 'character' : 'characters'}, the API needs ${min}`;
};

// Same rules as before the redesign: start after now, end after start, plus the API minimum lengths
export const validateExperimentDetails = (values: ExperimentDetailsValues, minLengths: MinLengths, now: Date = new Date()): ExperimentDetailsErrors => {
  const errors: ExperimentDetailsErrors = {};

  if (!values.name.trim()) errors.name = 'Enter a name';
  else errors.name = missingCharacters(values.name, minLengths['Experiment.name']);

  if (!values.description.trim()) errors.description = 'Describe what the experiment studies';
  else errors.description = missingCharacters(values.description, minLengths['Experiment.description']);

  if (!values.start) {
    errors.start = 'Choose the day the experiment goes live';
  } else if (new Date(values.start) < now) {
    errors.start = 'The start date cannot be in the past, choose tomorrow or later';
  }

  if (values.end && values.start && new Date(values.end) <= new Date(values.start)) {
    errors.end = 'The end date must be after the start date';
  }

  (Object.keys(errors) as (keyof ExperimentDetailsValues)[]).forEach((key) => {
    if (!errors[key]) delete errors[key];
  });
  return errors;
};

interface ExperimentDetailsFormProps {
  idPrefix: string;
  values: ExperimentDetailsValues;
  onChange: (values: ExperimentDetailsValues) => void;
  errors: ExperimentDetailsErrors;
  livingLabs: LivingLab[];
  labsLoading?: boolean;
  minLengths: MinLengths;
}

const ExperimentDetailsForm: React.FC<ExperimentDetailsFormProps> = ({ idPrefix, values, onChange, errors, livingLabs, labsLoading, minLengths }) => {
  const set = (key: keyof ExperimentDetailsValues) => (event: { target: { value: string } }) => onChange({ ...values, [key]: event.target.value });

  return (
    <div className="rc-stack">
      <Field id={`${idPrefix}-name`} label="Name" hint={minLengthHint(minLengths['Experiment.name'])} error={errors.name}>
        {(control) => (
          <input
            {...control}
            type="text"
            className="rc-input rc-input--lg"
            placeholder="Winter feeding and deer activity – Veluwe"
            value={values.name}
            onChange={set('name')}
            data-testid="experiment-name-input"
          />
        )}
      </Field>

      <Field
        id={`${idPrefix}-description`}
        label="Description"
        hint={minLengthHint(minLengths['Experiment.description'])}
        error={errors.description}
        help="What the experiment studies and what app users will notice of it."
      >
        {(control) => (
          <textarea {...control} rows={4} className="rc-textarea" value={values.description} onChange={set('description')} data-testid="experiment-description-input" />
        )}
      </Field>

      <div className="rc-form-row">
        <Field id={`${idPrefix}-start`} label="Start date" error={errors.start} help="The experiment goes live at the start of this day.">
          {(control) => <input {...control} type="date" className="rc-input" value={values.start} onChange={set('start')} data-testid="experiment-start-input" />}
        </Field>
        <Field id={`${idPrefix}-end`} label="End date" hint="optional" error={errors.end} help="Leave empty to run until you stop it.">
          {(control) => <input {...control} type="date" className="rc-input" value={values.end} onChange={set('end')} data-testid="experiment-end-input" />}
        </Field>
      </div>

      <Field id={`${idPrefix}-lab`} label="Living lab" hint="optional" help="Messages and questionnaires only reach app users inside this area.">
        {(control) => (
          <select {...control} className="rc-select" value={values.livingLabID} onChange={set('livingLabID')} disabled={labsLoading} data-testid="experiment-lab-select">
            <option value="">{labsLoading ? 'Loading living labs…' : 'No living lab'}</option>
            {livingLabs.map((lab) => (
              <option key={lab.ID} value={lab.ID}>
                {lab.name}
              </option>
            ))}
          </select>
        )}
      </Field>
    </div>
  );
};

export default ExperimentDetailsForm;
