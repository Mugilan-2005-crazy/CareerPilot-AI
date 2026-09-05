# E2E VERIFICATION REPORT

**Status: PASS (9/9 tests, local execution)**

## Framework

- Playwright (`@playwright/test` ^1.62.1), Chromium, TypeScript
- Config: `client/playwright.config.ts`, tests in `client/e2e/`
- Backend started on :5000 against dedicated DB `careerpilot_e2e` (global setup drops DB before run; cleanup script after run)
- Frontend dev server on :3000 with `/api` proxy to :5000

## Command

```powershell
cd client
npx playwright install chromium   # one-time
npx playwright test --reporter=list
```

## Result

```text
Running 9 tests using 2 workers
  ✓ ai-protection.spec.ts — AI endpoint returns 401 when no JWT is present
  ✓ ai-protection.spec.ts — legacy AI endpoint also requires authentication
  ✓ auth.spec.ts — application loads and shows the landing page
  ✓ auth.spec.ts — protected route redirects to login without auth
  ✓ auth.spec.ts — register creates account and auto-logs-in to dashboard
  ✓ auth.spec.ts — login flow works and reaches dashboard
  ✓ auth.spec.ts — session persists across page reload
  ✓ auth.spec.ts — logout (clearing tokens) redirects to login on protected route
  ✓ auth.spec.ts — failed refresh clears session and redirects to login

  9 passed (18.6s)
```

## Coverage mapping (required scenarios)

| Required scenario | Test |
|---|---|
| Application loads | `application loads and shows the landing page` |
| Login works | `login flow works and reaches dashboard` |
| Protected route works | `register creates account and auto-logs-in to dashboard` |
| Reload preserves session | `session persists across page reload` |
| Logout works | `logout (clearing tokens) redirects to login` |
| Unauthorized user redirected | `protected route redirects to login without auth` |
| Failed refresh recovery | `failed refresh clears session and redirects to login` |
| AI endpoint blocked without auth (v1 + legacy) | 2 × `ai-protection.spec.ts` tests |

## Known limitations

- Tests exercise the deterministic AI provider (no external LLM dependency) — correct for CI determinism.
- Remote/CI execution of the new `e2e` job not yet observed (see CI_VERIFICATION.md).
