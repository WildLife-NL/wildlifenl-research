// An experiment as one tappable card, used instead of the table on phone
import { Link } from 'react-router-dom';
import { Experiment } from '../types/experiment';
import { describeTiming, getStatus } from '../utils/experimentStatus';
import { formatCount, formatPeriod, pluralize } from '../utils/format';
import StatusChip from './ui/StatusChip';

const ExperimentCard: React.FC<{ experiment: Experiment }> = ({ experiment }) => {
  const status = getStatus(experiment.start, experiment.end);
  const third =
    status === 'Upcoming'
      ? describeTiming(experiment.start, experiment.end).toLowerCase()
      : experiment.responses === undefined
      ? 'responses not counted'
      : `${formatCount(experiment.responses)} ${experiment.responses === 1 ? 'response' : 'responses'}`;

  return (
    <Link to={`/experiment/${experiment.ID}`} state={{ experiment }} className="rc-exp-card" data-testid={`experiment-card-${experiment.ID}`}>
      <span className="rc-exp-card__name">{experiment.name}</span>
      <span className="rc-exp-card__meta">
        <StatusChip status={status} size="sm" />
        <span>{formatPeriod(experiment.start, experiment.end)}</span>
      </span>
      <span className="rc-exp-card__counts">
        {pluralize(experiment.numberOfQuestionnaires ?? 0, 'questionnaire')} · {pluralize(experiment.numberOfMessages ?? 0, 'message')} · {third}
      </span>
    </Link>
  );
};

export default ExperimentCard;
