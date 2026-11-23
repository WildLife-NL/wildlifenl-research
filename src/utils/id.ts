// Local IDs for unsaved records, crypto.randomUUID where the browser has it
let counter = 0;

export const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  counter += 1;
  return `local-${Date.now().toString(36)}-${counter}`;
};
