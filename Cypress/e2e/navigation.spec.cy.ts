// Read-only tour of every signed-in screen against the TEST API, with screenshots at desktop and phone width
// Nothing is created, changed or downloaded here

const phone = () => cy.viewport(390, 844);
const desktop = () => cy.viewport(1440, 900);

describe('Signed-in screens', () => {
  before(() => {
    expect(Cypress.env('AUTH_TOKEN'), 'AUTH_TOKEN for the TEST API').to.be.a('string').and.not.be.empty;
  });

  it('runs against the TEST API', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="navbar-version"]').should('contain', 'TEST');
  });

  it('shows the experiments list on desktop and as cards on phone', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="all-experiments-toggle"]').click().should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-testid="loading-container"]').should('not.exist');
    cy.get('[data-testid^="experiment-row-"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="experiments-table"] th[aria-sort="ascending"]').should('contain', 'Name');
    cy.title().should('contain', 'Experiments');
    cy.screenshot('dashboard-1440', { capture: 'viewport' });

    cy.get('[data-testid="livinglab-dropdown-button"]').click();
    cy.get('[data-testid="livinglab-dropdown-content"]').should('be.visible').type('{esc}');
    cy.get('[data-testid="livinglab-dropdown-content"]').should('not.exist');

    phone();
    cy.get('[data-testid="all-experiments-toggle"]').click();
    cy.get('[data-testid^="experiment-card-"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="experiments-table"]').should('not.exist');
    cy.screenshot('dashboard-390', { capture: 'viewport' });
    cy.contains('button', 'Filters').click();
    cy.contains('[role="dialog"] h2', 'Filters').should('be.visible');
    cy.screenshot('dashboard-filters-390', { capture: 'viewport' });
    cy.get('body').type('{esc}');
    cy.contains('button', 'Menu').click();
    cy.contains('[role="dialog"] h2', 'Menu').should('be.visible');
    cy.screenshot('menu-sheet-390', { capture: 'viewport' });
    desktop();
  });

  it('opens an experiment hub and every tab', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="all-experiments-toggle"]').click();
    cy.get('[data-testid="loading-container"]').should('not.exist');
    // The experiment with the most questionnaires gives the fullest tabs
    cy.contains('th button', 'Questionnaires').click().click();
    cy.get('[data-testid="experiment-name"]').first().click();

    cy.location('pathname').should('match', /^\/experiment\//);
    cy.get('[data-testid="experiment-title"]').should('be.visible');
    cy.get('nav[aria-label="Breadcrumb"]').should('contain', 'Experiments');
    cy.get('[data-testid="hub-tab-overview"]').should('have.attr', 'aria-current', 'page');
    cy.contains('h2', 'Activity').should('be.visible');
    cy.screenshot('hub-overview-1440', { capture: 'fullPage' });

    cy.get('[data-testid="hub-tab-questionnaires"]').click();
    cy.location('pathname').should('match', /^\/questionnairedashboard\//);
    cy.get('[data-testid="hub-tab-questionnaires"]').should('have.attr', 'aria-current', 'page');
    cy.screenshot('hub-questionnaires-1440', { capture: 'fullPage' });

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid^="questionnaire-row-"] a').length) {
        cy.get('[data-testid^="questionnaire-row-"] a').first().click();
        cy.get('[data-testid="questionnaire-title"]').should('be.visible');
        cy.contains('h2', 'Flow').should('be.visible');
        cy.screenshot('questionnaire-1440', { capture: 'viewport' });
        phone();
        cy.screenshot('questionnaire-390', { capture: 'viewport' });
        desktop();
        cy.go('back');
      }
    });

    cy.get('[data-testid="hub-tab-messages"]').click();
    cy.location('pathname').should('match', /^\/messagedashboard\//);
    cy.screenshot('hub-messages-1440', { capture: 'fullPage' });

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid^="message-row-"] a').length) {
        cy.get('[data-testid^="message-row-"] a').first().click();
        cy.location('pathname').should('match', /^\/message\/[^/]+\/[^/]+$/);
        cy.get('[data-testid="message-title"]').should('be.visible');
        cy.screenshot('message-1440', { capture: 'fullPage' });
        cy.go('back');
      }
    });

    cy.get('[data-testid="hub-tab-data"]').click();
    cy.location('pathname').should('match', /^\/experimentdata\//);
    cy.contains('h2', 'Export as CSV').should('be.visible');
    cy.contains('.rc-hub__dataset', 'Interactions').find('.rc-hub__dataset-count').invoke('text').should('match', /\d+ rows?$/);
    cy.contains('.rc-hub__dataset', 'App user locations').find('.rc-hub__dataset-count').invoke('text').should('match', /\d+ rows?$/);
    cy.screenshot('hub-data-1440', { capture: 'fullPage' });
    cy.get('[data-testid="data-user-locations-button"]').click();
    cy.get('[data-testid="export-preview-dialog"]').contains('Loading').should('not.exist');
    cy.get('[data-testid="export-preview-dialog"]').should('not.contain', "Couldn't load this export");
    cy.get('body').type('{esc}');

    phone();
    cy.get('[data-testid="hub-tab-overview"]').click();
    cy.get('[data-testid="experiment-title"]').should('be.visible');
    cy.screenshot('hub-overview-390', { capture: 'fullPage' });
    desktop();
  });

  it('previews an export without downloading it', () => {
    cy.visit('/export');
    cy.contains('h1', 'Export').should('be.visible');
    cy.contains('button', "Everyone's").click();
    cy.get('[data-testid="export-table"]').should('be.visible');
    cy.contains('th button', 'Responses').click().click();
    cy.screenshot('export-1440', { capture: 'fullPage' });

    cy.get('[data-testid^="export-responses-"]').first().click();
    cy.get('[data-testid="export-preview-dialog"]').should('be.visible');
    cy.get('[data-testid="export-preview-dialog"]').contains('Loading').should('not.exist');
    cy.screenshot('export-preview-1440', { capture: 'viewport' });
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="export-preview-dialog"] input[type="checkbox"]').length) {
        cy.get('[data-testid="export-preview-dialog"] input[type="checkbox"]').check();
        cy.get('[data-testid="export-preview-dialog"] th .rc-mono').should('exist');
      }
    });
    cy.get('body').type('{esc}');
    cy.get('[data-testid="export-preview-dialog"]').should('not.exist');

    // Interactions and app user locations come from the by-experiment endpoints of the API
    ['interactions', 'user-locations'].forEach((kind) => {
      cy.get(`[data-testid^="export-${kind}-"]`).first().click();
      cy.get('[data-testid="export-preview-dialog"]').contains('Loading').should('not.exist');
      cy.get('[data-testid="export-preview-dialog"]').should('not.contain', "Couldn't load this export");
      cy.screenshot(`export-${kind}-preview-1440`, { capture: 'viewport' });
      cy.get('body').type('{esc}');
      cy.get('[data-testid="export-preview-dialog"]').should('not.exist');
    });

    cy.get('[data-testid^="export-row-"] button[aria-expanded="false"]').first().click();
    cy.get('[data-testid^="export-row-"] button[aria-expanded="true"]').should('exist');

    cy.get('[data-testid="export-animal-locations-button"]').click();
    cy.contains('Choose a living lab and both dates').should('be.visible');

    phone();
    cy.screenshot('export-390', { capture: 'viewport' });
    desktop();
  });

  it('opens the profile from the account menu', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="account-menu-button"]').click();
    cy.get('[role="menu"]').should('be.visible');
    cy.screenshot('account-menu-1440', { capture: 'viewport' });
    cy.contains('[role="menuitem"]', 'Profile').click();
    cy.location('pathname').should('eq', '/profile');
    cy.contains('h1', 'Profile').should('be.visible');
    cy.screenshot('profile-1440', { capture: 'viewport' });
  });

  it('keeps old links working', () => {
    cy.visit('/experiments');
    cy.location('pathname').should('eq', '/dashboard');
    cy.visit('/questionedit');
    cy.location('pathname').should('eq', '/dashboard');
  });
});
