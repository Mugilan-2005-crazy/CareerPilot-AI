# CareerPilot AI — Phase 1 Documentation

This document records the actual Phase 1 implementation and verification status. It only documents features implemented in this repository at the time of Phase 1 completion.

## Implemented components

- Frontend (`client/`)
  - React + Vite + Tailwind application.
  - Centralized API client: `client/src/services/apiClient.ts` (axios-based) with access token injection and refresh flow.
  - `client/src/services/authService.ts` provides `login`, `register`, and `logout` functions.

- Backend (`server/`)
  - Express.js API server with structured routes under `/api`.
  - Authentication: JWT access tokens and persistent refresh tokens with rotation. See `server/controllers/authController.js` and `server/utils/token.js`.
  - Security middleware: Helmet, CORS (restricted to `CLIENT_URL`), rate limiting, mongo-sanitize, and XSS cleaning.
  - AI integration: `server/services/ai/orchestrator.js` selects providers and falls back to deterministic provider.
  - Deterministic provider: `server/services/ai/providers/deterministicProvider.js` forwards to the existing FastAPI AI microservice.
  - Ollama adapter: `server/services/ai/providers/ollamaProvider.js` (optional adapter; requires configuration).
  - AI health endpoint: `/api/ai/health` (server route implemented in `server/routes/aiRoutes.js`).

- AI microservice (`ai/`)
  - FastAPI service implementing deterministic resume analysis, skill-gap analysis, placement prediction, company recommendation, and interview question generation.
  - Endpoints:
    - `POST /api/ai/resume-analysis`
    - `POST /api/ai/skill-gap`
    - `POST /api/ai/placement-prediction`
    - `POST /api/ai/company-recommendation`
    - `POST /api/ai/interview-questions`
    - `GET /health`

## AI Provider Architecture (implemented)

- `AIOrchestrator` (`server/services/ai/orchestrator.js`)
  - Reads `AI_PROVIDER` from environment: `deterministic` (default), `ollama`, or `auto`.
  - When `AI_PROVIDER` is `ollama` or `auto`, it attempts to call the `ollamaProvider` and uses parsed structured JSON output when available.
  - Always falls back to the deterministic provider which preserves existing behavior by calling the FastAPI microservice.

- Response contract (internal):
  - `success`, `provider`, `model`, `content`, `structuredData`, `latency`, `fallbackUsed`, `requestId`, `error`.
  - Orchestrator returns provider responses; controllers map `content` back into existing API responses to preserve backwards compatibility.

## Configuration and Environment Variables

Key environment variables (see `server/.env.example`):

- `PORT` — backend port (default 5000)
- `NODE_ENV` — `development` or `production`
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — REQUIRED in production; no insecure defaults allowed
- `JWT_EXPIRES_IN` — Access token TTL (default `7d`)
- `CLIENT_URL` — allowed frontend origin for CORS
- `AI_SERVICE_URL` — base URL for the deterministic FastAPI microservice (default `http://127.0.0.1:8000`)
- `AI_PROVIDER` — `deterministic` (default), `ollama`, or `auto`
- `OLLAMA_URL` — base URL for local Ollama (default `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` — model name to use with Ollama (required when `AI_PROVIDER=ollama`)
- `OLLAMA_TIMEOUT_MS` — request timeout for Ollama

Important: `server/config/environment.js` enforces a fail-fast check in production to ensure `JWT_SECRET` is set to a secure value.

## Local Development Startup Order

1. MongoDB (local or remote)
2. (Optional) Ollama (if you will use local LLM capabilities)
3. AI microservice (`ai/`) — deterministic service
4. Backend API (`server/`)
5. Frontend (`client/`)

The system will gracefully fall back to deterministic AI microservice when Ollama is unavailable.

## Security Notes

- Do not commit secrets. Use environment variables and `.env` files excluded from version control.
- `JWT_SECRET` must be set to a strong value in production. The server will refuse to start in production without a secure secret.
- CORS is restricted to `CLIENT_URL` and credentials support is enabled.
- Rate limiting, request sanitization (`mongo-sanitize`), and XSS cleaning are enabled by default.
- AI providers must not expose provider keys to the frontend. All provider calls happen server-side.

## Testing

- Backend tests: `cd server && npm test` (uses Jest)
- Frontend build: `cd client && npm run build`

## Verification Performed (Phase 1)

- Backend tests executed and passed in the local environment.
- Backend startup requires MongoDB; if Mongo is not running the server will fail to start.
- AI microservice (deterministic) is present; starting it locally allows the deterministic provider to operate.
- Ollama adapter is present but optional; Ollama health is checked by the orchestrator when configured.

## Future work (not implemented in Phase 1)

- Cloud LLM adapters (Gemini, Claude, OpenAI) — not implemented in Phase 1.
- Production deployment, observability integration (Prometheus, Sentry), and advanced caching.

***

Document created for Phase 1 completion. Only features listed above are implemented and verified.
