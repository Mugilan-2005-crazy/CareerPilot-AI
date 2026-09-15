# Career Intelligence Architecture (v1.1)

> Reflects **implemented** v1.1 P0 work only. Planned-but-unbuilt phases live
> in `V1_1_TRANSFORMATION_PLAN.md` and are never described as complete here.

## Data flow

```
Client (React, lazy routes)
   │  Bearer JWT
   ▼
Node API gateway (/api and /api/v1)
   ├── /career-twin            → CareerProfile (MongoDB, owner-scoped)
   │     ├── GET (auto-provision empty twin)
   │     ├── PUT (Zod strict, version++, derived recomputed server-side)
   │     ├── GET /export       (data portability)
   │     ├── DELETE            (deletion-safe)
   │     └── GET /next-best-action (deterministic engine)
   ├── /ai-career/skill-gap-advanced → orchestrator → AI service
   └── /ai-career/* (existing tasks preserved unchanged)
   ▼
Orchestrator (Ollama optional → deterministic FastAPI fallback, 35s cap)
   ▼
AI microservice /api/ai/skill-gap-advanced
   └── analyze_skill_gap_advanced (heuristic, skill-graph-driven)
```

## Career Digital Twin

`server/models/CareerProfile.js` — one per user (unique index), `version`
increments on every accepted update. Skills carry `proficiency`,
`confidence`, and `evidence[]` with provenance: `user-provided`,
`system-derived`, `ai-inferred`, `externally-verified`. `derived`
(evidence strength 0-100) is computed only by the server from stored
evidence and is rejected from client input. No fabricated attributes: a
claimed skill without evidence is stored with low confidence, never guessed.

## Career Timeline + Snapshots (Phase 2 — IMPLEMENTED)

`server/models/CareerEvent.js` — append-only timeline of career-state
transitions (`twin_created`, `skill_added`/`removed`, `proficiency_changed`,
`evidence_added`, `target_role_changed`), produced by diffing the twin
before/after each update (`server/services/careerState.js`). Exposed at
`GET /career-twin/timeline` (paginated, owner-scoped, limit clamped 1-100).

`server/models/CareerSnapshot.js` — compact per-update state snapshots
(version, evidence strength, skill count, skill summaries) capped at 50 per
user, powering `GET /career-twin/progress` (before/after comparison). With
fewer than two snapshots the endpoint answers `insufficient_evidence`
rather than fabricating a trend.

## Advanced Skill Gap

`ai/app/services/career_intelligence.py :: analyze_skill_gap_advanced` —
per target-career skill: required proficiency (required→advanced,
preferred→intermediate), estimated current level (from optional evidence
input; `unknown` when absent), evidence strength, confidence, gap severity,
dependency impact via the existing skill graph (`get_dependents`), and an
explainable `reason` + `improvement_path`. Priority buckets: `critical`
(P0), `high_impact` (P1), `supporting` (P2), `optional` (P3). The readiness
number is labelled a heuristic estimate — never a hiring or market
prediction. Unknown target careers return `known_target: false`.

## Career Match V2 (Phase 2 — IMPLEMENTED)

`ai/app/services/career_intelligence.py :: match_career_v2` —
deterministic, explainable alignment between the twin and a target career:
`skillMatch` (proficiency-weighted coverage), `evidenceMatch` (evidence-
backed share of claims), `experienceMatch` / `projectMatch` (only from
supplied data; otherwise `Insufficient evidence`, never guessed). Weighted
`overall_alignment` uses only evidenced dimensions; every dimension carries
a reason; output is labelled "estimated alignment … not an employment
prediction".

Two surfaces:
- `POST /api/ai-career/career-match-v2` — direct, client-supplied payload
  (Zod-validated), consistent with the other AI career tasks.
- `POST /api/v1/career-twin/career-match` — **closed-loop surface**: the
  payload is built server-side from the user's twin (client cannot inject
  profile data); returns `INSUFFICIENT_EVIDENCE` / `NO_TARGET_ROLE` empty
  states; tags the result with the twin version that produced it.

## Next-Best-Action

`server/services/nextBestAction.js` — deterministic ranking over the user's
own stored twin, latest `SkillGapReport`, and latest `Roadmap`. Returns at
most 1 primary + 2 secondary + 3 optional actions, each with an
evidence-based `why` and an explicit `roi` classification (HIGH/MEDIUM/LOW
from effort-vs-impact); ranking is priority-first, ROI-tiebroken. Missing
inputs yield `Insufficient evidence`-style guidance (e.g. "Build your
Career Twin"), never invented advice.

## Frontend (Phase 2 — IMPLEMENTED)

`DashboardPage.tsx` renders the intelligence loop surface: a Next-Best-Action
card (primary action with why/expected outcome/effort, priority + ROI chips,
evidence strength, before/after progress line, secondary actions). All
career-intelligence fetches are non-fatal — the dashboard degrades
gracefully to its previous behaviour if the twin endpoints are unavailable.

## Security posture of new endpoints

- Authentication required on every career-twin route (`authMiddleware`).
- Ownership: all queries scoped to `req.user.id`; cross-user reads/writes
  return the requester's own (possibly empty) twin — verified by test.
- Mass assignment: strict Zod schema rejects `user`, `version`, `derived`,
  `role`, and unknown keys.
- `skill-gap-advanced` reuses the existing AI limiter, request validation,
  and the controller's internal-key output sanitizer.
