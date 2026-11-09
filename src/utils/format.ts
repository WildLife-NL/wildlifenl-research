// Formatting helpers so dates, counts and names read the same on every screen

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dayMonthFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const countFormat = new Intl.NumberFormat('en-GB');

const toDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// "9 Nov 2026", or the fallback when the date is missing or invalid
export const formatDate = (value: string | Date | null | undefined, fallback = '—'): string => {
  const date = toDate(value);
  return date ? dateFormat.format(date) : fallback;
};

// "1 Mar – 30 Jun 2026", "1 Oct 2025 – 31 Mar 2026" or "15 Jul 2026 – open"
export const formatPeriod = (start: string | null | undefined, end?: string | null): string => {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate) return '—';
  if (!endDate) return `${dateFormat.format(startDate)} – open`;
  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${dayMonthFormat.format(startDate)} – ${dateFormat.format(endDate)}`;
  }
  return `${dateFormat.format(startDate)} – ${dateFormat.format(endDate)}`;
};

// "1,284", or a dash when there is nothing to count
export const formatCount = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return countFormat.format(value);
};

// "1 questionnaire", "3 questionnaires"
export const pluralize = (count: number, singular: string, plural = `${singular}s`): string =>
  `${countFormat.format(count)} ${count === 1 ? singular : plural}`;

// "Marloes de Vries" becomes "MV"
export const initials = (name: string | null | undefined): string => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
};

const ymd = (year: number, monthIndex: number, day: number): string =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

// Value for an <input type="date"> from an API timestamp, the app stores dates as UTC midnight so the UTC date is read back
export const toDateInputValue = (value: string | null | undefined): string => {
  const date = toDate(value);
  return date ? ymd(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) : '';
};

// API timestamp from an <input type="date"> value, keeping the same UTC-midnight convention the app always used
export const fromDateInputValue = (value: string): string => new Date(value).toISOString();

// "Wild boar road crossings – De Maashorst" becomes "Wild-boar-road-crossings-De-Maashorst"
export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'export';

// Today as yyyy-mm-dd in local time, for file names
export const todayStamp = (now: Date = new Date()): string => ymd(now.getFullYear(), now.getMonth(), now.getDate());
