# CareerPilot AI — Independent Full-Stack Verification & Release Certification

**Date:** 2026-09-23
**Branch:** `main`
**Verified code commit:** `d04de403f358459e76fd4bc77ba912774c460253` (application + tests + CI, run #15 green)
**Deployment change in this round:** `f97dcaf` — `docker-compose.yml`, frontend container healthcheck added
**Certified v1.0.0 baseline (preserved, untouched):** `ea304418e5ed5d08ba5782a75d4803717de56d3c`

All functional gates below were executed against `d04de403`; the only change afterwards is the
Compose healthcheck in `f97dcaf`, after which every Compose-affected gate was re-run (see
"Changes made in this round"). The tip of `main` carries this document, so the tip's own CI run
must show `success` on the tip SHA; commits after `f97dcaf` are documentation-only.

## Scope and method

This round was an *independent* verification of the repository as it actually stands,
not a re-statement of earlier reports. Every number below was produced by executing the
command in the same session on the verification host; nothing is inferred.

Verification host: Windows, Node `v24.14.0`, npm `11.9.0`, Python `3.12.10`,
Docker `29.6.2` (Docker Desktop, Linux containers), Compose `v5.3.1`,
Playwright `1.62.1` (chromium), MongoDB service on `127.0.0.1:27017` plus the
`mongo:7` Compose container.

Repository layout note: the Git root is the parent folder; all tracked content lives
under `careerpilot-ai/`, and the only tracked workflow is the repo-root
`.github/workflows/ci.yml` (GitHub Actions only discovers workflows at the root).

## Verified results

| Gate | Result | Evidence |
|---|---|---|
| Repository integrity | PASS | working tree clean; `git rev-parse HEAD` = `git rev-parse origin/main` = `git ls-remote origin main` = `d04de403…` |
| Backend | PASS 138/138 (18 suites) | `cd server && TEST_MONGO_URI=… npm test -- --detectOpenHandles` — `Tests: 138 passed, 18 passed`, real MongoDB |
| AI (Python) | PASS 65/65 | `cd ai && .venv/Scripts/python -m pytest -q` — `65 passed in 0.59s` |
| Frontend typecheck | PASS | `cd client && npx tsc -b` — exit 0, no diagnostics |
| Frontend build | PASS | `npm run build` — `built in 2.54s`; largest chunks `index 221.01 kB (gzip 74.38)`, `proxy 111.57 kB (gzip 36.68)`; route chunks lazy-loaded at 2–11 kB |
| Dependencies (Node) | PASS | `npm audit --audit-level=high` → `found 0 vulnerabilities` in both `server` and `client` |
| Dependencies (Python) | PASS | `python -m pip check` → `No broken requirements found.` |
| Secret scan | PASS | `node scripts/scan-secrets.js` → `Secret scan clean over 212 files` (38 known test-placeholder matches ignored) |
| Playwright E2E (dev servers) | PASS 12/12 | `npx playwright test` — `12 passed (31.1s)`, `test-results/.last-run.json` `"status": "passed"`, no failures |
| Playwright E2E (container, nginx ingress) | PASS 12/12 | `npx playwright test -c playwright.container.config.ts` against `http://localhost:8090` — `12 passed` (re-run after the healthcheck change) |
| Docker Compose config | PASS | `docker compose config -q` — exit 0 |
| Docker image build | PASS | `docker compose build` — `careerpilot-ai-ai`, `careerpilot-ai-client`, `careerpilot-ai-server` all `Built` |
| Docker runtime + healthchecks | PASS | `docker compose up -d --force-recreate` — startup order mongo+ai healthy → server healthy → client; `docker compose ps` shows **all four services `(healthy)`** |
| Container smoke (v1.0.0 surface) | PASS | `scripts/smoke.ps1` — health 200, register/login, refresh rotation, replay 401, AI `ats_score=68`, IDOR 403 (get+delete), auth rate-limit 429 reached, frontend 200 + `/health` proxy 200 |
| Container smoke (career intelligence) | PASS 39/39 | `scripts/smoke-career-intelligence.ps1 -Base http://localhost:5020` — `SMOKE_RESULT passed=39 failed=0` |
| Restart recovery | PASS 9/9 | `docker compose restart` ×2 then `tmpwheel/restart-recovery.ps1 -Phase post` — same user logs in, twin at same version (v3) with same skills, timeline intact, snapshot-backed progress `ok`, match v2, NBA and export all 200 |
| Data persistence across restart | PASS | Mongo counts across the restart: users `62 → 64`, careerprofiles `10 → 12`, careerevents `40 → 45`, careersnapshots `14 → 15` (existing rows retained, no reset) |
| Dependency-outage resilience | PASS | AI container stopped → `POST /api/v1/ai/resume-analysis` returns **502** `{"message":"AI provider failed to produce valid output","requestId":…}` (no stack, no internals); twin read + NBA still 200 (graceful degradation); AI restarted → endpoint recovers (`ats_score=64`) |
| Security attack pass | PASS 54/54 | `tmpwheel/security-attack.js` → `SECURITY_ATTACK_RESULT passed=54 failed=0` |
| Career Intelligence integrity | PASS 31/31 | `tmpwheel/integrity-probe.js` → `INTEGRITY_RESULT passed=31 failed=0` |
| CI | PASS 6/6 | run **#15**, id `35421708719`, head SHA `d04de403…` → `success`; jobs: Server tests + audit, Client typecheck + build + audit, Python AI tests, Secret scan, Frontend E2E (Playwright), Compose + image build validation — **all `success`** |
| SHA parity | PASS | local HEAD = `origin/main` = CI head SHA = `d04de403f358459e76fd4bc77ba912774c460253` |

## Security verification (adversarial, live, production-mode stack)

Executed against the running Compose stack (`NODE_ENV=production`), 54 checks, 0 bypasses:

- **Authentication (A1–A9)** — missing token 401, wrong scheme 401, empty bearer 401,
  malformed JWT 401, wrong-signing-secret 401, `alg:none` confusion 401, correctly-signed
  **expired** token 401, valid signature for a non-existent user 401, tampered signature 401.
- **Mass assignment / privilege (B1–B5)** — `register` with `role:"admin"`/`isAdmin`/`isActive:false`
  creates no admin; twin payload containing `user`/`role`/`owner`/`admin`/`version`/`derived`/`_id`
  rejected 400; non-admin cannot list users (403/404) nor read another user (403);
  `/api/v1/users/me` returns only the caller.
- **Ownership / IDOR (C1–C7)** — cross-user read/update/delete on a resource → 403;
  a foreign `user` field on create → **400 `Protected fields cannot be modified: user`**;
  an injected `owner` field is ignored (document stays owned by the caller) and grants the
  named user nothing (403); the twin has no id-addressable route at all (404), so it cannot be
  addressed cross-tenant.
- **Input validation (D1–D9)** — wrong types 400; negative bounds 400; over-max array 400;
  malformed ObjectId 400 `Invalid ID format` (no 500, no stack); negative pagination bounded;
  2 MB payload rejected without 5xx; over-length text field 400; NoSQL operator injection on
  login neutralised (400/401, never 200); malformed JSON 400.
- **AI adversarial (E1–E6)** — instruction-override, system-prompt extraction, "ADMIN MODE"
  payloads and template-injection all leave the response contract intact and leak no secret
  material; a hostile JD (XSS + path traversal + `${…}` + injection) returns 200; fabricated
  client-side evidence cannot be used to score an evidence-free twin (400); unexpected AI field
  400 (strict schema); anonymous AI callers 401.
- **Web layer (F1–F7)** — no file contents via traversal; stored `<script>` payload is served as
  inert JSON; CORS does not reflect an arbitrary origin; production 404s carry no stack;
  `requestId` present on errors; helmet CSP + `nosniff` present; `x-powered-by` not disclosed.
- **Session / refresh (G1–G6)** — refresh rotates; replay of the rotated token → 401; the replay
  chain stays invalidated; unknown refresh token 401; logout without a token 400/401.

Log inspection for secret leakage: `docker compose logs server` contains **0** JWT-shaped
tokens, **0** `refreshToken`/`password` literals.

## Career Intelligence integrity (chain, not endpoints)

31 checks, 0 failures. A real state transition was driven and every downstream consumer was
observed to change because of it:

```
empty twin (v1)                      -> NBA: "Build your Career Twin"; match refuses (400)
  + 2 skills, no evidence (v2)       -> evidenceStrength 0; 2 diff events; NBA moves to evidence/goal
  + evidence + target role (v3)      -> evidenceStrength rises; timeline gets
                                        twin_created / skill_added / evidence_added / target_role_changed,
                                        every event tagged with twinVersion
                                     -> progress: status ok, >=2 snapshots, positive evidence growth
                                     -> career match v2: 200, twinVersion 3, >=3 explainable dimensions
                                     -> NBA: advances to "validation" once evidence + role are complete
```
Skill-gap is genuinely evidence-driven: for the same target career, `python` moves from
`gap_severity high / priority P0 / bucket critical` **without** evidence to
`gap_severity none / priority P3 / bucket optional` **with** evidence.
Snapshot retention is enforced (55 writes → snapshots ≤ 50) and the timeline limit stays clamped
to 100 under stress.

## Performance (live stack, 8–12 iterations per endpoint)

| Endpoint | status | avg | p50 | p95 |
|---|---|---|---|---|
| `GET /health` | 200 | 3.1 ms | 3.1 | 3.6 |
| `GET /api/v1/career-twin` | 200 | 8.9 ms | 7.3 | 15.8 |
| `PUT /api/v1/career-twin` (diff + events + snapshot + version) | 200 | 19.8 ms | 17.9 | 30.7 |
| `GET /career-twin/timeline` | 200 | 6.3 ms | 6.0 | 9.3 |
| `GET /career-twin/progress` | 200 | 6.6 ms | 6.4 | 9.1 |
| `GET /career-twin/export` | 200 | 7.0 ms | 7.5 | 8.5 |
| `GET /career-twin/next-best-action` | 200 | 6.7 ms | 6.4 | 8.7 |
| `POST /career-twin/career-match` | 200 | 12.9 ms | 12.2 | 18.8 |
| `POST /ai-career/skill-gap-advanced` | 200 | 10.4 ms | 10.2 | 10.9 |
| `POST /ai/resume-analysis` | 200 | 10.0 ms | 10.0 | 10.7 |

No N+1 or unbounded-query behaviour observed; the write path is the slowest (expected — it
performs diff, event insert, snapshot write and pruning). Rate limiting was independently
confirmed to engage (global 200/15 min, auth 20/15 min, AI 40/15 min were all triggered during
verification and returned the documented 429 bodies).

## Observability

- `X-Request-ID` response header set on every request; `requestId` present in error bodies.
- Production 5xx responses mask internals (`Internal Server Error`) with no stack.
- AI dependency failure produces a **safe, correlatable** 502 and is **visible in the access log**
  as `POST /api/v1/ai/resume-analysis 502`.
- Access logs contain no credentials, tokens or resume content.

## Deployment (Docker)

- `docker compose config -q` valid; three images build from source on every run.
- Ordered startup is driven by real healthchecks: `mongo` + `ai` healthy → `server` healthy →
  `client`. Verified repeatedly (`up -d --force-recreate`, `restart`, `stop/start ai`).
- All four services report `(healthy)` after this round's frontend healthcheck addition.
- Restart recovery verified across two full `docker compose restart` cycles with **no data loss**
  (same user, same twin version, same skills, timeline and snapshot-backed progress intact).
- Dependency recovery verified: `ai` stopped → safe 502 for AI routes, non-AI routes unaffected →
  `ai` started → endpoint recovers.

## Architecture verified as implemented

- Career Digital Twin — one versioned `CareerProfile` per user, unique owner index, evidence
  provenance (`user-provided` / `system-derived` / `ai-inferred` / `externally-verified`),
  server-recomputed `derived.evidenceStrength` never accepted from clients, owner-scoped
  read/update/export/delete plus auto-provision on first read.
- Career events — append-only, typed (`twin_created`, `skill_added`, `skill_removed`,
  `proficiency_changed`, `evidence_added`, `target_role_changed`), each stamped with `twinVersion`,
  indexed `{user, createdAt:-1}`.
- Snapshots — one compact snapshot per accepted update, retention-capped at 50 per user with
  pruning on write, powering baseline-vs-current progress.
- Timeline / Progress — owner-scoped, limit clamped 1–100, `insufficient_evidence` returned
  instead of a fabricated trend when fewer than two snapshots exist.
- Skill gap (advanced) — evidence-aware severity, priority and bucketing plus dependency impact.
- Career Match V2 — explainable dimensions, versioned against the twin, refuses to score an
  evidence-free twin.
- Next-Best-Action — deterministic, evidence-only ranking with ROI/priority classes and an explicit
  "insufficient evidence" path.
- Phase-3 deterministic extensions (resume/JD/path/what-if/interview intelligence) exposed on the
  AI service and through the Node gateway with auth + Zod strictness + AI limiter; deterministic
  fallback provider and Ollama support intact.

## Changes made in this round

Only one product change was required; everything else was verification.

**`careerpilot-ai/docker-compose.yml` — frontend healthcheck added.**
Previously the `client` container was the only service with no healthcheck, so Compose reported it
merely as `Up` and could not distinguish "nginx serving the SPA" from "process alive". A
`wget`-based healthcheck against `/` was added. Two failures were detected and fixed before it was
accepted as green:

1. First attempt used `http://localhost/` and the container reported **unhealthy** while the app
   worked. Root cause: busybox `wget` resolves `localhost` to IPv6 (`::1`) first and nginx in this
   image binds IPv4 only — `wget -q -O /dev/null http://localhost/` → `Connection refused`.
2. Changed to the explicit IPv4 loopback; **all four services now report `(healthy)`** with
   `FailingStreak 0`.

No application source, schema, auth or AI behaviour was modified. All regressions that could be
affected by a Compose change were re-run afterwards (config, build, up, health, both smoke suites,
container Playwright E2E) and passed.

## Known limitations (only what actually remains)

1. **CareerEvent retention is unbounded by design.** The timeline is an append-only audit trail with
   no TTL or cap, so a long-lived user's event count grows monotonically. This is not a defect for
   current volumes but is a real scalability item: a retention/TTL policy or archival job should be
   added before high-write production use.
2. **Access logs are not correlation-tagged.** Responses carry `X-Request-ID` and error bodies carry
   `requestId`, but the `morgan('combined')` access log format does not include it, so correlating a
   logged line to a client-reported request id currently requires the error body. Adding a
   `:request-id` token to the log format is the obvious follow-up.
3. **Cloud LLM providers are not configured.** Gemini/OpenAI/Anthropic integrations remain optional
   and unconfigured; the verified production path is the deterministic provider plus Ollama. No cloud
   credential is required for any verified behaviour.
4. **Design-by-intent, not bugs:** an evidence-free twin returns 400 for Career Match V2 and
   `insufficient_evidence` for Progress with fewer than two snapshots; both are deliberate
   anti-fabrication behaviours and are asserted as correct in the verification harnesses.
5. **`gh` CLI is unauthenticated on this host**, so CI was verified through the public GitHub API
   (run metadata plus per-job status) rather than the CLI.
6. **Single-platform verification.** Docker was verified on Docker Desktop (Linux containers) only;
   no alternate host OS or architecture matrix was exercised.
7. **nginx serves IPv4 only.** The container's `listen 80;` does not bind IPv6, which is why the
   healthcheck targets `127.0.0.1` explicitly. Harmless for the current port mapping but worth
   knowing if IPv6 ingress is ever required.

Correction to an earlier report: the limitation "duplicate inactive nested workflow
`careerpilot-ai/.github/workflows/ci.yml` retained as tracked file" no longer applies —
`git ls-files` shows exactly one tracked workflow (`.github/workflows/ci.yml` at the repo root) and
no `careerpilot-ai/.github` directory exists on disk.

## Release decision

**PRODUCTION READY** — every critical gate was executed and passed with exact SHA parity between
local `HEAD`, `origin/main` and the CI run for that SHA. The single product change in this round
(frontend healthcheck) was re-verified against the full regression set before acceptance.

> Machine-readable summary for CI consumers: `SMOKE_RESULT passed=39 failed=0`,
> `SECURITY_ATTACK_RESULT passed=54 failed=0`, `INTEGRITY_RESULT passed=31 failed=0`,
> backend `138 passed`, AI `65 passed`, Playwright `12 passed`, `npm audit` 0 vulnerabilities.



