// Create, fill and delete one experiment through the UI on the TEST API, records are named Testing and removed at the end
// App services are never imported here, without the app's env they would point at the LIVE API

const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
const experimentName = `Testing – redesign ${stamp}`;
const inDays = (days: number) => {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

let experimentPath = '';
let questionnairePath = '';

const deleteFromHub = () => {
  cy.visit(experimentPath);
  cy.get('[data-testid="delete-experiment-button"]').click();
  cy.contains('[role="dialog"] button', 'Delete experiment').click();
  cy.location('pathname').should('eq', '/dashboard');
};

describe('Experiment flow on TEST', () => {
  before(() => {
    expect(Cypress.env('AUTH_TOKEN'), 'AUTH_TOKEN for the TEST API').to.be.a('string').and.not.be.empty;
    // Hooks run before the support file signs in, so they sign in themselves
    cy.authenticate();
    cy.visit('/dashboard');
    cy.get('[data-testid="navbar-version"]').should('contain', 'TEST');
  });

  after(() => {
    // Fallback cleanup when a step failed before the delete step
    if (!experimentPath) return;
    cy.authenticate();
    cy.visit(experimentPath);
    // Wait for the hub or the not-found state before deciding, the hub loads after the first paint
    cy.get('[data-testid="experiment-title"], .rc-empty').should('exist');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="delete-experiment-button"]').length) {
        deleteFromHub();
      }
    });
  });

  it('creates an experiment and lands in its hub', () => {
    cy.visit('/experimentcreation');
    cy.contains('h1', 'New experiment').should('be.visible');
    cy.get('[data-testid="submit-experiment-button"]').click();
    cy.contains('Enter a name').should('be.visible');
    cy.screenshot('experiment-new-errors-1440', { capture: 'viewport' });

    cy.get('[data-testid="experiment-name-input"]').type(experimentName);
    cy.get('[data-testid="experiment-description-input"]').type('Testing the redesigned screens end to end');
    cy.get('[data-testid="experiment-start-input"]').type(inDays(3));
    cy.get('[data-testid="experiment-end-input"]').type(inDays(40));
    cy.get('[data-testid="submit-experiment-button"]').click();

    cy.location('pathname').should('match', /^\/experiment\/[0-9a-f-]+$/);
    cy.location('pathname').then((pathname) => {
      experimentPath = pathname;
    });
    cy.contains('Experiment created.').should('be.visible');
    cy.get('[data-testid="experiment-title"]').should('contain', experimentName);
    cy.contains('Upcoming').should('be.visible');
    cy.get('[data-testid="readiness-checklist"]').should('contain', 'No questionnaires yet');
    cy.get('[data-testid="stop-experiment-button"]').should('have.attr', 'aria-disabled', 'true');
    cy.screenshot('hub-overview-new-1440', { capture: 'fullPage' });
  });

  it('adds a questionnaire with one multiple-choice question', () => {
    cy.visit(experimentPath);
    cy.get('[data-testid="hub-tab-questionnaires"]').click();
    cy.contains('No questionnaires yet').should('be.visible');
    cy.get('[data-testid="add-questionnaire-button"]').click();

    cy.get('[data-testid="questionnaire-name-input"]').type('Testing – redesign questionnaire');
    cy.get('[data-testid="questionnaire-identifier-input"]').type('testing-redesign');
    cy.get('[data-testid^="interaction-type-"]').first().check();
    cy.screenshot('questionnaire-new-1440', { capture: 'viewport' });
    cy.get('[data-testid="submit-questionnaire-button"]').click();

    cy.location('pathname').should('match', /^\/questionnaire\/[0-9a-f-]+$/);
    cy.location('pathname').then((pathname) => {
      questionnairePath = pathname;
    });
    cy.get('[data-testid="add-multiple-choice-question"]').click();
    cy.get('[data-testid="question-1-text"]').type('Did you see a testing animal?');
    cy.get('[data-testid="question-1-description"]').type('Testing description');
    cy.get('[data-testid="question-1-answer-A"]').type('Answer one');
    cy.get('[data-testid="question-1-answer-B"]').type('Answer two');
    cy.get('[aria-label="Remove answer C"]').click();
    cy.get('[data-testid="questionnaire-checks"]').should('contain', 'Every question has text');
    cy.screenshot('questionnaire-builder-1440', { capture: 'viewport' });

    cy.get('[data-testid="save-questions-button"]').click();
    cy.contains('Questionnaire saved').should('be.visible');
    cy.contains('No unsaved changes').should('be.visible');
  });

  it('adds a message triggered by an answer and shows the link in the builder', () => {
    cy.then(() => cy.visit(`/messagecreation/${experimentPath.split('/').pop()}`));
    cy.contains('h1', 'New message').should('be.visible');
    cy.get('[data-testid="message-title-input"]').type('Testing message');
    cy.get('[data-testid="message-text-input"]').type('Testing message text for the redesign');
    cy.get('[data-testid="trigger-answer"]').check();
    cy.get('[data-testid="message-questionnaire-select"]').select(1);
    cy.get('[data-testid="message-question-select"]').select(1);
    cy.get('[data-testid="message-answer-select"]').select(1);
    cy.get('[data-testid="sends-when"]').should('contain', 'Answer one');
    cy.screenshot('message-new-1440', { capture: 'viewport' });
    cy.get('[data-testid="submit-message-button"]').click();

    cy.location('pathname').should('match', /^\/messagedashboard\//);
    cy.contains('Message created.').should('be.visible');
    cy.get('[data-testid^="message-row-"]').should('have.length', 1);

    cy.visit(questionnairePath);
    cy.contains('1 message linked to answer A').should('be.visible');
    cy.get('[data-testid="question-1-text"]').type(' Testing');
    cy.get('[data-testid="save-questions-button"]').click();
    cy.contains('to fix first').should('be.visible');
    cy.get('[data-testid="questionnaire-checks"]').should('contain', 'linked message');
    cy.contains('button', 'Discard changes').click();
    cy.get('[data-testid="delete-questionnaire-button"]').should('have.attr', 'aria-disabled', 'true');
  });

  it('shows the filled checklist and deletes the experiment with everything in it', () => {
    cy.visit(experimentPath);
    cy.get('[data-testid="readiness-checklist"]').should('contain', 'Testing – redesign questionnaire · 1 question');
    cy.screenshot('hub-overview-filled-1440', { capture: 'fullPage' });

    deleteFromHub();
    cy.contains('Experiment deleted.').should('be.visible');
    cy.get('[data-testid="search-input"]').type(stamp);
    cy.get('[data-testid^="experiment-row-"]').should('not.exist');
    experimentPath = '';
  });
});
