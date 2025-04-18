import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import Dashboard from '../Dashboard';
import * as livingLabService from '../../services/livingLabService';
import * as experimentService from '../../services/experimentService';
import * as profileService from '../../services/profileService'; // <-- Added import
import { BrowserRouter } from 'react-router-dom';
import { LivingLab } from '../../types/livinglab';
import { Experiment } from '../../types/experiment';
import { User } from '../../types/user';

// Mock useNavigate from react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Dashboard Component - Unit Tests', () => {
  const mockNavigate = jest.fn();

  // Mock data
  const mockLivingLabs: LivingLab[] = [
    {
      ID: 'all',
      name: 'All LivingLabs',
      definition: [],
      $schema: '',
    },
    {
      ID: '1',
      name: 'Test LivingLab',
      definition: [],
      $schema: '',
    },
    {
      ID: '2',
      name: 'Another LivingLab',
      definition: [],
      $schema: '',
    },
  ];

  const today = new Date();

  // Helper function to format dates to YYYY-MM-DD
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Dates for experiments
  const pastStartDate = new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000); // 20 days ago
  const pastEndDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

  const futureStartDate = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000); // In 10 days
  const futureEndDate = new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000); // In 20 days

  const liveStartDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
  const liveEndDate = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000); // In 10 days

  // Adjust mockExperiments so that the Past Experiment’s responses sum to 5 (e.g. 2 + 3)
  const mockExperiments: Experiment[] = [
    {
      ID: '1',
      name: 'Past Experiment',
      description: 'Description A',
      start: formatDate(pastStartDate),
      end: formatDate(pastEndDate),
      user: {
        ID: 'user1',
        name: 'User One',
        email: 'user1@example.com',
        roles: [],
        $schema: '',
      } as User,
      livingLab: mockLivingLabs[1],
      responses: 8, // (this value is overwritten in the component)
      numberOfQuestionnaires: 2,
      numberOfMessages: 10,
      messageActivity: 2, // changed from 5 to 2 (2+3 = 5)
      questionnaireActivity: 3,
    },
    {
      ID: '2',
      name: 'Future Experiment',
      description: 'Description B',
      start: formatDate(futureStartDate),
      end: formatDate(futureEndDate),
      user: {
        ID: 'user2',
        name: 'User Two',
        email: 'user2@example.com',
        roles: [],
        $schema: '',
      } as User,
      livingLab: mockLivingLabs[2],
      responses: 15,
      numberOfQuestionnaires: 5,
      numberOfMessages: 20,
      messageActivity: 10,
      questionnaireActivity: 5,
    },
    {
      ID: '3',
      name: 'Live Experiment',
      description: 'Description C',
      start: formatDate(liveStartDate),
      end: formatDate(liveEndDate),
      user: {
        ID: 'user3',
        name: 'User Three',
        email: 'user3@example.com',
        roles: [],
        $schema: '',
      } as User,
      livingLab: mockLivingLabs[1],
      responses: 8,
      numberOfQuestionnaires: 3,
      numberOfMessages: 15,
      messageActivity: 5,
      questionnaireActivity: 3,
    },
  ];

  // Define a mock logged-in user (ID 'user1')
  const mockUser: User = {
    ID: 'user1',
    name: 'User One',
    email: 'user1@example.com',
    roles: [],
  };

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useNavigate
    (require('react-router-dom').useNavigate as jest.Mock).mockImplementation(() => mockNavigate);

    // Mock API calls
    jest.spyOn(livingLabService, 'getAllLivingLabs').mockResolvedValue(mockLivingLabs);
    jest.spyOn(experimentService, 'getExperiments').mockResolvedValue(mockExperiments);
    jest.spyOn(profileService, 'getMyProfile').mockResolvedValue(mockUser);
  });

  // CATEGORY 1: FILTERS DROPDOWN
  describe('CATEGORY 1: FILTERS DROPDOWN', () => {
    test('SELECTING A DROPDOWN OPTION UPDATES STATE', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Wait for the component to finish loading
      await waitFor(() => expect(screen.getByTestId('livinglab-dropdown-button')).toBeInTheDocument());

      // Click the dropdown to reveal options
      fireEvent.click(screen.getByTestId('livinglab-dropdown-button'));

      // Wait for the specific option to appear
      const testLivingLabOption = await screen.findByTestId('livinglab-option-1'); // 'Test LivingLab'
      fireEvent.click(testLivingLabOption);

      // Check that the dropdown button now displays 'Test LivingLab'
      expect(screen.getByTestId('livinglab-dropdown-button')).toHaveTextContent('Test LivingLab');
    });
  });

  // CATEGORY 2: FILTER BY SEARCH
  describe('CATEGORY 2: FILTER BY SEARCH', () => {
    test('SEARCH INPUT RENDERING', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Toggle "All Experiments" so that all experiments are visible
      fireEvent.click(screen.getByTestId('all-experiments-toggle'));

      // Wait for the search input to be in the document
      await waitFor(() => expect(screen.getByTestId('search-input')).toBeInTheDocument());

      // Check placeholder text
      expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', 'Search experiment...');
    });

    test('SEARCH QUERY UPDATES STATE', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Toggle "All Experiments"
      fireEvent.click(screen.getByTestId('all-experiments-toggle'));

      // Wait for the search input
      await waitFor(() => expect(screen.getByTestId('search-input')).toBeInTheDocument());

      // Type into the search input
      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Live Experiment' } });

      // The value should be updated
      expect(screen.getByTestId('search-input')).toHaveValue('Live Experiment');
    });

    test('SEARCH FILTER APPLIES CORRECTLY', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Toggle "All Experiments" so that all experiments are visible
      fireEvent.click(screen.getByTestId('all-experiments-toggle'));

      // Wait for all experiments to be displayed
      await waitFor(() => expect(screen.getByText('Past Experiment')).toBeInTheDocument());
      await waitFor(() => expect(screen.getByText('Future Experiment')).toBeInTheDocument());
      await waitFor(() => expect(screen.getByText('Live Experiment')).toBeInTheDocument());

      // Type into the search input to filter to 'Live Experiment'
      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Live Experiment' } });

      // Wait for the filtered results
      await waitFor(() => {
        expect(screen.queryByText('Past Experiment')).not.toBeInTheDocument();
        expect(screen.queryByText('Future Experiment')).not.toBeInTheDocument();
        expect(screen.getByText('Live Experiment')).toBeInTheDocument();
      });
    });
  });

  // CATEGORY 3: DATE RANGE FILTER
  describe('CATEGORY 3: DATE RANGE FILTER', () => {
    test('START DATE INPUT RENDERING', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('all-experiments-toggle'));

      await waitFor(() => expect(screen.getByTestId('start-date-input')).toBeInTheDocument());
    });

    test('END DATE INPUT RENDERING', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('all-experiments-toggle'));

      await waitFor(() => expect(screen.getByTestId('end-date-input')).toBeInTheDocument());
    });

    test('DATE RANGE UPDATES STATE', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('all-experiments-toggle'));

      await waitFor(() => expect(screen.getByTestId('start-date-input')).toBeInTheDocument());
      await waitFor(() => expect(screen.getByTestId('end-date-input')).toBeInTheDocument());

      fireEvent.change(screen.getByTestId('start-date-input'), { target: { value: '2023-01-01' } });
      fireEvent.change(screen.getByTestId('end-date-input'), { target: { value: '2023-12-31' } });

      expect(screen.getByTestId('start-date-input')).toHaveValue('2023-01-01');
      expect(screen.getByTestId('end-date-input')).toHaveValue('2023-12-31');
    });

    test('DATE RANGE FILTER APPLIES CORRECTLY', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('all-experiments-toggle'));

      await waitFor(() => expect(screen.getByText('Past Experiment')).toBeInTheDocument());

      fireEvent.change(screen.getByTestId('start-date-input'), { target: { value: formatDate(liveStartDate) } });
      fireEvent.change(screen.getByTestId('end-date-input'), { target: { value: formatDate(liveEndDate) } });

      await waitFor(() => {
        expect(screen.queryByText('Past Experiment')).not.toBeInTheDocument();
        expect(screen.queryByText('Future Experiment')).not.toBeInTheDocument();
        expect(screen.getByText('Live Experiment')).toBeInTheDocument();
      });
    });
  });

  // CATEGORY 4: SORTING FUNCTIONALITY
  test('REQUEST SORT UPDATES SORT CONFIG', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('all-experiments-toggle'));

    await waitFor(() => expect(screen.getByText('Responses')).toBeInTheDocument());

    const responsesHeader = screen.getByText('Responses');

    // Click to sort ascending
    fireEvent.click(responsesHeader);

    await waitFor(() => {
      const table = screen.getByTestId('experiments-table');
      const experimentRows = within(table).getAllByTestId(/experiment-row-/);
      expect(within(experimentRows[0]).getByText('Past Experiment')).toBeInTheDocument();
    });

    // Click again to sort descending
    fireEvent.click(responsesHeader);

    await waitFor(() => {
      const table = screen.getByTestId('experiments-table');
      const experimentRows = within(table).getAllByTestId(/experiment-row-/);
      expect(within(experimentRows[0]).getByText('Future Experiment')).toBeInTheDocument();
    });
  });

  // CATEGORY 5: GETSTATUS FUNCTION
  describe('CATEGORY 5: GETSTATUS FUNCTION', () => {
    test("Displays 'Upcoming' status for future experiments", async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('all-experiments-toggle'));

      await waitFor(() => expect(screen.getByText('Future Experiment')).toBeInTheDocument());

      const experimentRow = screen.getByTestId('experiment-row-2');
      const statusCell = within(experimentRow).getByText('Upcoming');
      expect(statusCell).toBeInTheDocument();
    });

    test("Displays 'Completed' status for past experiments", async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('all-experiments-toggle'));

      await waitFor(() => expect(screen.getByText('Past Experiment')).toBeInTheDocument());

      const experimentRow = screen.getByTestId('experiment-row-1');
      const statusCell = within(experimentRow).getByText('Completed');
      expect(statusCell).toBeInTheDocument();
    });

    test("Displays 'Live' status for current experiments", async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('all-experiments-toggle'));

      await waitFor(() => expect(screen.getByText('Live Experiment')).toBeInTheDocument());

      const experimentRow = screen.getByTestId('experiment-row-3');
      expect(within(experimentRow).getByText('Live')).toBeInTheDocument();
    });
  });
});