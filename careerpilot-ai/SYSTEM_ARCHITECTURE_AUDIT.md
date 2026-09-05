# CareerPilot AI System Architecture Audit

**Audit date:** 2026-09-01

## Architecture

```text
React/Vite client
  -> Axios API client and Bearer JWT
  -> Express middleware
     Helmet / CORS / request ID / logging / global rate limit /
     JSON limits / Mongo sanitization / XSS protection
  -> /api/v1 and legacy /api routes
  -> auth, AI, and resource controllers
  -> Mongoose models and MongoDB
  -> AI orchestrator
     -> Ollama adapter (optional)
     -> deterministic FastAPI provider
```

## Trust Boundaries

- Browser/native client to Express: untrusted HTTP input, JWT bearer credential.
- Express to MongoDB: server-controlled queries and ownership checks.
- Express to AI service/Ollama: server-selected task and bounded validated payload.
- CI/deployment to services: environment-provided secrets; no credentials are embedded in images.

## Authentication Flow

Registration and login issue an access token plus a raw refresh token to the client. New refresh-token digests are stored in MongoDB. Refresh uses an atomic conditional claim, revocation, replacement digest, and legacy plaintext migration lookup. JWT middleware verifies signature/expiry and loads an active user.

## Authorization Flow

Resource routes apply authentication and role middleware. Student-owned resources are filtered by authenticated user and individual access checks reject non-owner reads/updates/deletes. Protected ownership and privilege fields are rejected on resource writes.

## AI Flow

Authenticated v1 and legacy AI routes validate strict bounded Zod schemas, then invoke controllers. Controllers pass request IDs to the orchestrator. The orchestrator applies timeout cleanup, Ollama preference, deterministic fallback, response validation, latency, and correlation data.

## Database Flow

Mongoose models define required fields, indexes, references, and timestamps. Live disposable MongoDB verification confirmed Profile ownership isolation and atomic concurrent refresh behavior. Full model-by-model integration coverage is not yet complete.

## Deployment Flow

Dockerfiles exist for Node, FastAPI, and Nginx. Compose defines MongoDB, AI, backend, and frontend services with health dependencies and environment-only secrets. GitHub Actions defines install, tests, audits, Python compilation, build, and Compose validation. Docker runtime and remote CI execution were unavailable during this audit.

## Verified Risks

- No frontend authenticated E2E suite.
- Docker daemon unavailable for image/runtime smoke testing.
- Remote CI execution unavailable.
- Client npm audit retains high/moderate transitive findings whose fixes require breaking upgrades.
- Legacy plaintext token migration remains a compatibility path.
- Full writable-field and authorization coverage across every model is incomplete.
- Dashboard still contains mock presentation data.
- No Python tests exist, although Python syntax compilation passes.
