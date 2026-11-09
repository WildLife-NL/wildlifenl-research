import { describeTiming, getStatus, overlapsRange, daysBetween } from '../experimentStatus';
import { formatCount, formatDate, formatPeriod, initials, pluralize, slugify, toDateInputValue } from '../format';
import { getExperimentPermissions } from '../experimentPermissions';
import { humanizeColumn } from '../columnLabels';
import { buildTableData, escapeCSVValue, exportFileName, toCSV } from '../csv';
import { describeTrigger, summarizeTriggers } from '../messageTrigger';
import { getReadiness, linkedMessages } from '../readiness';
import { Experiment } from '../../types/experiment';
import { Message } from '../../types/message';
import { Questionnaire } from '../../types/questionnaire';
import { User } from '../../types/user';

// Pure helpers behind the redesign: status, formatting, permissions, CSV, trigger wording and the go-live checklist

const now = new Date(2026, 10, 2, 12, 0, 0);
const daysFromNow = (days: number) => new Date(2026, 10, 2 + days, 12, 0, 0).toISOString();

const owner: User = { ID: 'owner', name: 'Testing Owner', email: 'owner@example.com', roles: [] };
const other: User = { ID: 'other', name: 'Testing Other', email: 'other@example.com', roles: [] };

const experiment = (start: string, end?: string): Experiment =>
  ({
    ID: 'experiment-1',
    name: 'Testing experiment',
    description: 'Testing description',
    start,
    end: end ?? '',
    user: owner,
    livingLab: { ID: 'lab', name: 'Veluwe', definition: [], $schema: '' },
    responses: 0,
    numberOfQuestionnaires: 1,
    numberOfMessages: 1,
    messageActivity: 0,
    questionnaireActivity: 0,
  } as Experiment);

describe('experimentStatus', () => {
  test('GETSTATUS KEEPS THE OLD RULES', () => {
    expect(getStatus(daysFromNow(3), daysFromNow(10), now)).toBe('Upcoming');
    expect(getStatus(daysFromNow(-10), daysFromNow(-3), now)).toBe('Completed');
    expect(getStatus(daysFromNow(-10), daysFromNow(3), now)).toBe('Live');
    expect(getStatus(daysFromNow(-10), null, now)).toBe('Live');
  });

  test('DESCRIBETIMING READS LIKE A SENTENCE', () => {
    expect(describeTiming(daysFromNow(15), daysFromNow(40), now)).toBe('Starts in 15 days');
    expect(describeTiming(daysFromNow(1), undefined, now)).toBe('Starts tomorrow');
    expect(describeTiming(daysFromNow(-5), daysFromNow(4), now)).toBe('Ends in 4 days');
    expect(describeTiming(daysFromNow(-5), undefined, now)).toBe('Live, no end date');
    expect(describeTiming(daysFromNow(-20), daysFromNow(-3), now)).toBe('Ended 3 days ago');
    expect(daysBetween(new Date(2026, 0, 1, 23), new Date(2026, 0, 2, 1))).toBe(1);
  });

  test('OVERLAPSRANGE KEEPS PARTIAL OVERLAPS AND COUNTS THE LAST DAY', () => {
    expect(overlapsRange('2026-03-01', '2026-03-31', '2026-03-20', '2026-04-10')).toBe(true);
    expect(overlapsRange('2026-03-01', '2026-03-31', '2026-04-01', '2026-04-10')).toBe(false);
    expect(overlapsRange('2026-04-10', '2026-04-20', '2026-04-01', '2026-04-10')).toBe(true);
    expect(overlapsRange('2026-03-01', '', '2027-01-01', '')).toBe(true);
    expect(overlapsRange('2026-03-01', '2026-03-31', '', '')).toBe(true);
  });
});

describe('format', () => {
  test('DATES, PERIODS AND COUNTS', () => {
    expect(formatDate('2026-11-09T00:00:00')).toBe('9 Nov 2026');
    expect(formatDate('')).toBe('—');
    expect(formatPeriod('2026-03-01T12:00:00', '2026-06-30T12:00:00')).toBe('1 Mar – 30 Jun 2026');
    expect(formatPeriod('2025-10-01T12:00:00', '2026-03-31T12:00:00')).toBe('1 Oct 2025 – 31 Mar 2026');
    expect(formatPeriod('2026-07-15T12:00:00', '')).toBe('15 Jul 2026 – open');
    expect(formatCount(1284)).toBe('1,284');
    expect(formatCount(undefined)).toBe('—');
    expect(pluralize(1, 'question')).toBe('1 question');
    expect(pluralize(3, 'question')).toBe('3 questions');
  });

  test('NAMES, SLUGS AND DATE INPUTS', () => {
    expect(initials('Marloes de Vries')).toBe('MV');
    expect(initials('')).toBe('?');
    expect(slugify('Wild boar road crossings – De Maashorst')).toBe('Wild-boar-road-crossings-De-Maashorst');
    expect(toDateInputValue(new Date(2026, 10, 9, 12).toISOString())).toBe('2026-11-09');
    expect(toDateInputValue(null)).toBe('');
  });
});

