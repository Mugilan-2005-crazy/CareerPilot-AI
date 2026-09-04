import { defineConfig, devices } from '@playwright/test';

// Runs the E2E suite against the running Compose stack (client on :8090,
// backend proxied by nginx). This is the production-environment E2E path.
// Override with E2E_BASE_URL if the client is exposed elsewhere.
const BASE = process.env.E2E_BASE_URL || 'http://localhost:8090';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});