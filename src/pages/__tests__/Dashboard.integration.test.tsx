import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { getAllLivingLabs } from '../../services/livingLabService';
import { addExperiment, getExperiments } from '../../services/experimentService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Dashboard Integration Tests', () => {

  let createdExperimentIds: string[] = [];
  let experimentNames: string[] = [];
  let startDate: Date;
  let endDate: Date;

  // Use an existing LivingLab (for example, a test account already has one)
  const existingLivingLabId = '9c7dbce1-6c4f-46b6-b0c6-ec5d2c2b48c1';
  const existingLivingLabName = 'Living Lab Eindhoven';

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });
  
  beforeAll(async () => {
    // Insert authentication token into localStorage (if provided)
    const authToken = process.env.AUTH_TOKEN;
    if (authToken) {
      window.localStorage.setItem('authToken', authToken);
    } else {
      console.warn('AUTH_TOKEN is not defined in the environment variables.');
    }
  
    // Create 2 experiments. For each, generate its unique name at creation time.
    for (let i = 0; i < 2; i++) {
      // Generate a unique identifier at the time of creation:
      const uniqueId = new Date().toISOString().replace(/[:.]/g, '-');
      const name = `Exp ${i + 1} ${uniqueId}`;
      experimentNames.push(name);
  
      // Calculate future start and end dates based on the current time:
      const today = new Date();
      const startDateLocal = new Date(today.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      const endDateLocal = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
  
      // Update our module-level dates (if needed later)
      startDate = startDateLocal;
      endDate = endDateLocal;
  
      const experimentData = {
        name,
        description: 'Sample experiment description',
        start: startDateLocal.toISOString(),
        end: endDateLocal.toISOString(),
      };
  
      try {
        const experiment = await addExperiment(experimentData);
        createdExperimentIds.push(experiment.ID);
      } catch (error) {
        console.error('Failed to add experiment:', error);
      }
    }
  });

  afterAll(() => {
    // Clear localStorage after tests
    window.localStorage.clear();
  });

  // CATEGORY 1: DATA FETCHING AND INITIAL RENDERING

  test('FETCH LIVINGLABS AND EXPERIMENTS ON MOUNT', async () => {
    const livingLabs = await getAllLivingLabs();
    const myExperiments = await getExperiments();

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the experiments table to render
    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    // Verify that every experiment from the API is rendered by its unique row test ID
    for (const experiment of myExperiments) {
      expect(screen.getByTestId(`experiment-row-${experiment.ID}`)).toBeInTheDocument();
    }

    // Open the LivingLab dropdown and limit our search to its content.
    fireEvent.click(screen.getByTestId('livinglab-dropdown-button'));
    const dropdownContent = screen.getByTestId('livinglab-dropdown-content');
    for (const lab of livingLabs) {
      expect(within(dropdownContent).getByText(lab.name)).toBeInTheDocument();
    }
  });

  test('RENDER LOADING STATE', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Initially the loading container should be visible.
    expect(screen.getByTestId('loading-container')).toBeInTheDocument();

    // When experiments load, the table appears...
    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    // ...and the loading container disappears.
    expect(screen.queryByTestId('loading-container')).not.toBeInTheDocument();
  });

  test('RENDER EXPERIMENTS TABLE AFTER FETCH', async () => {
    const myExperiments = await getExperiments();

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    for (const experiment of myExperiments) {
      expect(screen.getByTestId(`experiment-row-${experiment.ID}`)).toBeInTheDocument();
    }
  });

  // CATEGORY 2: SORTING AND FILTERING INTERACTION

  test('FILTERING UPDATES SORTED LIST', async () => {
    const myExperiments = await getExperiments();
    // Filter our experiments by checking that their name is one of the ones we created
    const ourExperiments = myExperiments.filter(exp => experimentNames.includes(exp.name));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the experiments to render
    for (const experiment of ourExperiments) {
      await waitFor(() => {
        expect(screen.getByTestId(`experiment-row-${experiment.ID}`)).toBeInTheDocument();
      });
    }

    // Click the "Responses" header to trigger sorting
    const responsesHeader = screen.getByText('Responses');
    fireEvent.click(responsesHeader);

    // Apply a search filter using one of our unique experiment names
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: experimentNames[0] } });

    const experimentRows = screen.getAllByTestId(/experiment-row-/);
    // Verify that only our first experiment is displayed
    expect(within(experimentRows[0]).getByTestId('experiment-name').textContent).toContain(experimentNames[0]);
    expect(experimentRows.length).toBe(1);
  });

  // CATEGORY 3: RESPONSIVENESS AND UI ELEMENTS

  test('DROPDOWN CLICK STATES', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('livinglab-dropdown-button')).toBeInTheDocument();
    });

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
    const myExperiments = await getExperiments();

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for all experiment rows to appear
    for (const experiment of myExperiments) {
      await waitFor(() => {
        expect(screen.getByTestId(`experiment-row-${experiment.ID}`)).toBeInTheDocument();
      });
    }

    const experimentRows = screen.getAllByTestId(/experiment-row-/);
    if (experimentRows.length >= 2) {
      expect(experimentRows[0]).toHaveClass('row-even');
      expect(experimentRows[1]).toHaveClass('row-odd');
    }
  });

  // CATEGORY 4: STATE MANAGEMENT AND SIDE EFFECTS

  test('USEEFFECT DEPENDENCIES TRIGGER CORRECTLY', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for our first created experiment (with a unique name) to appear
    expect(await screen.findByText(experimentNames[0])).toBeInTheDocument();

    // Change the search input to filter for our first experiment
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: experimentNames[0] } });

    // Verify that only our first experiment is visible
    expect(screen.getByText(experimentNames[0])).toBeInTheDocument();
    expect(screen.queryByText(experimentNames[1])).not.toBeInTheDocument();
  });
});
