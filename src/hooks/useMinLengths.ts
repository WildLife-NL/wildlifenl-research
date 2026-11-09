// Minimum lengths from the API schemas: shown as field hints, then fetched again on submit so validation fails closed
import { useCallback, useEffect, useState } from 'react';
import { getMinLength } from '../services/schemaService';

export type SchemaField = [schema: string, field: string];
export type MinLengths = Record<string, number | undefined>;

const keyOf = ([schema, field]: SchemaField): string => `${schema}.${field}`;

export const useMinLengths = (fields: SchemaField[]) => {
  const fieldsKey = JSON.stringify(fields);
  const [hints, setHints] = useState<MinLengths>({});

  useEffect(() => {
    let cancelled = false;
    const parsed: SchemaField[] = JSON.parse(fieldsKey);
    Promise.all(parsed.map(([schema, field]) => getMinLength(schema, field).catch(() => undefined))).then((values) => {
      if (cancelled) return;
      const next: MinLengths = {};
      parsed.forEach((entry, index) => {
        next[keyOf(entry)] = values[index];
      });
      setHints(next);
    });
    return () => {
      cancelled = true;
    };
  }, [fieldsKey]);

  // Throws "Could not load the validation rules…" when a schema cannot be read, so the caller stops the submit
  const load = useCallback(async (): Promise<MinLengths> => {
    const parsed: SchemaField[] = JSON.parse(fieldsKey);
    const values = await Promise.all(parsed.map(([schema, field]) => getMinLength(schema, field)));
    const next: MinLengths = {};
    parsed.forEach((entry, index) => {
      next[keyOf(entry)] = values[index];
    });
    setHints(next);
    return next;
  }, [fieldsKey]);

  return { hints, load };
};

// "· at least 2 characters" for a field label
export const minLengthHint = (min: number | undefined): string | undefined =>
  min ? `at least ${min} ${min === 1 ? 'character' : 'characters'}` : undefined;
