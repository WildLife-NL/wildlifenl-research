// cypress.config.ts

import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
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
