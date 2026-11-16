// Questionnaire name, internal name and interaction type, used by New questionnaire, Edit details and Clone
import { InteractionType } from '../types/interactiontype';
import { minLengthHint } from '../hooks/useMinLengths';
import { Field } from './ui/Layout';

export interface QuestionnaireDetailsValues {
  name: string;
  identifier: string;
  interactionTypeID: string;
}

export type QuestionnaireDetailsErrors = Partial<Record<keyof QuestionnaireDetailsValues, string>>;

export const validateQuestionnaireDetails = (values: QuestionnaireDetailsValues, nameMinLength?: number): QuestionnaireDetailsErrors => {
  const errors: QuestionnaireDetailsErrors = {};
  const length = values.name.trim().length;
  if (!length) {
    errors.name = 'Enter a name app users will see';
  } else if (nameMinLength && length < nameMinLength) {
    const missing = nameMinLength - length;
    errors.name = `Add at least ${missing} more ${missing === 1 ? 'character' : 'characters'}, the API needs ${nameMinLength}`;
  }
  if (!values.interactionTypeID) errors.interactionTypeID = 'Choose which reports this questionnaire follows';
  return errors;
};

interface QuestionnaireDetailsFormProps {
  idPrefix: string;
  values: QuestionnaireDetailsValues;
  onChange: (values: QuestionnaireDetailsValues) => void;
  errors: QuestionnaireDetailsErrors;
  interactionTypes: InteractionType[];
  nameMinLength?: number;
  interactionAs?: 'cards' | 'select';
}

const QuestionnaireDetailsForm: React.FC<QuestionnaireDetailsFormProps> = ({
  idPrefix,
  values,
  onChange,
  errors,
  interactionTypes,
  nameMinLength,
  interactionAs = 'select',
}) => {
  const set = (key: keyof QuestionnaireDetailsValues, value: string) => onChange({ ...values, [key]: value });

  return (
    <div className="rc-stack">
      <Field id={`${idPrefix}-name`} label="Name" hint={minLengthHint(nameMinLength)} error={errors.name} help="Shown to app users above the questions.">
        {(control) => (
          <input
            {...control}
            type="text"
            className="rc-input rc-input--lg"
            placeholder="Deer sightings"
            value={values.name}
            onChange={(event) => set('name', event.target.value)}
            data-testid="questionnaire-name-input"
          />
        )}
      </Field>

      <Field id={`${idPrefix}-identifier`} label="Internal name" hint="optional" help="A short code for your own exports, app users never see it.">
        {(control) => (
          <input
            {...control}
            type="text"
            className="rc-input rc-input--mono"
            placeholder="deer-s1"
            value={values.identifier}
            onChange={(event) => set('identifier', event.target.value)}
            data-testid="questionnaire-identifier-input"
          />
        )}
      </Field>

      {interactionAs === 'cards' ? (
        <fieldset className="rc-fieldset" aria-describedby={errors.interactionTypeID ? `${idPrefix}-interaction-error` : undefined}>
          <legend className="rc-label">Interaction type</legend>
          <p className="rc-help">App users receive the questionnaire after they report this kind of interaction in the WildlifeNL app.</p>
          <div className="rc-stack rc-stack--sm">
            {interactionTypes.map((type) => {
              const selected = values.interactionTypeID === type.ID;
              return (
                <label key={type.ID} className={`rc-radio-card${selected ? ' is-selected' : ''}`}>
                  <span className="rc-radio-card__head">
                    <input
                      type="radio"
                      name={`${idPrefix}-interaction`}
                      value={type.ID}
                      checked={selected}
                      onChange={() => set('interactionTypeID', type.ID)}
                      data-testid={`interaction-type-${type.ID}`}
                    />
                    <span className="rc-radio-card__text">
                      <span className="rc-radio-card__title">{type.name}</span>
                      {type.description && <span className="rc-radio-card__desc">{type.description}</span>}
                    </span>
                  </span>
                </label>
              );
            })}
            {interactionTypes.length === 0 && <p className="rc-muted">Loading interaction types…</p>}
          </div>
          {errors.interactionTypeID && (
            <p id={`${idPrefix}-interaction-error`} className="rc-error">
              {errors.interactionTypeID}
            </p>
          )}
        </fieldset>
      ) : (
        <Field id={`${idPrefix}-interaction`} label="Interaction type" error={errors.interactionTypeID}>
          {(control) => (
            <select {...control} className="rc-select" value={values.interactionTypeID} onChange={(event) => set('interactionTypeID', event.target.value)}>
              <option value="">Choose an interaction type</option>
              {interactionTypes.map((type) => (
                <option key={type.ID} value={type.ID}>
                  {type.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}
    </div>
  );
};

export default QuestionnaireDetailsForm;
