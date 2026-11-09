// cypress.config.ts

import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    // The folder is Cypress with a capital C, so the defaults only matched on case-insensitive disks
    specPattern: 'Cypress/e2e/**/*.cy.ts',
    supportFile: 'Cypress/support/e2e.ts',
    screenshotsFolder: 'Cypress/screenshots',
    video: false,
    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 15000,
    setupNodeEvents(on, config) {
      // Headless Electron opens a 1280x720 window, which clipped the 1440x900 screenshots
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'electron') {
          launchOptions.preferences.width = 1600;
          launchOptions.preferences.height = 1100;
        }
        return launchOptions;
      });

      // Path to the .env file
      const envFilePath = './.env';
      
      // Check if .env file exists
      if (fs.existsSync(envFilePath)) {
        // Parse the .env file
        const envConfig = dotenv.parse(fs.readFileSync(envFilePath));
        
        // Merge the parsed variables into Cypress config.env
        config.env = { ...config.env, ...envConfig };
      }

      // Override with environment variables from process.env (e.g., GitHub Secrets)
      config.env.AUTH_TOKEN = process.env.AUTH_TOKEN || config.env.AUTH_TOKEN;

      return config;
    },
  },
});
