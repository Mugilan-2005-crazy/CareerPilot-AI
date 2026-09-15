# CareerPilot AI — Authentication & Authorization Architecture

## Identity Model

Two token types:
1. **Access token** — short-lived JWT (`JWT_SECRET`, `JWT_EXPIRES_IN`, default `7d`). Verified on every protected request by `middleware/auth.js`.
2. **Refresh token** — opaque, rotated on use, **hashed at rest** in the `RefreshToken` collection. Used only by the `/auth/refresh` endpoint.

## Flow

```text
register / login
   -> { accessToken (JWT), refreshToken (opaque) }
protected call
   -> Authorization: Bearer <JWT>
   -> auth middleware: verify JWT, load active user (password excluded)
   -> req.user set; downstream role + ownership checks
refresh
   -> { refreshToken }
   -> rotate atomically; old token invalidated
logout
   -> { refreshToken } -> revoke
```

## Trust Boundaries

- `JWT_SECRET` is **required** in production; compose fails closed if absent.
- Token expiry is enforced by `jsonwebtoken`.
- Deactivated / missing users are rejected (401).

## Authorization

- **Role gates:** resources specify `readRoles` / `writeRoles` (e.g. `student`, `admin`) in the route wiring.
- **Ownership (IDOR) protection:** the resource controller restricts reads/writes to the caller's own records (`ownerField`), and rejects attempts to widen scope via query params or body injection. Verified with cross-user GET/PUT/DELETE tests.
- **Mass-assignment protection:** privilege/ownership fields injected by clients are rejected (400); ownership is server-derived.

## Password Reset

- Forgot-password flow uses **hashed, single-use, expiring** reset tokens.
- Response is generic (does not leak whether an email exists) when SMTP is not configured (`SMTP_NOT_CONFIGURED`), and the reset token is still persisted for back-office delivery.

## Rate Limiting

Global + auth + AI limiters; stress-tested to return 429 under burst while staying stable. See `docs/security/THREAT_MODEL.md`.