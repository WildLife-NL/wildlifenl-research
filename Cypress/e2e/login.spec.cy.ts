// Signed-out sign-in pages, run with --config supportFile=false
// The code request is intercepted, so no email is ever sent from a test run

describe('Sign in', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept('POST', '**/auth/', { statusCode: 200, body: {} }).as('requestCode');
    cy.intercept('PUT', '**/auth/', { statusCode: 401, body: {} }).as('verifyCode');
  });

  it('shows the email step with the brand panel and the API in use', () => {
    cy.visit('/login');
    cy.contains('h1', 'Sign in').should('be.visible');
    cy.contains('Step 1 of 2').should('be.visible');
    cy.get('#email-input').should('have.attr', 'autocomplete', 'email');
    cy.contains('aside', 'Field research with the people who watch wildlife.').should('be.visible');
    cy.get('[data-testid="auth-version"]').should('contain', 'API');
    cy.title().should('contain', 'Sign in');
    cy.screenshot('login-email-1440', { capture: 'viewport' });

    cy.viewport(390, 844);
    cy.contains('h1', 'Sign in').should('be.visible');
    cy.screenshot('login-email-390', { capture: 'fullPage' });
  });

  it('explains an invalid address without contacting the API', () => {
    cy.visit('/login');
    cy.get('#email-input').type('not-an-address');
    cy.contains('button', 'Email me a code').click();
    cy.contains('does not look like an email address').should('be.visible');
    cy.get('#email-input').should('have.attr', 'aria-invalid', 'true');
    cy.get('@requestCode.all').should('have.length', 0);
  });

  it('moves to the code step and reports a wrong code in words', () => {
    cy.visit('/login');
    cy.get('#email-input').type('testing@example.com');
    cy.contains('button', 'Email me a code').click();
    cy.wait('@requestCode');

    cy.contains('h1', 'Check your email').should('be.visible');
    cy.contains('testing@example.com').should('be.visible');
    cy.get('#otp-code').should('have.attr', 'autocomplete', 'one-time-code').and('be.focused');
    cy.contains('available in').should('be.visible');
    cy.screenshot('login-code-1440', { capture: 'viewport' });

    cy.get('#otp-code').type('000000');
    cy.wait('@verifyCode');
    cy.contains("That code didn't match").should('be.visible');

    cy.contains('button', 'Use a different address').click();
    cy.get('#email-input').should('have.value', 'testing@example.com');
  });

  it('keeps signed-out visitors away from the app', () => {
    cy.visit('/dashboard');
    cy.location('pathname').should('eq', '/login');
  });
});
