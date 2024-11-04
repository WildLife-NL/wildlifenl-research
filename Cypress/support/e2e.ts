import './commands'

beforeEach(() => {
  cy.authenticate(); // Custom command to set AUTH_TOKEN and authenticate
});
