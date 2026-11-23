import { addQuestionsWithAnswers } from '../questionService';
import { AddQuestionWithAnswers } from '../../types/question';

const jsonResponse = (status: number, body: any) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

const questions: AddQuestionWithAnswers[] = [
  {
    localId: 'local-1',
    allowMultipleResponse: false,
    allowOpenResponse: false,
    description: 'First description',
    index: 1,
    openResponseFormat: '',
    text: 'First question',
    answers: [
      { index: 1, text: 'Yes please', nextQuestionID: 'local-2' },
      { index: 2, text: 'No', nextQuestionID: null },
    ],
  },
  {
    localId: 'local-2',
    allowMultipleResponse: false,
    allowOpenResponse: true,
    description: 'Second description',
    index: 2,
    openResponseFormat: '',
    text: 'Second question',
    answers: [],
  },
];

describe('addQuestionsWithAnswers - Unit Tests', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    window.localStorage.setItem('authToken', 'test-token');
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('ADDS QUESTIONS AND LINKS FOLLOW-UP ANSWERS TO THE REAL QUESTION IDS', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { ID: 'question-1' }))
      .mockResolvedValueOnce(jsonResponse(200, { ID: 'question-2' }))
      .mockResolvedValueOnce(jsonResponse(200, { ID: 'answer-1' }))
      .mockResolvedValueOnce(jsonResponse(200, { ID: 'answer-2' }));

    await addQuestionsWithAnswers('questionnaire-1', questions);

    const bodies = fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body));
    expect(bodies[0]).toMatchObject({ text: 'First question', questionnaireID: 'questionnaire-1' });
    expect(bodies[1]).toMatchObject({ text: 'Second question', questionnaireID: 'questionnaire-1' });
    expect(bodies[2]).toMatchObject({ text: 'Yes please', questionID: 'question-1', nextQuestionID: 'question-2' });
    expect(bodies[3]).toMatchObject({ text: 'No', questionID: 'question-1', nextQuestionID: null });
  });

  test('REMOVES EVERYTHING THAT WAS ADDED WHEN AN ANSWER IS REJECTED', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { ID: 'question-1' }))
      .mockResolvedValueOnce(jsonResponse(200, { ID: 'question-2' }))
      .mockResolvedValueOnce(jsonResponse(200, { ID: 'answer-1' }))
      .mockResolvedValueOnce(
        jsonResponse(422, {
          title: 'Unprocessable Entity',
          detail: 'validation failed',
          errors: [{ message: 'expected length >= 5', location: 'body.text' }],
        })
      )
      .mockResolvedValue(jsonResponse(204, null));

    await expect(addQuestionsWithAnswers('questionnaire-1', questions)).rejects.toThrow('text: expected length >= 5');

    const deletedUrls = fetchMock.mock.calls
      .filter(([, options]) => options.method === 'DELETE')
      .map(([url]) => url);
    expect(deletedUrls).toEqual([
      expect.stringMatching(/\/answer\/answer-1$/),
      expect.stringMatching(/\/question\/question-1$/),
      expect.stringMatching(/\/question\/question-2$/),
    ]);
  });
});
