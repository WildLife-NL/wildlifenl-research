import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Questionnaire from '../Questionnaire';
import { UserProvider } from '../../context/UserContext';
import * as schemaService from '../../services/schemaService';
import * as questionService from '../../services/questionService';
import * as answerService from '../../services/answerService';
import * as questionnaireService from '../../services/questionnaireService';
import * as experimentService from '../../services/experimentService';
import * as messageService from '../../services/messageService';
import * as interactionTypeService from '../../services/interactionTypeService';
import { Experiment } from '../../types/experiment';
import { Message } from '../../types/message';
import { User } from '../../types/user';

// The builder replaced QuestionEdit, these cases keep its save guarantees: validation rules fail closed, then delete and re-add

const owner: User = { ID: 'user-1', name: 'Testing Owner', email: 'testing@example.com', roles: [{ ID: 3, name: 'researcher' }] };

const inTenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

const experiment = {
  ID: 'experiment-1',
  name: 'Testing experiment',
  description: 'Testing description',
  start: inTenDays,
  end: '',
  user: owner,
  responses: 0,
  numberOfQuestionnaires: 1,
  numberOfMessages: 0,
  messageActivity: 0,
  questionnaireActivity: 0,
} as unknown as Experiment;

const questionnaire = {
  ID: 'questionnaire-1',
  name: 'Test questionnaire',
  identifier: 'test-q',
  experiment,
  interactionType: { ID: '1', name: 'Sighting', description: '' },
  questions: [
    {
      ID: 'question-1',
      index: 1,
      text: 'Did you see a wild boar?',
      description: 'Sighting',
      allowMultipleResponse: false,
      allowOpenResponse: false,
      openResponseFormat: '',
      answers: [
        { ID: 'answer-1', index: 1, text: 'Yes, I did', nextQuestionID: null },
        { ID: 'answer-2', index: 2, text: 'No, I did not', nextQuestionID: null },
      ],
    },
  ],
} as any;

const renderBuilder = () =>
  render(
    <UserProvider user={owner}>
      <MemoryRouter initialEntries={[{ pathname: '/questionnaire/questionnaire-1', state: { questionnaire, experiment } }]}>
        <Routes>
          <Route path="/questionnaire/:id" element={<Questionnaire />} />
        </Routes>
      </MemoryRouter>
    </UserProvider>
  );

const editQuestionText = async () => {
  const input = await screen.findByTestId('question-1-text');
  fireEvent.change(input, { target: { value: 'Did you see a wild boar today?' } });
};

describe('Questionnaire builder - Unit Tests', () => {
  let deleteAnswerSpy: jest.SpyInstance;
  let deleteQuestionSpy: jest.SpyInstance;
  let addQuestionsSpy: jest.SpyInstance;
  let messagesSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(questionnaireService, 'getQuestionnaireByID').mockResolvedValue(JSON.parse(JSON.stringify(questionnaire)));
    jest.spyOn(experimentService, 'getExperiments').mockResolvedValue([experiment]);
    jest.spyOn(interactionTypeService, 'getAllInteractions').mockResolvedValue([]);
    messagesSpy = jest.spyOn(messageService, 'getMessagesByExperimentID').mockResolvedValue([]);
    deleteAnswerSpy = jest.spyOn(answerService, 'deleteAnswer').mockResolvedValue();
    deleteQuestionSpy = jest.spyOn(questionService, 'deleteQuestion').mockResolvedValue();
    addQuestionsSpy = jest.spyOn(questionService, 'addQuestionsWithAnswers').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('DOES NOT DELETE ANYTHING WHEN THE VALIDATION RULES CANNOT BE LOADED', async () => {
    jest
      .spyOn(schemaService, 'getMinLength')
      .mockRejectedValue(new Error('Could not load the validation rules for Answer text. Please try again.'));

    renderBuilder();
    await editQuestionText();
    fireEvent.click(screen.getByTestId('save-questions-button'));

    expect(await screen.findByText(/Could not load the validation rules/)).toBeInTheDocument();
    expect(deleteAnswerSpy).not.toHaveBeenCalled();
    expect(deleteQuestionSpy).not.toHaveBeenCalled();
    expect(addQuestionsSpy).not.toHaveBeenCalled();
  });

  test('SAVES WHEN THE VALIDATION RULES ARE LOADED AND MET', async () => {
    jest.spyOn(schemaService, 'getMinLength').mockResolvedValue(5);

    renderBuilder();
    await editQuestionText();
    fireEvent.click(screen.getByTestId('save-questions-button'));

    await waitFor(() => expect(addQuestionsSpy).toHaveBeenCalled());
    expect(deleteAnswerSpy).toHaveBeenCalledTimes(2);
    expect(deleteQuestionSpy).toHaveBeenCalledWith('question-1');
    expect(addQuestionsSpy).toHaveBeenCalledWith('questionnaire-1', [
      expect.objectContaining({
        text: 'Did you see a wild boar today?',
        index: 1,
        answers: [
          { index: 1, text: 'Yes, I did', nextQuestionID: null },
          { index: 2, text: 'No, I did not', nextQuestionID: null },
        ],
      }),
    ]);
    expect(await screen.findByText(/Questionnaire saved/)).toBeInTheDocument();
  });

  test('KEEPS QUESTIONS ADDED WHILE THE QUESTIONNAIRE IS STILL LOADING', async () => {
    jest.spyOn(schemaService, 'getMinLength').mockResolvedValue(5);
    let resolveLoad: (value: any) => void = () => undefined;
    jest.spyOn(questionnaireService, 'getQuestionnaireByID').mockImplementation(
      () => new Promise((resolve) => {
        resolveLoad = resolve;
      })
    );

    renderBuilder();
    fireEvent.click(await screen.findByTestId('add-open-question'));
    expect(screen.getByTestId('question-2-text')).toBeInTheDocument();

    resolveLoad(JSON.parse(JSON.stringify(questionnaire)));
    // getExperiments runs right after the questionnaire arrived, so the load has been applied by then
    await waitFor(() => expect(experimentService.getExperiments).toHaveBeenCalled());
    expect(screen.getByTestId('question-2-text')).toBeInTheDocument();
    expect(screen.getByText(/Unsaved changes/)).toBeInTheDocument();
  });

  test('BLOCKS THE SAVE WHEN AN ANSWER HAS A LINKED MESSAGE', async () => {
    jest.spyOn(schemaService, 'getMinLength').mockResolvedValue(5);
    messagesSpy.mockResolvedValue([{ ID: 'message-1', name: 'Testing', text: 'Testing text', trigger: 'answer', answer: { ID: 'answer-1' } } as unknown as Message]);

    renderBuilder();
    await waitFor(() => expect(messagesSpy).toHaveBeenCalled());
    await editQuestionText();
    fireEvent.click(screen.getByTestId('save-questions-button'));

    expect(await screen.findByText(/to fix first/)).toBeInTheDocument();
    expect(deleteAnswerSpy).not.toHaveBeenCalled();
    expect(addQuestionsSpy).not.toHaveBeenCalled();
  });
});
