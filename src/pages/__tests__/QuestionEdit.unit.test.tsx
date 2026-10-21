import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuestionEdit from '../QuestionEdit';
import * as schemaService from '../../services/schemaService';
import * as questionService from '../../services/questionService';
import * as answerService from '../../services/answerService';

const questionnaire = {
  ID: 'questionnaire-1',
  name: 'Test questionnaire',
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
};

const renderQuestionEdit = () =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/questionedit', state: { questionnaire } }]}>
      <QuestionEdit />
    </MemoryRouter>
  );

describe('QuestionEdit - Unit Tests', () => {
  let alertMock: jest.Mock;
  let deleteAnswerSpy: jest.SpyInstance;
  let deleteQuestionSpy: jest.SpyInstance;
  let addQuestionsSpy: jest.SpyInstance;

  beforeEach(() => {
    alertMock = jest.fn();
    window.alert = alertMock;
    jest.spyOn(window.history, 'back').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
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

    renderQuestionEdit();
    fireEvent.click(screen.getByTestId('save-questions-button'));

    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Could not load the validation rules'))
    );
    expect(deleteAnswerSpy).not.toHaveBeenCalled();
    expect(deleteQuestionSpy).not.toHaveBeenCalled();
    expect(addQuestionsSpy).not.toHaveBeenCalled();
  });

  test('SAVES WHEN THE VALIDATION RULES ARE LOADED AND MET', async () => {
    jest.spyOn(schemaService, 'getMinLength').mockResolvedValue(5);

    renderQuestionEdit();
    fireEvent.click(screen.getByTestId('save-questions-button'));

    await waitFor(() => expect(addQuestionsSpy).toHaveBeenCalled());
    expect(deleteAnswerSpy).toHaveBeenCalledTimes(2);
    expect(deleteQuestionSpy).toHaveBeenCalledWith('question-1');
    expect(alertMock).toHaveBeenCalledWith('Questions and answers updated successfully!');
  });
});
