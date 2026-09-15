# CareerPilot AI — Engineering Verification Record (Release Gate)

Every result below was generated from actual commands executed in this working
copy during the release-gate run. No result is inferred or reused from earlier
runs.

## Metadata

- Date: 2026-09-15
- Branch: `main`
- Baseline SHA (start of gate): `84a7c587e822bd2fceb99c6e5ac9c9223061eac8`
- Final code SHA (release commit): `296110582e31d886e5295b668d07498371ea4178`
- Remote `origin/main` (before release commit): `84a7c587e822bd2fceb99c6e5ac9c9223061eac8`

## Change under certification

`client/src/App.tsx` — route-level code splitting. 16 page components converted
from static imports to `React.lazy(() => import(...))`, wrapped in a single
`<Suspense>` with an accessible `RouteFallback` (`role="status"`,
`aria-label="Loading page"`). No routes removed, no SSR assumptions introduced,
no circular/duplicate graph change; `RequireAuth` guard and public shell
unchanged.

## Verification evidence (executed this run)

| Gate | Result | Command / Evidence |
| ---- | ------ | ------------------ |
| Backend | **PASS** — 16 suites / 103 tests | `cd server && npm test -- --runInBand --detectOpenHandles` (live Mongo 127.0.0.1:27017) |
| AI (Python) | **PASS** — 43/43 tests | `cd ai && python -m pytest tests/ -q` |
| Python deps | **PASS** | `python -m pip check` → "No broken requirements found." |
| Frontend typecheck | **PASS** | `cd client && npx tsc -b --noEmit` → exit 0 |
| Frontend build | **PASS** — no >500 kB chunk warning | `cd client && npm run build`; initial chunk `index-DUPqL0pN.js` 221.01 kB (gzip 74.39 kB), 16 lazy page chunks 2–11 kB |
| E2E (Playwright/Chromium) | **PASS** — 12/12 | `cd client && npx playwright test --workers=1` (auto-started server:5000, ai:8000, client:3000) |
| Secret scan | **PASS** — clean over 192 files | `node scripts/scan-secrets.js` (36 known test placeholders ignored transparently) |
| Server dependency audit | **PASS** — 0 vulnerabilities | `cd server && npm audit --omit=dev --audit-level=high` |
| Client dependency audit | **PASS** — 0 vulnerabilities | `cd client && npm audit --omit=dev --audit-level=high` |
| `git diff --check` | **PASS** — no whitespace errors | exit 0 on staged code |

## Docker gate

- `docker --version` → `Docker version 29.6.2, build dfc4efb` (CLI present).
- `docker info` → returns only the client (`desktop-linux` context); **no
  Server section** — the daemon is not reachable
  (`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`).

**DOCKER = BLOCKED_BY_ENVIRONMENT.** No `docker compose build/up/ps`, healthcheck,
networking, restart, or containerized-E2E evidence was produced. Nothing was
simulated or faked.

## CI/CD gate

- `gh --version` → `gh version 2.100.0`.
- `gh auth status` → **not logged into any GitHub host**; `gh auth login`
  required.

**CI/CD = UNVERIFIED.** No workflow was triggered or observed. The repository
workflow is `.github/workflows/ci.yml` (jobs: backend, frontend, ai, security,
docker). A fresh remote run on the final SHA can be verified only after
authentication on a machine with Docker available.

## Security result

All local security gates passed: auth/ownership/IDOR/mass-assignment/refresh
rotation suites (in the 103 backend tests), secret scan clean, and dependency
audits clean. No secret contents are recorded in this document or any commit.

## Known limitations / remaining blockers

1. **Docker** — daemon unavailable on this machine: `BLOCKED_BY_ENVIRONMENT`.
2. **CI/CD** — GitHub CLI unauthenticated on this machine: `UNVERIFIED`.
3. **External LLM** — `NOT_CONFIGURED` (by design; `AI_PROVIDER=deterministic`
   default, Ollama optional).

## Release decision

Because Docker runtime verification and a remote CI run are not possible from
this environment, the certification cannot be `100/100` here.

**APPROVE-WITH-CONDITIONS** — remaining conditions: run `docker compose up` on a
Docker-enabled host and confirm a green GitHub Actions run on the final SHA.