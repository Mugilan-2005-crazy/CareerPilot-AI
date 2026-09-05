# CareerPilot AI Baseline Verification

**Verification date:** 2026-09-01

| Area | Command | Result |
|---|---|---|
| Backend | `cd server; npm test -- --runInBand --detectOpenHandles --silent` | PASS, 9 suites, 36 tests |
| Security | focused AI/auth/ownership/token Jest suites | PASS, 24 tests |
| Frontend | `cd client; npm run build` | PASS, TypeScript and Vite; 2000 modules |
| Python | `cd ai; py -m compileall -q .` | PASS; no Python tests exist |
| Server dependencies | `cd server; npm audit --audit-level=high` | PASS, 0 vulnerabilities |
| Client dependencies | `cd client; npm audit --audit-level=high` | FAIL, 4 transitive vulnerabilities remain |
| Compose | `docker compose config --quiet` with temporary validation secret | PASS |
| Docker runtime | `docker version` | BLOCKED, Docker Desktop Linux engine unavailable |
| Live MongoDB | disposable `careerpilot_release_assurance` probes | PASS, ownership and refresh race verified; database cleaned |
| E2E | frontend test infrastructure inspection | BLOCKED, no E2E framework exists |
| CI | workflow inspection | CONFIGURED; remote execution unavailable |

## Warnings And Constraints

- No real credentials were printed or committed.
- The local server `.env` is development-only and ignored by Git.
- Client dependency remediation requires breaking Vite/React Router upgrades and was not applied blindly.
- No live Ollama or external provider test was performed.
