import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(__dirname, '../server');
const script = resolve(serverDir, 'scripts/clean-db.js');

export default async function globalSetup() {
  // Drop the dedicated E2E database so every test run starts clean.
  // Non-fatal if MongoDB is not yet reachable — the webServer will retry.
  try {
    execSync(`node "${script}"`, {
      cwd: serverDir,
      env: { ...process.env, MONGO_URI: 'mongodb://127.0.0.1:27017/careerpilot_e2e' },
      timeout: 10000,
      stdio: 'pipe',
    });
  } catch (e) {
    // Ignore — database may not exist yet
  }
}
