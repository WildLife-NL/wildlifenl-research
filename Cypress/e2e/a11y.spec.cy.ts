// WCAG 2.1 A and AA checks with axe-core on every screen and open dialog, at desktop and phone width, read-only on TEST
// axe-core comes with eslint-plugin-jsx-a11y from react-scripts, so no extra dependency is needed

type Violation = { id: string; impact: string; help: string; nodes: { target: string[] }[] };

const results: Record<string, Violation[]> = {};
const passCounts: Record<string, number> = {};

const audit = (name: string) => {
  cy.readFile('node_modules/axe-core/axe.min.js').then((source) => {
    cy.window().then((win: any) => {
      if (!win.axe) win.eval(source);
    });
  });
  cy.window().then({ timeout: 30000 }, (win: any) =>
    win.axe
      .run(win.document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })
      .then((report: { violations: Violation[]; passes: unknown[] }) => {
        passCounts[name] = report.passes.length;
        results[name] = report.violations.map(({ id, impact, help, nodes }) => ({
          id,
          impact,
          help,
          nodes: nodes.slice(0, 5).map((node) => ({ target: node.target })),
        }));
      })
  );
};

const bothWidths = (name: string, visit: () => void) => {
  cy.viewport(1440, 900);
  visit();
  audit(`${name} · 1440`);
  cy.viewport(390, 844);
  visit();
  audit(`${name} · 390`);
};

// The heading proves React rendered the page, then every loading state must be gone
const ready = () => {
  cy.get('main h1').should('exist');
  cy.get('.rc-loading').should('not.exist');
};

describe('Accessibility', () => {
  let experimentPath = '';

  after(() => {
    cy.writeFile('Cypress/screenshots/a11y/results.json', { results, passCounts });
    const blocking = Object.entries(results).flatMap(([screen, violations]) =>
      violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical').map((violation) => `${screen}: ${violation.id}`)
    );
    expect(blocking, 'serious or critical WCAG violations').to.deep.equal([]);
  });

  // Proves axe runs: an unlabelled input must be reported, then the canary is removed from the results
  it('detects a known violation', () => {
    cy.visit('/login');
    cy.window().then((win) => {
      const input = win.document.createElement('input');
      input.id = 'axe-canary';
      win.document.body.appendChild(input);
    });
    audit('canary');
    cy.then(() => {
      expect(results.canary.map((violation) => violation.id)).to.include('label');
      delete results.canary;
      delete passCounts.canary;
    });
  });

  it('sign-in page', () => {
    cy.clearLocalStorage();
    bothWidths('Sign in', () => {
      cy.visit('/login');
      cy.contains('h1', 'Sign in');
    });
  });

  it('experiments list, filters sheet and account menu', () => {
    bothWidths('Experiments', () => {
      cy.visit('/dashboard');
      ready();
    });
    cy.contains('button', 'Filters').click();
    audit('Experiments filters sheet · 390');
    cy.viewport(1440, 900);
    cy.visit('/dashboard');
    ready();
    cy.get('[data-testid="all-experiments-toggle"]').click();
    cy.contains('th button', 'Questionnaires').click().click();
    cy.get('[data-testid="experiment-name"]')
      .first()
      .invoke('attr', 'href')
      .then((href) => {
        experimentPath = String(href);
      });
    cy.get('[data-testid="account-menu-button"]').click();
    audit('Account menu · 1440');
  });

  it('experiment hub tabs', () => {
    cy.then(() => {
      const id = experimentPath.split('/').pop();
      bothWidths('Hub overview', () => {
        cy.visit(experimentPath);
        cy.get('[data-testid="experiment-title"]');
        ready();
      });
      bothWidths('Hub questionnaires', () => {
        cy.visit(`/questionnairedashboard/${id}`);
        ready();
      });
      bothWidths('Hub messages', () => {
        cy.visit(`/messagedashboard/${id}`);
        ready();
      });
      bothWidths('Hub data', () => {
        cy.visit(`/experimentdata/${id}`);
        cy.contains('h2', 'Export as CSV');
        ready();
      });
    });
  });

  it('questionnaire builder, read-only', () => {
    cy.then(() => {
      cy.visit(`/questionnairedashboard/${experimentPath.split('/').pop()}`);
      ready();
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="questionnaire-row-"] a').length) {
          cy.get('[data-testid^="questionnaire-row-"] a').first().invoke('attr', 'href').then((href) => {
            bothWidths('Questionnaire', () => {
              cy.visit(String(href));
              cy.get('[data-testid="questionnaire-title"]');
              ready();
            });
          });
        }
      });
    });
  });

  it('new experiment form with errors', () => {
    bothWidths('New experiment', () => {
      cy.visit('/experimentcreation');
      cy.get('[data-testid="submit-experiment-button"]').click();
      cy.contains('Enter a name');
    });
  });

  it('export page and preview dialog', () => {
    bothWidths('Export', () => {
      cy.visit('/export');
      ready();
    });
    cy.viewport(1440, 900);
    cy.contains('button', "Everyone's").click();
    cy.get('[data-testid^="export-responses-"]').first().click();
    cy.get('[data-testid="export-preview-dialog"]').contains('Loading').should('not.exist');
    audit('Export preview dialog · 1440');
  });

  // WCAG 1.4.10, nothing scrolls sideways at 320px except tables inside their own box
  it('reflows at 320px without horizontal page scroll', () => {
    cy.viewport(320, 640);
    const pages = ['/dashboard', '/export', '/profile', '/experimentcreation'];
    cy.then(() => {
      if (experimentPath) pages.push(experimentPath, experimentPath.replace('/experiment/', '/questionnairedashboard/'), experimentPath.replace('/experiment/', '/experimentdata/'));
      pages.forEach((path) => {
        cy.visit(path);
        cy.get('main h1').should('exist');
        cy.get('.rc-loading').should('not.exist');
        cy.document().then((doc) => {
          expect(doc.documentElement.scrollWidth, `page width of ${path}`).to.be.at.most(320);
        });
      });
    });
    cy.clearLocalStorage();
    cy.visit('/login');
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth, 'page width of /login').to.be.at.most(320));
  });

  it('profile', () => {
    bothWidths('Profile', () => {
      cy.visit('/profile');
      cy.contains('h1', 'Profile');
    });
  });
});
