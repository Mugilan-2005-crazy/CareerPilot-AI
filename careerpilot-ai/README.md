# CareerPilot AI

Professional project scaffold for the CareerPilot AI platform.

## Structure Overview

- client/: React + Tailwind CSS frontend
- server/: Node.js + Express.js backend
- ai/: Python + FastAPI AI services
- database/: MongoDB schemas, scripts, and seed-related assets
- docs/: Architecture, planning, and product documentation

## Current Implementation (Phase 1)

This repository contains an initial production-focused implementation of CareerPilot AI features appropriate for local development and continued incremental work. The following components are implemented and verified in Phase 1:

- Frontend: React + Vite + Tailwind application (client/)
- Backend: Express.js API with Mongoose models, JWT access tokens and refresh token rotation, auth flows, and resource CRUD endpoints (server/)
- AI microservice: Deterministic FastAPI service providing resume analysis and related endpoints (ai/)
- AI provider abstraction: Server-side orchestrator with a deterministic provider and an Ollama adapter (server/services/ai)

This README documents implemented behavior, local startup, environment variables, and Phase 1 limitations. Do not assume unimplemented cloud LLM providers are available.

## Quickstart — Local development (Phase 1)

Prerequisites:

- Node.js (16+)
- Python 3.10+ (for AI microservice) — optional if you use deterministic features only
- MongoDB (local or remote)

Basic startup order (recommended):

1. Start MongoDB (e.g., `mongod` or a local Docker container).
2. (Optional) Start Ollama if you intend to use local LLMs. See `docs/phase1_documentation.md` for details.
3. Start the AI microservice (FastAPI):

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

4. Start the backend API:

```bash
cd server
npm install
npm run dev
```

5. Start the frontend:

```bash
cd client
npm install
npm run dev
```

### Testing

Run backend tests:

```bash
cd server
npm test
```

Run frontend build:

```bash
cd client
npm run build
```

## Phase 1 Notes and Limitations

- Ollama is added as an optional provider adapter on the server but is not required. If `AI_PROVIDER` is set to `ollama` or `auto` and Ollama is not available, the system falls back to the deterministic AI microservice.
- Cloud providers (Gemini / Claude / OpenAI) are not implemented in Phase 1. Adapters may be added later.
- Do NOT commit real secrets. `.env.example` lists required environment variables.

See `docs/phase1_documentation.md` for detailed Phase 1 architecture, configuration, and security notes.
