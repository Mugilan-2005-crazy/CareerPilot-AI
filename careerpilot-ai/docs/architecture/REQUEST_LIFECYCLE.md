# CareerPilot AI — Request, Auth, AI, Error Lifecycles

## 1. Standard Request Lifecycle

```text
1. Browser -> Express middleware chain (helmet, cors, requestId, logger, rate limit,
             json body limit 10MB, mongo-sanitize, xss-clean)
2. Route matching (/api/v1/* or /api/*)
3. auth middleware  -> verify Bearer JWT, load active user
4. authorize        -> role gate (read/write roles per resource)
5. validateBody / validateRequest -> Zod schema validation
6. controller/service -> business logic; Mongoose query
7. Ownership filter applied (caller can only touch own resources)
8. JSON response (or notFound / errorHandler)
```

## 2. Authentication Lifecycle (Access + Refresh tokens)

```text
Register/Login
  -> issue access token (JWT, expiry) + opaque refresh token
  -> refresh token hashed at rest (RefreshToken collection)
Protected request
  -> send Bearer access token -> verified per request
Access token expired
  -> client calls /auth/refresh with refresh token
  -> server rotates atomically (old invalidated, new issued)
  -> replay of a used refresh token -> 401
Logout
  -> revoke current refresh token
```

Key guarantees (verified by integration + security tests):
- **Rotation:** each refresh returns a new access+refresh pair and invalidates the old one.
- **Replay prevention:** reusing a rotated token is rejected (401).
- **Concurrent refresh race:** exactly one success among concurrent refreshes.
- **Token at rest:** refresh/reset tokens are stored hashed.

## 3. AI Request Lifecycle

```text
JWT-authenticated AI route
  -> AI orchestrator (services/ai/orchestrator.js)
  -> provider abstraction:
        deterministic  -> Python FastAPI microservice (always available)
        ollama / auto  -> Ollama provider (optional, with structured-JSON parsing)
  -> orchestrator timeout (35 s)
  -> validate response (has success/content/structuredData)
  -> return structured result (or structured error) with requestId + latency
```

Fallback semantics: in `auto`/`ollama` mode the orchestrator tries Ollama first; if the provider fails or returns non-structured output, it falls back to deterministic so the feature still returns.