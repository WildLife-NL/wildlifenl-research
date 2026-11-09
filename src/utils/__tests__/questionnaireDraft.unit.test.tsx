import * as questionService from '../../services/questionService';
import * as answerService from '../../services/answerService';
import {
  flowSummary,
  newQuestion,
  saveQuestionnaireDraft,
  testPattern,
  toAddQuestions,
  toDraft,
  validateDraft,
} from '../questionnaireDraft';

// The builder's draft model: loading, the save payload, validation and the delete-then-add order

const questionnaire = {
  ID: 'q',
  questions: [
    {
      ID: 'question-2',
      index: 2,
      text: 'How many animals?',
      description: 'Count them',
      allowMultipleResponse: false,
      allowOpenResponse: false,
      openResponseFormat: '',
      answers: [],
    },
    {
      ID: 'question-1',
      index: 1,
      text: 'Which animal did you see?',
      description: 'Pick one',
      allowMultipleResponse: false,
      allowOpenResponse: true,
      openResponseFormat: '',
      answers: [
        { ID: 'answer-b', index: 5, text: 'Roe deer', nextQuestionID: null },
        { ID: 'answer-a', index: 2, text: 'Red deer', nextQuestionID: 'question-2' },
      ],
    },
  ],
} as any;

describe('questionnaireDraft', () => {
  afterEach(() => jest.restoreAllMocks());

  test('LOADS QUESTIONS AND ANSWERS IN ORDER, KEYED BY THEIR API IDS', () => {
    const draft = toDraft(questionnaire);
    expect(draft.map((question) => question.key)).toEqual(['question-1', 'question-2']);
    expect(draft[0].answers.map((answer) => answer.text)).toEqual(['Red deer', 'Roe deer']);
    expect(draft[0].answers[0].next).toBe('question-2');
    expect(draft[1].kind).toBe('open');
  });

  test('NUMBERS ANSWERS BY ROW ORDER AND KEEPS FOLLOW-UPS BY KEY', () => {
    const payload = toAddQuestions(toDraft(questionnaire));
    expect(payload[0]).toMatchObject({
      localId: 'question-1',
      index: 1,
      allowOpenResponse: true,
      answers: [
        { index: 1, text: 'Red deer', nextQuestionID: 'question-2' },
        { index: 2, text: 'Roe deer', nextQuestionID: null },
      ],
    });
    expect(payload[1]).toMatchObject({ localId: 'question-2', allowOpenResponse: true, answers: [] });
  });

  test('REPORTS MISSING TEXT, SHORT ANSWERS, BACKWARD JUMPS AND BAD PATTERNS', () => {
    const draft = toDraft(questionnaire);
    draft[0].answers[1].text = 'Roe';
    draft[1].text = '';
    draft[1].pattern = '([a-z';
    draft[1].answers = [];
    const backwards = newQuestion('multiple', 3);
    backwards.text = 'Anything else?';
    backwards.description = 'Optional';
    backwards.answers = [{ key: 'x', text: 'Nothing more', next: 'question-1' }];
    const issues = validateDraft([...draft, backwards], { question: 5, answer: 5 });
    const messages = issues.map((issue) => issue.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        'Answer B of question 1 needs at least 5 characters.',
        'Question 2 has no text.',
        'The pattern of question 2 is not a valid regular expression.',
        'The follow-up after answer A of question 3 must be a later question.',
      ])
    );
  });

  test('FLOW AND PATTERN TESTER', () => {
    expect(flowSummary(toDraft(questionnaire))).toEqual([
      { key: 'question-1', text: 'Which animal did you see?', detail: 'A → 2' },
      { key: 'question-2', text: 'How many animals?', detail: '' },
    ]);
    expect(testPattern('\\d{4}', '1234')).toBe(true);
    expect(testPattern('\\d{4}', '12345')).toBe(false);
    expect(testPattern('([a-z', 'a')).toBeNull();
  });

  test('SAVE DELETES ANSWERS, THEN QUESTIONS, THEN ADDS, REPORTING EACH DELETE', async () => {
    const calls: string[] = [];
    jest.spyOn(answerService, 'deleteAnswer').mockImplementation(async (id) => {
      calls.push(`answer:${id}`);
    });
    jest.spyOn(questionService, 'deleteQuestion').mockImplementation(async (id) => {
      calls.push(`question:${id}`);
    });
    jest.spyOn(questionService, 'addQuestionsWithAnswers').mockImplementation(async () => {
      calls.push('add');
    });
    const deleted: string[] = [];

    await saveQuestionnaireDraft('q', { answerIDs: ['a1', 'a2'], questionIDs: ['q1'] }, toDraft(questionnaire), (kind, id) => deleted.push(`${kind}:${id}`));

    expect(calls).toEqual(['answer:a1', 'answer:a2', 'question:q1', 'add']);
    expect(deleted).toEqual(['answer:a1', 'answer:a2', 'question:q1']);
  });
});
