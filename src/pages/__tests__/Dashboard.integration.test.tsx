// Dashboard.integration.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import {getAllLivingLabs} from '../../services/livingLabService';
import { addExperiment, getMyExperiments } from '../../services/experimentService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Dashboard Integration Tests', () => {
  // Generate a unique identifier for each test run
  const uniqueId = new Date().toISOString().replace(/[:.]/g, '-');

  // Store created experiment IDs and names
  let createdExperimentIds: string[] = [];
  let experimentNames: string[] = [];
  let startDate: Date;
  let endDate: Date;

  // Use existing LivingLab
  const existingLivingLabId = '9c7dbce1-6c4f-46b6-b0c6-ec5d2c2b48c1';
  const existingLivingLabName = 'Living Lab Eindhoven';

  beforeAll(async () => {
    // Insert authentication token into localStorage
    const authToken = process.env.AUTH_TOKEN;
    if (authToken) {
      window.localStorage.setItem('authToken', authToken);
    } else {
      console.warn('AUTH_TOKEN is not defined in the environment variables.');
    }
  
    // Generate unique experiment names
    experimentNames = [`Exp 1 ${uniqueId}`, `Exp 2 ${uniqueId}`];
  
    // Calculate future start and end dates
    const today = new Date();
    startDate = new Date(today.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    endDate = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from today
  
    for (const name of experimentNames) {
      const experimentData = {
        name,
        description: 'Sample experiment description',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        // Removed unexpected properties
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
    // Fetch data directly
    const livingLabs = await getAllLivingLabs();
    const myExperiments = await getMyExperiments();

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the Dashboard to render
    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    // Verify that the experiments from getMyExperiments are displayed
    for (const experiment of myExperiments) {
      expect(screen.getByText(experiment.name)).toBeInTheDocument();
    }

    // Verify that the living labs from getAllLivingLabs are available in the filters
    fireEvent.click(screen.getByTestId('livinglab-dropdown-button'));
    for (const lab of livingLabs) {
      expect(screen.getByText(lab.name)).toBeInTheDocument();
    }
  });

  test('RENDER LOADING STATE', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Initially, the loading container should be in the document
    expect(screen.getByTestId('loading-container')).toBeInTheDocument();

    // Wait for the experiments table to appear
    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    // Now, the loading container should not be in the document
    expect(screen.queryByTestId('loading-container')).not.toBeInTheDocument();
  });

  test('RENDER EXPERIMENTS TABLE AFTER FETCH', async () => {
    // Fetch experiments
    const myExperiments = await getMyExperiments();

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the experiments table to appear
    await waitFor(() => {
      expect(screen.getByTestId('experiments-table')).toBeInTheDocument();
    });

    // Verify that the experiments are displayed
    for (const experiment of myExperiments) {
      expect(screen.getByText(experiment.name)).toBeInTheDocument();
    }
  });


  // CATEGORY 2: SORTING AND FILTERING INTERACTION

  test('SORTING APPLIES AFTER FILTERING', async () => {
    // Fetch experiments
    const myExperiments = await getMyExperiments();

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for experiments to be displayed
    for (const experiment of myExperiments) {
      expect(await screen.findByText(experiment.name)).toBeInTheDocument();
    }

    // Apply search filter
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Experiment' } });

    // Sort by 'Responses' (assuming 'Responses' is a sortable column)
    const responsesHeader = screen.getByText('Responses');
    fireEvent.click(responsesHeader);

    // Verify the order of experiments
    const experimentRows = screen.getAllByTestId(/experiment-row-/);

    // Sort experiments manually to get expected order
    const sortedExperiments = [...myExperiments]
      .filter((exp) => exp.name.includes('Experiment'))
      .sort((a, b) => (b.responses ?? 0) - (a.responses ?? 0));

    for (let i = 0; i < sortedExperiments.length; i++) {
      const row = experimentRows[i];
      expect(within(row).getByText(sortedExperiments[i].name)).toBeInTheDocument();
    }
  });

  test('FILTERING UPDATES SORTED LIST', async () => {
    // Fetch experiments
    const myExperiments = await getMyExperiments();

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for experiments to be displayed
    for (const experiment of myExperiments) {
      expect(await screen.findByText(experiment.name)).toBeInTheDocument();
    }

    // Sort by 'Responses'
    const responsesHeader = screen.getByText('Responses');
    fireEvent.click(responsesHeader);

    // Apply search filter
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: experimentNames[0] } });

    const experimentRows = screen.getAllByTestId(/experiment-row-/);
    expect(within(experimentRows[0]).getByText(experimentNames[0])).toBeInTheDocument();
    expect(experimentRows.length).toBe(1);
  });


  // CATEGORY 3: RESPONSIVENESS AND UI ELEMENTS

  test('DROPDOWN CLICK STATES', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the component to render
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
    // Fetch experiments
    const myExperiments = await getMyExperiments();

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for experiments to be displayed
    for (const experiment of myExperiments) {
      expect(await screen.findByText(experiment.name)).toBeInTheDocument();
    }

    const experimentRows = screen.getAllByTestId(/experiment-row-/);
    expect(experimentRows[0]).toHaveClass('row-even');
    expect(experimentRows[1]).toHaveClass('row-odd');
  });

  // CATEGORY 4: STATE MANAGEMENT AND SIDE EFFECTS

  test('USEEFFECT DEPENDENCIES TRIGGER CORRECTLY', async () => {
    // Fetch experiments
    const myExperiments = await getMyExperiments();

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for experiments to be displayed
    expect(await screen.findByText(experimentNames[0])).toBeInTheDocument();

    // Change search input
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: experimentNames[0] } });

    // Verify that only the searched experiment is displayed
    expect(screen.getByText(experimentNames[0])).toBeInTheDocument();
    expect(screen.queryByText(experimentNames[1])).not.toBeInTheDocument();
  });
});