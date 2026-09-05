# BASELINE_BEFORE_ULTRA_MASTER — CareerPilot AI

**Captured:** 2026-09-05
**Protected commit:** `499fc3c` — "feat: implement AI-native multi-domain career intelligence platform"
**Branch:** `main`

---

## 1. Repository

| Item | Value |
|---|---|
| Remote | `origin https://github.com/Mugilan-2005-crazy/CareerPilot-AI.git` |
| Branch | `main` |
| Head | `499fc3c` |
| Working-tree delta | 16 modified + 5 untracked (verified improvements from prior session) |

## 2. Architecture (from tree inspection)

```
careerpilot-ai/
├── client/   # React 18 + TypeScript + Vite, AuthContext, v1 API client, Playwright
├── server/   # Express + Mongoose, JWT auth, AI orchestration, Zod, ownership guards
├── ai/       # FastAPI + Pydantic v2, deterministic engines, skill graph
├── database/ # seed scripts
├── docs/     # ARCHITECTURE, SECURITY, API_REFERENCE, TESTING, DEPLOYMENT, TROUBLESHOOTING
├── scripts/  # helper scripts
├── .github/workflows/ci.yml  # repo-root workflow (relocated from nested layout)
├── docker-compose.yml        # mongo + ai + server + client
└── *.md                      # certifications + release baselines
```

## 3. Services & Ports

| Service | Port | Source |
|---|---|---|
| MongoDB | 27017 | docker-compose.yml / system service |
| Python AI | 8000 | uvicorn |
| Node API | 5000 | `server/server.js` |
| Frontend (dev) | 5173 / 3000 | Vite |
| Frontend (prod container) | 8090 → nginx → 80 | docker-compose.yml |

## 4. Backend Routes (server/app.js + server/routes)

Legacy (`/api/*`):
- `/api/auth/*`
- `/api/ai/*` (core AI, auth + rate-limit)
- `/api/ai-career/*`
- `/api/skill-graph/*`
- `/api/jd-intelligence/*`
- `/api/career-transition/*`
- `/api/resumes`, `/api/profiles`, `/api/progress`, etc. (generic resource CRUD)

Versioned (`/api/v1/*`): same surface + `/api/v1/users/me` (added in this session's working tree).

## 5. Database Models

- `User` (auth, role, refresh tokens, password reset)
- `Resume`, `Profile`, `Progress` (and similar student-scoped resources)
- Indexes on owner fields; ownership enforced server-side

## 6. AI Providers (server/services + ai/)

- **deterministic** (default, offline, no external network)
- **ollama** (optional, configurable via `AI_PROVIDER`, `OLLAMA_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS`)
- **openai-compatible** (future)

Python AI service exposes: `/api/ai/*` (analysis, jd-analysis, resume-analysis, skill-gap, placement-prediction, company-recommendation, interview-questions, ai-chat) and `/api/skill-graph/*`.

## 7. Environment Variables (server)

```
NODE_ENV
PORT
MONGO_URI
JWT_SECRET
JWT_EXPIRES_IN
CLIENT_URL
AI_SERVICE_URL
AI_PROVIDER (deterministic|ollama|openai)
OLLAMA_URL
OLLAMA_MODEL
OLLAMA_TIMEOUT_MS
SMTP_*  (for password reset)
```

## 8. Test Suites (verified this session)

| Layer | Command | Count | Status |
|---|---|---|---|
| Backend | `cd server && npx jest --runInBand --no-cache` | 15 suites / 86 tests | PASS |
| Python | `cd ai && python -m pytest tests/ -q` | 4 files / 43 tests | PASS |
| Frontend | `cd client && npm run build` (tsc + vite) | 1 build | PASS |
| E2E | `cd client && npx playwright test --project=chromium` | 12 tests | PASS |
| Audit | `npm audit --omit=dev --audit-level=high` (server + client) | 0 high+ | PASS |
| Python deps | `pip check` | clean | PASS |

## 9. Build Commands

- Server: `npm install` (no build step, plain Node)
- Client: `npm install && npm run build` → `dist/`
- Python: `pip install -r ai/requirements.txt` and `ai/requirements-dev.txt`

## 10. Docker

- `docker compose config` — schema-valid (not re-run this session)
- `docker compose build --no-cache` — previously verified
- `docker compose up -d --force-recreate` — previously verified (4 services healthy)
- Daemon is not available in the current Windows sandbox; see Residual Risks.

## 11. Known Technical Debt

| # | Item | Severity |
|---|---|---|
| 1 | `node_modules/` tracked in git history | Hygiene (P3) |
| 2 | Docker daemon not installed in current sandbox | Sandbox limit (P3) |
| 3 | Rate limit not stress-tested live | P3 |
| 4 | External LLM providers (Gemini/Claude) not exercised | Optional |

## 12. Current Limitations

- Ollama is an optional provider; deterministic is the default.
- External LLM providers are stubbed through an OpenAI-compatible abstraction; not exercised against real keys.
- RAG layer is not implemented (not required by current product surface).
- Multilingual UI: i18n scaffolding present; full Tamil/Tanglish/Hindi expansion is roadmap.

---

This baseline is the reference for the Ultra Master Final Boss mission. All deltas (working-tree modifications) are documented in `ISSUE_REGISTER.md` and validated in `FINAL_CERTIFICATION_REPORT.md`.
