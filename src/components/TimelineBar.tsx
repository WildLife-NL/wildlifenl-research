// Where today falls in the experiment's period, the bar is decoration and the labels below carry the meaning
import { Experiment } from '../types/experiment';
import { getStatus } from '../utils/experimentStatus';
import { formatDate } from '../utils/format';

interface Segment {
  className: string;
  weight: number;
}

const MIN_WEIGHT = 8;

const TimelineBar: React.FC<{ experiment: Experiment; now?: Date }> = ({ experiment, now = new Date() }) => {
  const status = getStatus(experiment.start, experiment.end, now);
  const start = new Date(experiment.start).getTime();
  const end = experiment.end ? new Date(experiment.end).getTime() : null;
  const today = now.getTime();
  const span = (from: number, to: number) => Math.max(0, to - from);

  let segments: Segment[];
  let labels: { text: string; strong?: boolean }[];
  const endLabel = end ? `Ends ${formatDate(experiment.end)}` : 'No end date';

  if (status === 'Upcoming') {
    const live = end ? span(start, end) : span(today, start) * 4;
    segments = [
      { className: 'rc-timeline__segment--past', weight: span(today, start) },
      { className: 'rc-timeline__segment--live-future', weight: live },
    ];
    labels = [
      { text: `Today · ${formatDate(now)}`, strong: true },
      { text: `Live from ${formatDate(experiment.start)}, questionnaires and messages lock on that day` },
      { text: endLabel },
    ];
  } else if (status === 'Live') {
    const remaining = end ? span(today, end) : span(start, today) / 4;
    segments = [
      { className: 'rc-timeline__segment--live', weight: span(start, today) },
      { className: 'rc-timeline__segment--live-future', weight: remaining },
    ];
    labels = [{ text: `Live since ${formatDate(experiment.start)}` }, { text: `Today · ${formatDate(now)}`, strong: true }, { text: endLabel }];
  } else {
    segments = [
      { className: 'rc-timeline__segment--after', weight: span(start, end ?? today) },
      { className: 'rc-timeline__segment--gap', weight: span(end ?? today, today) },
    ];
    labels = [
      { text: `Ran ${formatDate(experiment.start)} – ${formatDate(experiment.end)}` },
      { text: `Today · ${formatDate(now)}`, strong: true },
    ];
  }

  const total = segments.reduce((sum, segment) => sum + segment.weight, 0) || 1;

  return (
    <div className="rc-timeline">
      <div className="rc-timeline__bar" aria-hidden="true">
        {segments.map((segment, index) => (
          <div key={index} className={segment.className} style={{ flex: `${Math.max(MIN_WEIGHT, (segment.weight / total) * 100)} 1 0` }} />
        ))}
      </div>
      <div className="rc-timeline__labels">
        {labels.map((label, index) => (label.strong ? <strong key={index}>{label.text}</strong> : <span key={index}>{label.text}</span>))}
      </div>
    </div>
  );
};

export default TimelineBar;
