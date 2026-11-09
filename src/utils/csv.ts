// Flattening API records into table rows and CSV files, moved out of the Export page so every export shares it
import { slugify, todayStamp } from './format';

export interface TableData {
  headers: string[];
  rows: string[][];
}

// Collects every nested key as one column name joined with "_", for example interaction_location_latitude
const extractKeys = (obj: any, parentKey: string, keys: Set<string>) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fullKey = parentKey ? `${parentKey}_${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        extractKeys(obj[key], fullKey, keys);
      } else {
        keys.add(fullKey);
      }
    }
  }
};

// Dynamic and nested fields become columns, booleans are written as true or false and null as "null", as the CSV always was
export const buildTableData = (data: any[] | null | undefined): TableData => {
  if (!data || data.length === 0) return { headers: [], rows: [] };

  const allKeys = new Set<string>();
  data.forEach((obj) => extractKeys(obj, '', allKeys));

  const headers = Array.from(allKeys);
  const rows = data.map((obj) =>
    headers.map((key) => {
      let value = obj;
      key.split('_').forEach((part) => {
        value = value ? value[part] : '';
      });
      if (typeof value === 'boolean') return value.toString();
      if (typeof value === 'object') return JSON.stringify(value);
      return value === undefined ? '' : String(value);
    })
  );

  return { headers, rows };
};

// Quote values containing commas, quotes or line breaks so they stay in their own column
export const escapeCSVValue = (value: unknown): string => {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// CSV text with the raw column names in the first row
export const toCSV = (data: any[] | null | undefined): string => {
  if (!data || data.length === 0) return '';
  const { headers, rows } = buildTableData(data);
  return [headers, ...rows].map((row) => row.map(escapeCSVValue).join(',')).join('\n');
};

// "Responses_Wild-boar-road-crossings_2026-10-25.csv"
export const exportFileName = (prefix: string, name: string, now: Date = new Date()): string =>
  `${prefix}_${slugify(name)}_${todayStamp(now)}.csv`;

// Hands the CSV to the browser as a download
export const downloadCSV = (fileName: string, data: any[]): void => {
  const blob = new Blob([toCSV(data)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
