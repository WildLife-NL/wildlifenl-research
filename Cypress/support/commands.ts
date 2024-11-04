/// <reference types="cypress" />

Cypress.Commands.add('authenticate', () => {
  cy.visit('/login'); // Replace with your application's landing page

  // Set AUTH_TOKEN in localStorage
  cy.window().then((window: Window) => {
    window.localStorage.setItem('authToken', Cypress.env('AUTH_TOKEN') as string);
  });

  cy.reload(); // Reload to apply authentication
});
