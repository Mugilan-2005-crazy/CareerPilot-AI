# CareerPilot AI — System Architecture

## Overview

CareerPilot AI is an **AI-native, multi-domain Career Decision Intelligence platform**. It combines a React single-page frontend, an Express API gateway, and a Python FastAPI AI microservice, persisted in MongoDB. A local Ollama instance and a deterministic provider both implement the AI provider interface, so the platform stays functional with or without a local LLM.

## High-Level Topology

```text
 Browser (React SPA)                     Docker Compose stack
+-------------------+                    +---------------------------------------------+
| Vite-built SPA    | -- HTTPS/WSS --->  | nginx (client) :80         -> serves SPA    |
| AuthContext/JWT   |                    |   | proxy /api -> server                     |
+-------------------+                    | server (Express) :5000                      |
                                         |   | services/middleware/routes             |
                                         | mongo (mongo:7) :27017                     |
                                         | ai (FastAPI/uvicorn) :8000    (internal)    |
                                         |   | app/routers, app/services             |
                                         +---------------------------------------------+
                                         Ollama :11434 (host, optional) <--- server
```

## Component Responsibilities

| Component | Stack | Responsibility |
|---|---|---|
| `client/` | React 18 + Vite + Tailwind CSS + TypeScript | SPA, auth state, protected routes, AI UI |
| `server/` | Node.js + Express + Mongoose + Zod | API gateway, auth/authz, business services, AI orchestration, resource CRUD |
| `ai/` | Python + FastAPI + Pydantic | Deterministic AI provider: resume analysis, skill gap, placement prediction, career intelligence, skill graph |
| `database/` | MongoDB (mongo:7) | Persistent storage |
| `Ollama` (optional) | local LLM | Local structured generation when configured |

## Backend Request Path

```text
Browser
  -> /api/* or /api/v1/*
  -> app.js middleware chain:
       helmet() -> cors(CLIENT_URL) -> requestId -> morgan + requestLogger
       -> rate limiter -> express.json({limit:'10mb'}) -> sanitizeMongo -> xssProtection
  -> routes (versioned /api/v1 + legacy /api)
  -> auth middleware (JWT) -> authorize (role) -> controller -> service -> model (Mongoose/MongoDB)
  -> response (or notFound / errorHandler)
```

## API Versioning

- **Canonical:** `/api/v1/*` (auth, ai, ai-career, skill-graph, jd-intelligence, career-transition, users).
- **Legacy compatibility:** `/api/*` (auth, ai, ai-career, skill-graph, jd-intelligence, career-transition, resource CRUD).
- AI endpoints are JWT-protected on **both** versioned and legacy paths (verified by E2E `ai-protection.spec.ts`).

## Database Design

MongoDB with Mongoose. Key collections include users, refresh tokens, profiles, resumes, resume-analyses, skill-gap-reports, placement-predictions, skill-graph (skills/careers/career-skill-mappings), roadmaps, mock-interviews, and admin logs. Ownership is enforced on student resources via a shared resource controller; indexes and unique constraints (e.g. user+career on JobMatch) are defined in the models.

## Security Boundaries

- Frontend talks only to the Express gateway.
- The AI microservice is **internal only**: no CORS is configured, and the Node API server (via nginx/docker-network) is the sole caller. See `docs/security/SECURITY_ARCHITECTURE.md`.

## Deployment Topology

Docker Compose (`docker-compose.yml`) runs `mongo`, `ai`, `server`, and `client` (nginx). The server requires `JWT_SECRET` (fail-closed in compose). See `docs/deployment/`.

## Key Lifecycles

See `docs/architecture/REQUEST_LIFECYCLE.md` and `docs/architecture/AUTH_ARCHITECTURE.md`.