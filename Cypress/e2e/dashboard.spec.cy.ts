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
    // Everyone's scope, the signed-in account may own no experiments
    cy.get('[data-testid="all-experiments-toggle"]').click();

    // Wait for the loading spinner to disappear
    cy.get('[data-testid="loading-container"]').should('not.exist');

    // Verify that at least one experiment row is displayed
    cy.get('[data-testid^="experiment-row-"]').should('have.length.greaterThan', 0);
  });

  // The Owner column replaced Creator, it shows in Everyone's scope
  it('should sort experiments by Owner', () => {
    cy.get('[data-testid="all-experiments-toggle"]').click();
    cy.get('[data-testid="loading-container"]').should('not.exist');
    cy.contains('th button', 'Owner').click();
    cy.contains('th', 'Owner').should('have.attr', 'aria-sort', 'ascending');

    let previousOwner = '';
    cy.get('[data-testid^="experiment-row-"]').each(($row) => {
      cy.wrap($row)
        .find('td')
        .last()
        .invoke('text')
        .then((ownerName) => {
          if (previousOwner) {
            expect(ownerName.toLowerCase().localeCompare(previousOwner.toLowerCase())).to.be.gte(0);
          }
          previousOwner = ownerName;
        });
    });
  });

  it('should navigate to create experiment page when Add Experiment button is clicked', () => {
    // Click on the Add Experiment button
    cy.get('[data-testid="add-experiment-button"]').click();

    // Verify that the URL has changed to the experiment creation page
    cy.url().should('include', '/experimentcreation');
  });
});