describe('experimentPermissions', () => {
  test('ONLY THE OWNER CHANGES AN UPCOMING EXPERIMENT', () => {
    const upcoming = getExperimentPermissions(experiment(daysFromNow(5)), owner, now);
    expect(upcoming).toMatchObject({ isOwner: true, canEdit: true, canDelete: true, canStop: false });
    expect(upcoming.reasons.stop).toMatch(/once the experiment is live/);

    const live = getExperimentPermissions(experiment(daysFromNow(-5)), owner, now);
    expect(live).toMatchObject({ canEdit: false, canDelete: false, canStop: true });

    const notOwner = getExperimentPermissions(experiment(daysFromNow(5)), other, now);
    expect(notOwner).toMatchObject({ isOwner: false, canEdit: false, canDelete: false, canStop: false });
    expect(notOwner.reasons.edit).toBe('Only Testing Owner can change this experiment');
  });
});

describe('csv and column labels', () => {
  const rows = [
    { ID: 'r1', text: 'Two, fawns', answer: { text: 'Red deer' }, extra: null, ok: true },
    { ID: 'r2', text: 'Say "hi"', answer: { text: 'Roe deer' }, extra: null, ok: false },
  ];

  test('FLATTENS NESTED KEYS AND KEEPS THE OLD NULL AND BOOLEAN OUTPUT', () => {
    const table = buildTableData(rows);
    expect(table.headers).toEqual(['ID', 'text', 'answer_text', 'extra', 'ok']);
    expect(table.rows[0]).toEqual(['r1', 'Two, fawns', 'Red deer', 'null', 'true']);
  });

  test('ESCAPES VALUES SO THEY STAY IN THEIR COLUMN', () => {
    expect(escapeCSVValue('a,b')).toBe('"a,b"');
    expect(escapeCSVValue('say "hi"')).toBe('"say ""hi"""');
    expect(toCSV(rows).split('\n')[2]).toBe('r2,"Say ""hi""",Roe deer,null,false');
    expect(toCSV([])).toBe('');
  });

  test('FILE NAMES AND HUMAN HEADERS', () => {
    expect(exportFileName('Responses', 'Wild boar road crossings', new Date(2026, 9, 25))).toBe('Responses_Wild-boar-road-crossings_2026-10-25.csv');
    expect(humanizeColumn('answer_text')).toBe('Answer');
    expect(humanizeColumn('interaction_location_latitude')).toBe('Latitude');
    expect(humanizeColumn('question_nextQuestionID')).toBe('Question › next question ID');
    expect(humanizeColumn('ID')).toBe('ID');
  });
});

describe('message triggers and readiness', () => {
  const deer = { ID: 's1', name: 'Cervus elaphus', commonName: 'Red deer', advice: '', category: '' };
  const encounter = { ID: 'm1', trigger: 'encounter', species: deer, encounterMeters: 200, encounterMinutes: 10 } as unknown as Message;
  const onAnswer = { ID: 'm2', trigger: 'answer', answer: { ID: 'a1', text: 'Yes' } } as unknown as Message;

  test('DESCRIBES WHEN A MESSAGE IS SENT', () => {
    expect(describeTrigger({ trigger: 'encounter', species: deer, encounterMeters: 200, encounterMinutes: 10, livingLab: 'the Veluwe' })).toBe(
      'An app user is within 200 m of a red deer, with both positions measured in the last 10 minutes, while the experiment is live in the Veluwe.'
    );
    expect(describeTrigger({ trigger: 'alarm' })).toBe('WildlifeNL raises an alarm.');
    expect(describeTrigger({ trigger: 'answer', questionText: 'Seen?', answerText: 'Yes' })).toBe('An app user answers “Yes” to “Seen?”.');
    expect(summarizeTriggers([encounter, encounter, onAnswer])).toBe('2 on encounter (red deer) · 1 on a questionnaire answer');
  });

  test('CHECKLIST WARNS ABOUT EMPTY QUESTIONNAIRES AND COUNTS LINKED MESSAGES', () => {
    const filled = {
      ID: 'q1',
      name: 'Deer sightings',
      interactionType: { ID: '1', name: 'Sighting', description: '' },
      questions: [{ ID: 'qq1', answers: [{ ID: 'a1' }] }],
    } as unknown as Questionnaire;
    const empty = { ID: 'q2', name: 'Feeding site visits', questions: [] } as unknown as Questionnaire;

    expect(linkedMessages(filled, [encounter, onAnswer])).toEqual([onAnswer]);

    const readiness = getReadiness(experiment(daysFromNow(7)), [filled, empty], [encounter, onAnswer]);
    expect(readiness.items.map((item) => item.state)).toEqual(['done', 'done', 'warn', 'done', 'todo']);
    expect(readiness.ready).toBe(3);
    expect(readiness.items[1].text).toBe('Interaction type Sighting · 1 answer-triggered message linked.');
    expect(readiness.items[2].title).toBe('Feeding site visits has no questions yet');
  });
});
