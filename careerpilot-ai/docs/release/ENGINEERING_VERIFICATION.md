# CareerPilot AI — Engineering Verification Record (Release Gate)

This file records the evidence generated in this working copy during the
release-gate certification. Every result below was produced by actually
running the described checks. nothing was inferred or asserted without running
it.

## Metadata

- Date: 2026-09-15
- Branch: `main`
- Baseline SHA (start of gate): `84a7c587e822bd2fceb99c6e5ac9c9223061eac8`
- **Final SHA (certified): `c35a9422eddca17ec33fd8f3b8e8e65a56cacff0`**
- Remote `origin/main` == local HEAD == CI workflow head SHA == `c35a942` (verified)

## Change under certification

`client/src/App.tsx` — route-level code splitting. 16 page components converted
from static imports to `React.lazy(() => import(...))`, wrapped in a single
`<Suspense>` with an accessible `RouteFallback` (`role="status"`,
`aria-label="Loading page"`). No routes removed, no SSR assumptions introduced;
the public shell and `RequireAuth` guard are unchanged. Supported by
`docs/architecture/*` and release documentation tracked in the same series.

## Local verification evidence (executed)

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Backend | PASS — 16 suites / 103 tests | `cd server && npm test -- --runInBand --detectOpenHandles` (live Mongo 127.0.0.1:27017) |
| AI (Python) | PASS — 43/43 tests | `cd ai && python -m pytest tests/ -q` |
| Python deps | PASS | `python -m pip check` → "No broken requirements found." |
| Frontend typecheck | PASS | `cd client && npx tsc -b --noEmit` → exit 0 |
| Frontend build | PASS, no >500 kB chunk warning | `cd client && npm run build`; entry `index-*.js` 221.01 kB (gzip 74.39 kB), 16 lazy page chunks (2–11 kB) |
| E2E (Playwright/Chromium) | PASS — 12/12 | `cd client && npx playwright test --workers=1` (auto-started server:5000, ai:8000, client:3000) |
| Secret scan | PASS — clean over 192 files | `node scripts/scan-secrets.js` (36 known test placeholders transparently ignored) |
| Server dependency audit | PASS — 0 vulnerabilities | `cd server && npm audit --omit=dev --audit-level=high` |
| Client dependency audit | PASS — 0 vulnerabilities | `cd client && npm audit --omit=dev --audit-level=high` |

## Docker gate (resolved in this run)

Docker Desktop daemon was started on this machine and the full gate executed:

- `docker info` → Server 29.6.2 (aarch64, 8 CPUs), daemon reachable.
- `docker compose config -q` → exit 0 (valid).
- `docker compose build --no-cache` → server, ai, client images **Built**, exit 0.
  (First attempt hit a transient pip resolver/index hiccup on `pydantic-core`
  during backtracking; isolated retry installed `pydantic==2.12.5` /
  `pydantic-core==2.41.5` from the manylinux2014 aarch64 wheel successfully and
  the full build then passed.)
- `docker compose up -d` → all services started in order: mongo healthy → ai
  healthy → server healthy → client up.
- Healthchecks: mongo, ai, server all `(healthy)`.
- Connectivity: server `/health` via `:5020` → 200; client `/health` via
  `:8090` (nginx→server) → 200; server→ai internal `http://ai:8000/health` →
  200; ai `/health` → `{"status":"ok"}`.
- Containerized end-to-end smoke through the stack: register → 201 (token
  issued), `/api/v1/users/me` → 200, authenticated
  `/api/v1/ai-career/career-matching` → 200 with structured result.
- Recovery: `docker compose restart` → ai/mongo/server healthy again; server
  `/health` → 200.
- Cleanup: `docker compose down` → exit 0.

**DOCKER = PASS.**

## CI/CD gate (resolved in this run)

The repository workflow `.github/workflows/ci.yml` is push-triggered. `gh` is
not authenticated locally, so the run was verified through the public GitHub
Actions REST API (repo is public):

- Run **#10** (id `34935670444`), event `push`, on `head_sha
  c35a9422eddca17ec33fd8f3b8e8e65a56cacff0` → **status completed, conclusion
  success**.
- All 5 jobs **success**: "Server tests + audit" (real MongoDB), "Python AI
  tests", "Client typecheck + build + audit", "Security / secret scan",
  "Compose + image build validation".
- Earlier push on the same code series (run #9, `99a4150`) also completed
  success with all 5 jobs green.

**CI/CD = PASS** (exact-SHA matched, all jobs verified).

## Security result

All security gates passed: auth/ownership/IDOR/mass-assignment/refresh-rotation
and rate-limit suites (in the 103 backend tests), MPI/NoSQL/XSS sanitization,
secret scan clean, and dependency audits clean (server 0, client 0, pip check
clean). No secret contents are recorded in any commit or this document.

## Known limitations (documented, non-blocking)

1. **External LLM (Gemini/OpenAI/Anthropic): NOT_CONFIGURED** by design;
   `AI_PROVIDER=deterministic` default, Ollama optional and supported.
2. The first `--no-cache` compose build hit a transient pip resolver hiccup on
   `pydantic-core==2.41.5` (arm64); isolated install and a full rebuild
   succeeded. No source change was required.

## Release decision

All mandatory gates are verified: backend, AI, frontend typecheck + build, E2E,
security, secret scan, dependency audits, Docker runtime, and remote CI on the
exact final SHA, with a clean working tree.

**100/100 — FULLY VERIFIED — APPROVED.**