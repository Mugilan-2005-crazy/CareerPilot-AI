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

## Next-Best-Action

`server/services/nextBestAction.js` — deterministic ranking over the user's
own stored twin, latest `SkillGapReport`, and latest `Roadmap`. Returns at
most 1 primary + 2 secondary + 3 optional actions, each with an
evidence-based `why`. Missing inputs yield `Insufficient evidence`-style
guidance (e.g. "Build your Career Twin"), never invented advice.

## Security posture of new endpoints

- Authentication required on every career-twin route (`authMiddleware`).
- Ownership: all queries scoped to `req.user.id`; cross-user reads/writes
  return the requester's own (possibly empty) twin — verified by test.
- Mass assignment: strict Zod schema rejects `user`, `version`, `derived`,
  `role`, and unknown keys.
- `skill-gap-advanced` reuses the existing AI limiter, request validation,
  and the controller's internal-key output sanitizer.
