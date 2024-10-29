declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Custom command to authenticate a user by setting AUTH_TOKEN in localStorage.
     * @example cy.authenticate()
     */
    authenticate(): Chainable<void>;
  }
}
