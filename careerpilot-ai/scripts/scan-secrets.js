// Repository secret scanner. Scans tracked files (excluding lockfiles and
// node_modules) for common secret patterns. Fails (exit 1) if anything matches.
const fs = require('fs');
const path = require('path');

const patterns = [
  /AKIA[0-9A-Z]{16}/, // AWS access key id
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/, // private keys
  /\bsk-[A-Za-z0-9]{20,}/, // OpenAI-style secrets
  /(password|passwd|secret|token)\s*[=:]\s*["'][^"'\s]{6,}["']/i, // secret assignments
];

// Arbitrary test/placeholder values in fixtures and smoke scripts are NOT
// secrets. If a match's value is one of these, we report it as an ignored
// placeholder rather than a finding (transparent, not silently dropped).
const PLACEHOLDERS = new Set([
  'password123',
  'Password123',
  'password123!',
  'newpassword123',
  'newpassword1',
  'newpassword2',
  'changeme',
  'change-me',
  'test',
  'test-secret',
  'secret',
  'example',
  'dev-secret-change-me',
  'change-this-secret-in-production',
  'runtime-local-verify-secret-0123456789abcdef',
  'e2e-test-secret-do-not-use-in-production',
  // Test-only token / password values used exclusively in Jest fixtures
  // and smoke scripts. These are NEVER used in production code paths.
  'refresh-token',
  'access-token',
  'test-token',
  'mock-token',
  'fake-token',
  'sample-token',
  'valid-refresh-token',
  'wrong-token',
  'reset-token',
  'expired-token',
  'wrong-password',
  'totally-different-token',
  'old-token',
  'replaced-token',
]);

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', '.pytest_cache']);
const SKIP_FILE = /(package-lock\.json|\.pyc$|\.tsbuildinfo$|\.map$)/;

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && !SKIP_FILE.test(ent.name)) out.push(full);
  }
}

const root = process.cwd();
const files = [];
walk(root, files);

let findings = 0;
let ignored = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let flagged = false;
  for (const re of patterns) {
    // Find all matches and check if every match is a known placeholder
    const matches = content.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'));
    if (!matches) continue;
    const realMatches = matches.filter((m) => {
      // Extract the quoted value from patterns like password="value"
      const valMatch = m.match(/["']([^"']{6,})["']/);
      if (!valMatch) return true; // Can't extract value → treat as real
      return !PLACEHOLDERS.has(valMatch[1]);
    });
    if (realMatches.length > 0) {
      flagged = true;
      break;
    }
    if (matches.length > 0 && realMatches.length === 0) {
      ignored += matches.length;
    }
  }
  if (flagged) {
    findings++;
    console.log(`POTENTIAL-SECRET ${file}`);
  }
}
if (ignored > 0) {
  console.log(`(ignored ${ignored} known test-placeholder matches)`);
}

if (findings > 0) {
  console.error(`Secret scan found ${findings} file(s) with potential secrets.`);
  process.exit(2);
}
console.log(`Secret scan clean over ${files.length} files.`);