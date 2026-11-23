// Experiment lifecycle helpers shared by every screen, replacing the seven copies of getStatus

export type ExperimentStatus = 'Upcoming' | 'Live' | 'Completed';

const DAY_MS = 24 * 60 * 60 * 1000;

// Upcoming before the start, Completed after an end date, Live otherwise so open-ended experiments stay Live
export const getStatus = (start: string, end?: string | null, now: Date = new Date()): ExperimentStatus => {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  if (startDate > now) {
    return 'Upcoming';
  }
  if (endDate && endDate < now) {
    return 'Completed';
  }
  return 'Live';
};

// Whole calendar days from one moment to another, counted on local dates so the time of day never matters
export const daysBetween = (from: Date, to: Date): number => {
  const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((toDay - fromDay) / DAY_MS);
};

const inDays = (days: number): string => {
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
};

const daysAgo = (days: number): string => {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
};

// Short phrase about where the experiment is in its lifecycle, for example "Starts in 15 days"
export const describeTiming = (start: string, end?: string | null, now: Date = new Date()): string => {
  const status = getStatus(start, end, now);

  if (status === 'Upcoming') {
    return `Starts ${inDays(daysBetween(now, new Date(start)))}`;
  }
  if (status === 'Completed') {
    return `Ended ${daysAgo(daysBetween(new Date(end as string), now))}`;
  }
  if (!end) {
    return 'Live, no end date';
  }
  return `Ends ${inDays(daysBetween(now, new Date(end)))}`;
};

// Experiments that are live at any moment of the range, both ends are optional yyyy-mm-dd dates and the last day counts in full
export const overlapsRange = (start: string, end: string | null | undefined, from: string, until: string): boolean => {
  const experimentStart = new Date(start).getTime();
  const experimentEnd = end ? new Date(end).getTime() : Number.POSITIVE_INFINITY;

  if (from && !(experimentEnd > new Date(from).getTime())) {
    return false;
  }
  if (until && !(experimentStart < new Date(until).getTime() + DAY_MS)) {
    return false;
  }
  return true;
};
