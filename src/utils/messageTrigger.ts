// Words for message triggers and severities, shared by the composer, the message pages and the readiness checklist
import { Message } from '../types/message';
import { Species } from '../types/species';
import { pluralize } from './format';

export const SEVERITY_LABELS: Record<number, string> = {
  1: 'Debug',
  2: 'Info',
  3: 'Warning',
  4: 'Urgent',
  5: 'Critical',
};

export const severityLabel = (severity: number): string => SEVERITY_LABELS[severity] ?? `Level ${severity}`;

export const TRIGGER_LABELS: Record<string, string> = {
  encounter: 'Encounter',
  answer: 'Questionnaire answer',
  alarm: 'Alarm',
};

export const TRIGGER_DESCRIPTIONS: Record<string, string> = {
  encounter: 'An app user and an animal of the chosen species are close in place and time.',
  answer: "An app user picks a specific answer in one of this experiment's questionnaires. You choose the questionnaire, question and answer next.",
  alarm: 'WildlifeNL raises an alarm in the living lab, optionally limited to one species.',
};

export const triggerLabel = (trigger: string): string => TRIGGER_LABELS[trigger] ?? trigger;

// "Red deer (Cervus elaphus)", or the scientific name alone when there is no common name
export const speciesLabel = (species: Species | null | undefined): string => {
  if (!species) return '';
  return species.commonName ? `${species.commonName} (${species.name})` : species.name;
};

const speciesWord = (species: Species | null | undefined): string =>
  (species?.commonName || species?.name || 'animal').toLowerCase();

export interface TriggerDetails {
  trigger: string;
  species?: Species | null;
  encounterMeters?: number | null;
  encounterMinutes?: number | null;
  questionText?: string;
  answerText?: string;
  livingLab?: string;
}

// One sentence on when the message is sent, used in the composer preview and on the message page
export const describeTrigger = (details: TriggerDetails): string => {
  const where = details.livingLab ? ` in ${details.livingLab}` : '';

  if (details.trigger === 'encounter') {
    const meters = details.encounterMeters ? `${details.encounterMeters} m` : 'the chosen distance';
    const minutes = details.encounterMinutes ? pluralize(details.encounterMinutes, 'minute') : 'the chosen time';
    return `An app user is within ${meters} of a ${speciesWord(details.species)}, with both positions measured in the last ${minutes}, while the experiment is live${where}.`;
  }
  if (details.trigger === 'answer') {
    if (details.answerText && details.questionText) {
      return `An app user answers “${details.answerText}” to “${details.questionText}”.`;
    }
    return 'An app user picks the linked questionnaire answer.';
  }
  if (details.trigger === 'alarm') {
    return details.species
      ? `WildlifeNL raises an alarm about a ${speciesWord(details.species)}${where}.`
      : `WildlifeNL raises an alarm${where}.`;
  }
  return `The ${details.trigger} trigger fires.`;
};

// "2 on encounter (red deer) · 1 on a questionnaire answer"
export const summarizeTriggers = (messages: Message[]): string => {
  const parts: string[] = [];
  const encounters = messages.filter((message) => message.trigger === 'encounter');
  const answers = messages.filter((message) => message.trigger === 'answer');
  const alarms = messages.filter((message) => message.trigger === 'alarm');
  const others = messages.length - encounters.length - answers.length - alarms.length;

  if (encounters.length) {
    const species = Array.from(new Set(encounters.map((message) => speciesWord(message.species))));
    const named = species.length <= 2 ? ` (${species.join(', ')})` : '';
    parts.push(`${encounters.length} on encounter${named}`);
  }
  if (answers.length) parts.push(`${answers.length} on a questionnaire answer`);
  if (alarms.length) parts.push(`${alarms.length} on an alarm`);
  if (others > 0) parts.push(`${others} on another trigger`);
  return parts.join(' · ');
};
