# CareerPilot AI — FINAL RELEASE BASELINE

_Phase 0 capture. Agent-compiled from live inspection (not assumed)._

## Repository state

- **Git root:** `C:\Users\mugil\OneDrive\Documents\CareerPilot AI` (single top-level tracked path: `careerpilot-ai/`)
- **Branch:** `main` (HEAD `fc9a159` == `origin/main` `fc9a159`)
- **Remote:** `origin https://github.com/Mugilan-2005-crazy/CareerPilot-AI.git`
- **Working tree:** large uncommitted delta vs HEAD (the hardened backend, SMTP fix, Dockerfiles, E2E suite, CI workflow, docs) — HEAD predates all of it.
- **Hygiene note:** `client/node_modules` and `server/node_modules` are tracked in git history (7671+ files) and appear modified; this is a repo-hygiene debt, not an application defect.

## Runtime environment

| Tool | Version | Status |
|---|---|---|
| Node | v24.14.0 | ok |
| npm | 11.9.0 | ok |
| Python (ai/.venv) | 3.12.10 | ok |
| MongoDB (127.0.0.1:27017) | reachable | ok |
| Playwright Chromium (ms-playwright) | installed | ok |
| Docker client | 29.6.2 (windows/arm64) | client ok |
| Docker daemon | — | was DOWN at baseline; relaunch attempted |

## Known-good areas (from prior verified run)

- Backend: 11 suites / 53 tests PASS, `--detectOpenHandles` clean
- Frontend build: `tsc -b && vite build` PASS (366.51 kB JS / 11.78 kB CSS)
- Python: 11/11 pytest PASS; `pip check` clean
- E2E: 9/9 Playwright (Chromium) PASS against dedicated `careerpilot_e2e`
- `npm audit` (server+client): 0 vulnerabilities
- Secret scan: clean over 128 files
- SMTP fix verified (enabled/disabled paths; no enumeration; hashed token; single-use)

## Known blockers entering this effort

1. **Docker runtime** — daemon was unavailable; runtime build/up/health NOT verified. (Re-attempted this run.)
2. **GitHub Actions remote CI** — no remote run observed. Remote is readable; push requires a clean, intentional commit.

## Release gates (all must be PASS to certify)

Backend tests · Frontend build · Python tests · E2E · Auth · Authorization/IDOR · Refresh rotation ·
Input security · Rate limiting · Secret scan · Dependency audit · DB isolation · SMTP/reset ·
Docker config · Docker runtime · Docker E2E · GitHub CI · Production config · Documentation ·
Release readiness.

## Environment limitations

- Possibly no credentialed push to the remote (not yet tested with a push).
- Docker Desktop startup latency / engine availability is uncertain on ARM64 Windows.

---

## RESOLUTION (end of session)

| Blocker at baseline | Outcome | Evidence |
|---|---|---|
| Docker runtime not verified | **RESOLVED** | Docker Desktop started; `compose build --no-cache` → 3 images; `compose up -d --force-recreate` → all services healthy; black-box auth/AI/rotation verified; Playwright 9/9 against the stack |
| Remote CI unverified | **RESOLVED** | Workflow relocated to repo root (Actions does not discover nested workflows); GitHub Actions run `33858397527` → `conclusion=success`, 5/5 jobs |
| Push capability unknown | **CONFIRMED** | Pushes `fc9a159→10e943d`, `10e943d→b96c2d4`, `b96c2d4→d51dc4f` to `origin/main` succeeded via stored credentials |

See [FINAL_RELEASE_CERTIFICATION.md](FINAL_RELEASE_CERTIFICATION.md) for the gate-by-gate scorecard.