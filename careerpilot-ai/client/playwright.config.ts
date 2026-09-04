import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(__dirname, '../server');

const E2E_DB = 'mongodb://127.0.0.1:27017/careerpilot_e2e';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  // Start both the backend and frontend before tests run.
  // The backend uses a dedicated E2E database so developer data is untouched.
    globalSetup: './e2e/global-setup.ts',
  webServer: [
    {
      command: 'node server.js',
      cwd: serverDir,
      port: 5000,
      timeout: 30000,
      reuseExistingServer: !process.env.CI,
      env: {
        MONGO_URI: E2E_DB,
        JWT_SECRET: 'e2e-test-secret-do-not-use-in-production',
        JWT_EXPIRES_IN: '7d',
        NODE_ENV: 'development',
        CLIENT_URL: 'http://localhost:3000',
        AI_PROVIDER: 'deterministic',
        AI_SERVICE_URL: 'http://127.0.0.1:8000',
        PORT: '5000',
        OLLAMA_URL: 'http://127.0.0.1:11434',
        OLLAMA_TIMEOUT_MS: '20000',
      },
    },
    {
      command: 'npm run dev',
      cwd: __dirname,
      port: 3000,
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
