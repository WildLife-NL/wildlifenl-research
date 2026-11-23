// Status chip for an experiment, the glyph shape differs per status so colour is never the only cue
import { ExperimentStatus } from '../../utils/experimentStatus';

interface StatusChipProps {
  status: ExperimentStatus;
  label?: string;
  size?: 'sm' | 'default';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, label, size = 'default' }) => (
  <span className={`rc-chip rc-chip--${status.toLowerCase()}${size === 'sm' ? ' rc-chip--sm' : ''}`}>
    <span className="rc-chip__glyph" aria-hidden="true" />
    {label ?? status}
  </span>
);

export default StatusChip;
