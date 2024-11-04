// cypress/e2e/dashboard.cy.ts

describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.visit('/dashboard'); // Navigate to the dashboard route
  });

  it('should display the dashboard correctly', () => {
    // Verify the dashboard container is visible
    cy.get('[data-testid="dashboard-container"]').should('be.visible');

    // Check that the Experiments title is displayed
    cy.get('[data-testid="experiments-title"]').should('contain', 'Experiments');

    // Ensure the filters container is present
    cy.get('[data-testid="filters-container"]').should('be.visible');

    // Confirm that the experiments table is visible
    cy.get('[data-testid="experiments-table"]').should('be.visible');

    // Verify that the Add Experiment button is present
    cy.get('[data-testid="add-experiment-button"]').should('be.visible');
  });

  it('should load experiments data', () => {
    // Wait for the loading spinner to disappear
    cy.get('[data-testid="loading-container"]').should('not.exist');

    // Verify that at least one experiment row is displayed
    cy.get('[data-testid^="experiment-row-"]').should('have.length.greaterThan', 0);
  });

  it('should sort experiments by Creator', () => {
    // Click on the 'Creator' column header to sort
    cy.contains('th', 'Creator').click();

    // Verify that experiments are sorted by Creator name in ascending order
    let previousCreator = '';
    cy.get('[data-testid^="experiment-row-"]').each(($row) => {
      cy.wrap($row).find('td').eq(4).invoke('text').then((creatorName) => {
        if (previousCreator) {
          expect(creatorName.localeCompare(previousCreator)).to.be.gte(0);
        }
        previousCreator = creatorName;
      });
    });
  });

  it('should navigate to create experiment page when Add Experiment button is clicked', () => {
    // Click on the Add Experiment button
    cy.get('[data-testid="add-experiment-button"]').click();

    // Verify that the URL has changed to the experiment creation page
    cy.url().should('include', '/experimentcreation');
  });

  it('should select and deselect experiments using checkboxes', () => {
    // Select the first experiment
    cy.get('[data-testid^="experiment-checkbox-"]').first().check();

    // Verify that the checkbox is checked
    cy.get('[data-testid^="experiment-checkbox-"]').first().should('be.checked');

    // Deselect the first experiment
    cy.get('[data-testid^="experiment-checkbox-"]').first().uncheck();

    // Verify that the checkbox is unchecked
    cy.get('[data-testid^="experiment-checkbox-"]').first().should('not.be.checked');
  });

  it('should select and deselect all experiments using the Select All checkbox', () => {
    // Click on the Select All checkbox
    cy.get('[data-testid="select-all-checkbox"]').click();

    // Verify that all experiment checkboxes are checked
    cy.get('[data-testid^="experiment-checkbox-"]').each(($checkbox) => {
      cy.wrap($checkbox).should('be.checked');
    });

    // Click on the Select All checkbox again to deselect
    cy.get('[data-testid="select-all-checkbox"]').click();

    // Verify that all experiment checkboxes are unchecked
    cy.get('[data-testid^="experiment-checkbox-"]').each(($checkbox) => {
      cy.wrap($checkbox).should('not.be.checked');
    });
  });
});
