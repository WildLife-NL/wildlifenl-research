import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AssignedInteractions from '../AssignedInteractions';
import * as interactionService from '../../services/interactionService';
import { NOT_ON_THIS_API } from '../../services/problemDetails';
import { Experiment } from '../../types/experiment';
import { Interaction } from '../../types/interaction';
import { Questionnaire } from '../../types/questionnaire';

// The list of interactions that got one of the experiment's questionnaires, on the Questionnaires tab

const experiment = { ID: 'experiment-1', name: 'Testing experiment', start: '2026-06-10T00:00:00Z', end: '2026-06-13T00:00:00Z' } as unknown as Experiment;

const sightingQuestionnaire = { ID: 'questionnaire-1', name: 'Testing sightings', identifier: 'testing-s', experiment, questions: [] } as unknown as Questionnaire;
const damageQuestionnaire = { ID: 'questionnaire-2', name: 'Testing damage', identifier: '', experiment, questions: [] } as unknown as Questionnaire;

const interaction = (ID: string, timestamp: string, user: { ID: string; name: string }, questionnaire: Questionnaire): Interaction =>
  ({
    ID,
    timestamp,
    user,
    questionnaire,
    type: { ID: '1', name: 'Sighting', description: '' },
    species: { ID: 'species-1', name: 'Equus ferus', commonName: 'Konik' },
  } as unknown as Interaction);

const older = interaction('interaction-old', '2026-06-11T09:43:07Z', { ID: 'user-1', name: 'Testing Reporter' }, sightingQuestionnaire);
const newer = interaction('interaction-new', '2026-06-12T14:05:00Z', { ID: 'user-2', name: 'user-2' }, damageQuestionnaire);

const renderList = () =>
  render(
    <MemoryRouter>
      <AssignedInteractions experiment={experiment} questionnaires={[sightingQuestionnaire, damageQuestionnaire]} />
    </MemoryRouter>
  );

const rowIds = () => screen.getAllByTestId(/^assigned-interaction-/).map((row) => row.getAttribute('data-testid'));

describe('AssignedInteractions - Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('LISTS EACH INTERACTION WITH ITS USER AND QUESTIONNAIRE, NEWEST FIRST', async () => {
    jest.spyOn(interactionService, 'getInteractionsWithQuestionnaireByExperimentID').mockResolvedValue([older, newer]);
    renderList();

    expect(await screen.findByTestId('assigned-interactions-table')).toBeInTheDocument();
    expect(interactionService.getInteractionsWithQuestionnaireByExperimentID).toHaveBeenCalledWith('experiment-1');
    expect(rowIds()).toEqual(['assigned-interaction-interaction-new', 'assigned-interaction-interaction-old']);
    expect(screen.getByText('2 interactions')).toBeInTheDocument();

    const oldRow = within(screen.getByTestId('assigned-interaction-interaction-old'));
    expect(oldRow.getByText('Testing Reporter')).toBeInTheDocument();
    expect(oldRow.getByRole('link', { name: 'Testing sightings' })).toHaveAttribute('href', '/questionnaire/questionnaire-1');
    expect(oldRow.getByText(/Konik/)).toBeInTheDocument();

    // A user without a display name has their ID as name, shown as an ID
    expect(within(screen.getByTestId('assigned-interaction-interaction-new')).getByText('user-2')).toHaveClass('rc-mono');
  });

  test('FILTERS BY QUESTIONNAIRE AND SORTS BY USER', async () => {
    jest.spyOn(interactionService, 'getInteractionsWithQuestionnaireByExperimentID').mockResolvedValue([older, newer]);
    renderList();
    await screen.findByTestId('assigned-interactions-table');

    fireEvent.click(screen.getByRole('button', { name: 'Reported by' }));
    expect(rowIds()).toEqual(['assigned-interaction-interaction-old', 'assigned-interaction-interaction-new']);

    fireEvent.change(screen.getByTestId('assigned-questionnaire-filter'), { target: { value: 'questionnaire-2' } });
    expect(rowIds()).toEqual(['assigned-interaction-interaction-new']);
    expect(screen.getByText('1 interaction')).toBeInTheDocument();
  });

  test('SAYS SO WHEN NO INTERACTION GOT A QUESTIONNAIRE', async () => {
    jest.spyOn(interactionService, 'getInteractionsWithQuestionnaireByExperimentID').mockResolvedValue([]);
    renderList();

    expect(await screen.findByText(/No interaction in this experiment has been given one of its questionnaires yet/)).toBeInTheDocument();
    expect(screen.queryByTestId('assigned-questionnaire-filter')).not.toBeInTheDocument();
  });

  test('SAYS THE LIST IS MISSING ON AN API WITHOUT THE ENDPOINT', async () => {
    jest.spyOn(interactionService, 'getInteractionsWithQuestionnaireByExperimentID').mockRejectedValue(new Error(NOT_ON_THIS_API));
    renderList();

    expect(await screen.findByText('This list is not available on this WildlifeNL API yet.')).toBeInTheDocument();
  });
});
