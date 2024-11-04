// Dashboard.integration.test.tsx

import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import Dashboard from '../Dashboard';
import '@testing-library/jest-dom/extend-expect';
import { getAllLivingLabs } from '../../services/livingLabService';
import { getMyExperiments } from '../../services/experimentService';
import { MemoryRouter } from 'react-router-dom';

// Mock the API functions
jest.mock('../../services/livingLabService', () => ({
  getAllLivingLabs: jest.fn(),
}));

jest.mock('../../services/experimentService', () => ({
  getMyExperiments: jest.fn(),
}));

const mockLivingLabs = [
  {
    ID: 'lab1',
    name: 'LivingLab 1',
    definition: [],
    $schema: '',
  },
  {
    ID: 'lab2',
    name: 'LivingLab 2',
    definition: [],
    $schema: '',
  },
];

const mockExperiments = [
  {
    ID: 'exp1',
    name: 'Experiment 1',
    start: '2023-01-01',
    end: '2023-12-31',
    user: { name: 'User 1' },
    livingLab: { name: 'LivingLab 1' },
    questionnaires: 5,
    messages: 10,
    responses: 100,
  },
  {
    ID: 'exp2',
    name: 'Experiment 2',
    start: '2023-02-01',
    end: '2023-11-30',
    user: { name: 'User 2' },
    livingLab: { name: 'LivingLab 2' },
    questionnaires: 3,
    messages: 5,
    responses: 50,
  },
];

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // CATEGORY 1: DATA FETCHING AND INITIAL RENDERING

  test('FETCH LIVINGLABS AND EXPERIMENTS ON MOUNT', async () => {
    (getAllLivingLabs as jest.Mock).mockResolvedValueOnce(mockLivingLabs);
    (getMyExperiments as jest.Mock).mockResolvedValueOnce(mockExperiments);
  
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  
    await waitFor(() => expect(getAllLivingLabs).toHaveBeenCalled());
    await waitFor(() => expect(getMyExperiments).toHaveBeenCalled());
  
    expect(await screen.findByText('Experiment 1')).toBeInTheDocument();
    expect(await screen.findByText('Experiment 2')).toBeInTheDocument();
  });
  

  test('RENDER LOADING STATE', async () => {
    let resolveLivingLabs!: (value: any) => void;
    let resolveExperiments!: (value: any) => void;

    const livingLabsPromise = new Promise((resolve) => {
      resolveLivingLabs = resolve;
    });

    const experimentsPromise = new Promise((resolve) => {
      resolveExperiments = resolve;
    });

    (getAllLivingLabs as jest.Mock).mockReturnValue(livingLabsPromise);
    (getMyExperiments as jest.Mock).mockReturnValue(experimentsPromise);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-container')).toBeInTheDocument();

    resolveLivingLabs(mockLivingLabs);
    resolveExperiments(mockExperiments);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-container')).not.toBeInTheDocument();
    });
  });

  test('RENDER EXPERIMENTS TABLE AFTER FETCH', async () => {
    (getAllLivingLabs as jest.Mock).mockResolvedValueOnce(mockLivingLabs);
    (getMyExperiments as jest.Mock).mockResolvedValueOnce(mockExperiments);
  
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });
  
    expect(await screen.findByText('Experiment 1')).toBeInTheDocument();
    expect(await screen.findByText('Experiment 2')).toBeInTheDocument();
  
    // Use getAllByText and ensure you have the expected number of elements
    const livingLabCells = screen.getAllByText('LivingLab 1', { selector: 'td' });
    expect(livingLabCells).toHaveLength(1);
  
    const livingLab2Cells = screen.getAllByText('LivingLab 2', { selector: 'td' });
    expect(livingLab2Cells).toHaveLength(1);
  });
  

  // CATEGORY 2: FILTER COMBINATIONS

  test('APPLYING MULTIPLE FILTERS SIMULTANEOUSLY', async () => {
    (getAllLivingLabs as jest.Mock).mockResolvedValueOnce(mockLivingLabs);
    (getMyExperiments as jest.Mock).mockResolvedValueOnce(mockExperiments);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    // LivingLab filter
    const livingLabDropdownButton = screen.getByTestId('livinglab-dropdown-button');
    fireEvent.click(livingLabDropdownButton);
    const livingLabOption = screen.getByTestId('livinglab-option-lab1');
    fireEvent.click(livingLabOption);

    // Date range filter
    const startDateInput = screen.getByTestId('start-date-input');
    const endDateInput = screen.getByTestId('end-date-input');
    fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2023-12-31' } });

    // Search query
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Experiment 1' } });

    expect(screen.getByText('Experiment 1')).toBeInTheDocument();
    expect(screen.queryByText('Experiment 2')).not.toBeInTheDocument();
  });

  test('CLEARING FILTERS RESETS EXPERIMENTS LIST', async () => {
    (getAllLivingLabs as jest.Mock).mockResolvedValueOnce(mockLivingLabs);
    (getMyExperiments as jest.Mock).mockResolvedValueOnce(mockExperiments);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    // Apply filters
    const livingLabDropdownButton = screen.getByTestId('livinglab-dropdown-button');
    fireEvent.click(livingLabDropdownButton);
    const livingLabOption = screen.getByTestId('livinglab-option-lab1');
    fireEvent.click(livingLabOption);

    const startDateInput = screen.getByTestId('start-date-input');
    const endDateInput = screen.getByTestId('end-date-input');
    fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2023-12-31' } });

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Experiment 1' } });

    // Verify only Experiment 1 is shown
    expect(screen.getByText('Experiment 1')).toBeInTheDocument();
    expect(screen.queryByText('Experiment 2')).not.toBeInTheDocument();

    // Clear filters
    fireEvent.click(livingLabDropdownButton);
    const allLivingLabsOption = screen.getByTestId('livinglab-option-all');
    fireEvent.click(allLivingLabsOption);

    fireEvent.change(startDateInput, { target: { value: '' } });
    fireEvent.change(endDateInput, { target: { value: '' } });
    fireEvent.change(searchInput, { target: { value: '' } });

    // Verify both experiments are shown
    expect(screen.getByText('Experiment 1')).toBeInTheDocument();
    expect(screen.getByText('Experiment 2')).toBeInTheDocument();
  });

  // CATEGORY 3: SORTING AND FILTERING INTERACTION

  test('SORTING APPLIES AFTER FILTERING', async () => {
    (getAllLivingLabs as jest.Mock).mockResolvedValueOnce(mockLivingLabs);
    (getMyExperiments as jest.Mock).mockResolvedValueOnce(mockExperiments);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    // Apply search filter
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Experiment' } });

    // Sort by 'Responses'
    const responsesHeader = screen.getByText('Responses');
    fireEvent.click(responsesHeader);

    const experimentRows = screen.getAllByTestId(/experiment-row-/);
    const firstExperiment = within(experimentRows[0]).getByText('Experiment 2');
    const secondExperiment = within(experimentRows[1]).getByText('Experiment 1');

    expect(firstExperiment).toBeInTheDocument();
    expect(secondExperiment).toBeInTheDocument();
  });

  test('FILTERING UPDATES SORTED LIST', async () => {
    (getAllLivingLabs as jest.Mock).mockResolvedValueOnce(mockLivingLabs);
    (getMyExperiments as jest.Mock).mockResolvedValueOnce(mockExperiments);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    // Sort by 'Responses'
    const responsesHeader = screen.getByText('Responses');
    fireEvent.click(responsesHeader);

    // Apply search filter
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Experiment 1' } });

    const experimentRows = screen.getAllByTestId(/experiment-row-/);
    const firstExperiment = within(experimentRows[0]).getByText('Experiment 1');

    expect(firstExperiment).toBeInTheDocument();
  });


  // CATEGORY 4: NAVIGATION FUNCTIONALITY (NOT IMPLEMENTED YET!!!!)

 /* test('NAVIGATE TO CREATE EXPERIMENT PAGE', async () => {
    (getAllLivingLabs as jest.Mock).mockResolvedValueOnce(mockLivingLabs);
    (getMyExperiments as jest.Mock).mockResolvedValueOnce(mockExperiments);

    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('add-experiment-button')).toBeInTheDocument();
    });

    const addButton = screen.getByTestId('add-experiment-button');
    fireEvent.click(addButton);

    expect(mockNavigate).toHaveBeenCalledWith('/experimentcreation');
  });

  test('NAVIGATE TO EXPERIMENT DETAILS PAGE', async () => {
    (getAllLivingLabs as jest.Mock).mockResolvedValueOnce(mockLivingLabs);
    (getMyExperiments as jest.Mock).mockResolvedValueOnce(mockExperiments);

    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    const exp1Row = screen.getByTestId('experiment-row-exp1');
    fireEvent.click(exp1Row);

    expect(mockNavigate).toHaveBeenCalledWith('/experiment/exp1');
  });
 */

  // CATEGORY 5: RESPONSIVENESS AND UI ELEMENTS

  test('DROPDOWN CLICK STATES', async () => {
  // Mock API calls
  (getAllLivingLabs as jest.Mock).mockResolvedValueOnce(mockLivingLabs);
  (getMyExperiments as jest.Mock).mockResolvedValueOnce(mockExperiments);

  // Render the Dashboard component
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  const dropdownButton = screen.getByTestId('livinglab-dropdown-button');

  const dropdownIcon = screen.getByAltText('Dropdown Icon');
  expect(dropdownIcon).toHaveClass('dropdown-icon');
  expect(dropdownIcon).not.toHaveClass('dropdown-icon-hover');

  fireEvent.click(dropdownButton);
  expect(dropdownIcon).toHaveClass('dropdown-icon-hover');

  fireEvent.click(dropdownButton);
  expect(dropdownIcon).not.toHaveClass('dropdown-icon-hover');
});

  test('ALTERNATING ROW COLORS', async () => {
    (getAllLivingLabs as jest.Mock).mockResolvedValueOnce(mockLivingLabs);
    (getMyExperiments as jest.Mock).mockResolvedValueOnce(mockExperiments);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    const experimentRows = screen.getAllByTestId(/experiment-row-/);
    expect(experimentRows[0]).toHaveClass('row-even');
    expect(experimentRows[1]).toHaveClass('row-odd');
  });


  // CATEGORY 6: STATE MANAGEMENT AND SIDE EFFECTS

  test('USEEFFECT DEPENDENCIES TRIGGER CORRECTLY', async () => {
    (getAllLivingLabs as jest.Mock).mockResolvedValueOnce(mockLivingLabs);
    (getMyExperiments as jest.Mock).mockResolvedValueOnce(mockExperiments);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Experiment 1' } });

    expect(screen.getByText('Experiment 1')).toBeInTheDocument();
    expect(screen.queryByText('Experiment 2')).not.toBeInTheDocument();
  });

  test('SELECT ALL STATE REFLECTS INDIVIDUAL SELECTIONS', async () => {
    (getAllLivingLabs as jest.Mock).mockResolvedValueOnce(mockLivingLabs);
    (getMyExperiments as jest.Mock).mockResolvedValueOnce(mockExperiments);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    const exp1Checkbox = screen.getByTestId('experiment-checkbox-exp1');
    const exp2Checkbox = screen.getByTestId('experiment-checkbox-exp2');

    // Initially, select all is unchecked
    expect(selectAllCheckbox).not.toBeChecked();

    // Select all
    fireEvent.click(selectAllCheckbox);
    expect(selectAllCheckbox).toBeChecked();
    expect(exp1Checkbox).toBeChecked();
    expect(exp2Checkbox).toBeChecked();

    // Uncheck one experiment
    fireEvent.click(exp1Checkbox);
    expect(selectAllCheckbox).not.toBeChecked();
    expect(exp1Checkbox).not.toBeChecked();
    expect(exp2Checkbox).toBeChecked();
  });
});
