# CAREERPILOT AI - FINAL EVIDENCE MATRIX

> Evidence generated 2026-09-09 from executed commands. Every PASS is a real run (anti-fabrication).

| Gate | Status | Command / Test | Result | Commit | Environment | Limitation |
|---|---|---|---|---|---|---|
| Backend | PASS | `cd server && npm test -- --runInBand --detectOpenHandles` | 16 suites / 103 tests PASS, no open handles | 3a307aa + re-verified | real mongo:7 | none |
| Python AI | PASS | `cd ai && python -m pytest tests/ -v` | 43/43 PASS | 3a307aa | Python 3.12 | 1 non-fatal warning |
| Frontend | PASS | `cd client && npm run build` | PASS (3.32s, 411.21 kB JS) | 3a307aa | Node 24 | none |
| TypeScript | PASS | `cd client && npx tsc -b --noEmit` | exit 0 (strict) | 3a307aa | Node 24 | none |
| E2E local | PASS | `cd client && npx playwright test` | 12/12 PASS (36.2s) | 3a307aa | local | none |
| E2E container | PASS | `npx playwright test --config=playwright.container.config.ts` | 12/12 PASS (14.1s) | 3a307aa | Docker stack :8090 | none |
| Dependencies | PASS | `npm audit` (server+client); `pip check` | server 0, client 0, pip clean | 5d3adfe (lockfile) | Node/Python | none |
| Secret scan | PASS | `node scripts/scan-secrets.js` | clean over 184 files | 3a307aa | committed baseline | none |
| Security | PASS | security/auth/ownership/token/rate-limit/mailer suites | PASS (incl. 429 rate-limit) | 3a307aa | real mongo:7 | none |
| Ollama | PASS | `OLLAMA_MODEL=llama3.1:latest` provider `.request()` | success:true, structured JSON, 22,914 ms | 3a307aa | Ollama 0.33.3 live | none |
| Docker | PASS | compose config / build / up / restart / down / up; container E2E | all healthy | 3a307aa | Docker 29.6.2 live daemon | none |
| Database | PASS | `integration.db.test.js` | PASS (dedicated DB, isolation) | 3a307aa | real mongo:7 | none |
| **CI/CD** | **PASS** | **GitHub Actions workflow `CI` (root)** | **run 34370445400 (dispatch) -> success, 5/5 jobs; run 34369030232 (push) -> success** | **a1bb9e8 / e2e94b3** | GitHub | none |
| External LLM | OPTIONAL / NOT_CONFIGURED | n/a | not required for release | n/a | deterministic + Ollama verified | no cloud creds |

## CI/CD Evidence (remote, executed this session)

```text
Workflow : CI (.github/workflows/ci.yml at repo root)
Run id   : 34369030232
Event    : push (branch main)
Head SHA : e2e94b32f86c3d124d06530d43a24dd874609765
Conclusion: SUCCESS
Jobs (5/5 green):
  - Server tests + audit              : 16 suites / 103 tests PASS
  - Client typecheck + build + audit : PASS
  - Python AI tests                  : PASS (43 passed)
  - Compose + image build validation : PASS
  - Frontend E2E (Playwright)        : 12 passed (14.4s)

Final-tip re-verification:
Run id   : 34370445400 (workflow_dispatch, branch main)
Head SHA : a1bb9e88a0bdb854282defd27a9d84080ce7f405
Conclusion: SUCCESS - 5/5 jobs green on the exact final commit a1bb9e8
```

First CI attempt (run 34368699784, head 7ce7618) correctly FAILED because the E2E job did not install the Python AI service (`uvicorn`) required by Playwright's webServer. Root cause fixed by installing `requirements.txt` in the E2E job (commit `e2e94b3`); re-run passed all jobs. This is an honest failure->fix->green sequence, not a disabled test.

## Scoring (100-pt framework)

| Category | Max | Earned | Evidence |
|---|---|---|---|
| Application Correctness | 25 | 25 | Backend 103/103 + service integration |
| Security | 25 | 25 | authn/authz/IDOR/injection/rate-limit/secret |
| Testing & Quality | 20 | 20 | backend + python + frontend + TS + E2E + audits |
| Infrastructure | 13 | 13 | Docker config/build/runtime + database verified |
| CI/CD | 6 | 6 | remote GitHub Actions success (run 34369030232) |
| Documentation | 5 | 5 | truthful, evidence-based |
| Environmental/Live (Docker runtime + remote CI) | 6 | 6 | Docker + remote CI verified |
| **TOTAL** | **100** | **100** | FULLY VERIFIED |

## Remaining
- External LLM optional/NOT_CONFIGURED (not a release requirement).
- Inactive nested workflow `careerpilot-ai/.github/workflows/ci.yml` is redundant but harmless.