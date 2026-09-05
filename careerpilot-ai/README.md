# CareerPilot AI

AI-Native Multi-Domain Career Decision Intelligence Operating System.

## Structure Overview

- `client/`: React + Vite + Tailwind CSS frontend
- `server/`: Node.js + Express.js backend
- `ai/`: Python + FastAPI AI microservice
- `database/`: MongoDB schemas, scripts, and seed-related assets
- `docs/`: Architecture, planning, and product documentation

## Implemented Features

### Authentication & Security
- JWT access tokens with refresh token rotation
- Password reset with hashed tokens (single-use, expiry)
- Rate limiting (global + auth + AI endpoints)
- Input validation (Zod on Node, Pydantic on Python)
- Output sanitization (internal provider keys stripped)
- Request ID correlation across services
- MongoDB injection protection (mongo-sanitize)
- XSS protection (xss-clean)
- Helmet security headers
- CORS restricted to configured client origin
- IDOR / ownership isolation on all student resources
- Mass-assignment protection on create/update

### Career Intelligence Engines
- **Skill Graph Engine**: prerequisites, dependents, related skills, learning order, coverage, suggestions, graph subset
- **Career Matching Engine**: multi-career compatibility scoring with confidence levels
- **Skill Gap Analysis**: priority classification, proficiency-adjusted effort estimation, prerequisite-aware gaps
- **Adaptive Roadmap Engine**: milestone-based learning paths with duration and hour-based planning
- **Project Intelligence Engine**: multi-factor project scoring (portfolio impact, industry relevance, differentiation)
- **Resume Intelligence**: ATS scoring, keyword detection, actionable recommendations
- **JD Intelligence**: job description keyword extraction, required/preferred classification, skill matching
- **Career Transition Engine**: transferable skill identification, feasibility scoring, recommended steps

### AI Architecture
- AI orchestrator with timeout protection (35s global)
- Deterministic provider (Python FastAPI microservice)
- Optional Ollama provider adapter with automatic fallback
- Strict request/response schemas on all endpoints
- Oversized request body rejection (64KB limit)
- Safe error messages (no stack traces or internals leaked in production)

### Frontend
- Protected routes with client-side guard
- Token refresh interceptor with race-safety
- Career Command Center dashboard
- Career Explorer, Skill Gap, Roadmap, Projects, Resume Analyzer, Interview Coach, AI Chat
- Dark mode toggle
- Responsive design with Tailwind CSS

### Testing
- **Backend**: 15 Jest test suites, 86 tests (auth, security, AI evaluation, career intelligence, skill graph, integration)
- **Python AI**: 4 pytest suites, 43 tests (API, career intelligence, skill graph, AI evaluation)
- **E2E**: 12 Playwright tests (auth flows, session persistence, AI protection, complete career journey)
- **Security**: IDOR, mass assignment, token rotation, refresh race, prompt injection tests

## Quickstart — Local development

Prerequisites:
- Node.js (20+)
- Python 3.12+ (for AI microservice)
- MongoDB (local or remote)

Basic startup order:

1. Start MongoDB
2. Start the AI microservice:
   ```bash
   cd ai
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   pip install -r requirements.txt -r requirements-dev.txt
   uvicorn main:app --reload --port 8000
   ```
3. Start the backend API:
   ```bash
   cd server
   npm install
   npm run dev
   ```
4. Start the frontend:
   ```bash
   cd client
   npm install
   npm run dev
   ```

### Testing

```bash
# Backend tests
cd server && npm test

# Python AI tests
cd ai && python -m pytest tests/ -v

# Frontend build
cd client && npm run build

# E2E tests
cd client && npx playwright test --config=playwright.config.ts
```

### Security scanning

```bash
cd server && npm audit --omit=dev --audit-level=high
cd client && npm audit --omit=dev --audit-level=high
node scripts/scan-secrets.js
```

## Environment Variables

See `.env.example` for required variables. Key variables:

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Strong secret for JWT signing (required in production)
- `AI_PROVIDER`: `deterministic` | `ollama` | `auto`
- `AI_SERVICE_URL`: Python AI microservice URL
- `OLLAMA_URL`: Ollama server URL (optional)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: Email configuration (optional)

## API Versioning

- Canonical endpoints: `/api/v1/*` (security-hardened)
- Legacy compatibility: `/api/*` (maintained for backward compatibility)

Clients should transition to `/api/v1/*` with Bearer tokens.
