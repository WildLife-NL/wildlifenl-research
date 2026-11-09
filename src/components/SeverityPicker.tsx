// Message severity 1 to 5 as one radio group, each level shows its swatch beside the word
import { SEVERITY_LABELS } from '../utils/messageTrigger';

interface SeverityPickerProps {
  value: number;
  onChange: (value: number) => void;
}

const LEVELS = [1, 2, 3, 4, 5];

const SeverityPicker: React.FC<SeverityPickerProps> = ({ value, onChange }) => (
  <fieldset className="rc-fieldset">
    <legend className="rc-label">Severity</legend>
    <div className="rc-severity">
      {LEVELS.map((level) => (
        <label key={level} className={`rc-severity__option${value === level ? ' is-selected' : ''}`}>
          <input
            type="radio"
            name="severity"
            value={level}
            checked={value === level}
            onChange={() => onChange(level)}
            data-testid={`severity-${level}`}
          />
          <span className="rc-swatch" style={{ background: `var(--rc-sev-${level})` }} aria-hidden="true" />
          {SEVERITY_LABELS[level]}
        </label>
      ))}
    </div>
    <p className="rc-help">
      1 debug · 2 info · 3 warning · 4 urgent · 5 critical. Visible to researchers and in exports, app users see the message, not the level.
    </p>
  </fieldset>
);

export default SeverityPicker;
