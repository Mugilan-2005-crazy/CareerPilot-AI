import { defineConfig, devices } from '@playwright/test';

/**
 * VERIFICATION-ONLY config (temporary): runs the official e2e specs against a
 * DEPLOYED stack (docker compose: client on :8090 -> nginx -> server -> ai)
 * instead of starting local dev servers on 3000/5000/8000.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8090',
    trace: 'off',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
