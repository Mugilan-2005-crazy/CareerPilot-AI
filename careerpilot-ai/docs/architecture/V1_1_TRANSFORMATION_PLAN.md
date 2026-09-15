# V1.1 Transformation Plan — Career Intelligence Operating System

> Status: **IN PROGRESS** (phased). Baseline: certified v1.0.0 release
> `ea304418e5ed5d08ba5782a75d4803717de56d3c` (100/100 verified).
> This document is updated as work lands. Nothing here is claimed complete
> unless it is implemented, tested, and verified in this repository.

## 1. Non-goals / invariants

- The certified v1.0.0 baseline must never regress: 103 backend tests,
  43 AI tests, 12 Playwright E2E tests, TypeScript build, Docker stack.
- No fabricated intelligence: no invented salaries, hiring probabilities,
  market demand, or user achievements. `Unknown` / `Insufficient evidence`
  is preferred over fabrication.
- Provider-agnostic AI: deterministic service remains the guaranteed
  fallback; Ollama optional; no external LLM is mandatory.
- All AI output is untrusted until schema-validated. User-supplied content
  (resume, JD, answers) is treated as untrusted input (prompt-injection
  boundary is preserved at the orchestrator/controller layer).

## 2. Current-state map (verified on baseline)

| Capability | Status at v1.0.0 | v1.1 target |
|---|---|---|
| Skill graph | Tree graph with prerequisites/dependents/learning order (Python service) | Extend with proficiency, evidence, dependency-impact gap analysis |
| Career matching | Heuristic career matching (Python service) | Explainable multi-dimension match (later phase) |
| Skill gap | Flat present/missing list | Advanced gaps: required vs current proficiency, evidence strength, confidence, severity, priority |
| Roadmap | Milestone generation from career learning path | Adaptive recalculation from twin state (later phase) |
| Career twin | Absent | **Versioned, evidence-provenanced CareerProfile (P0, this phase)** |
| Next-best-action | Absent | **Deterministic 1 primary / 2 secondary / 3 optional engine (P0, this phase)** |

## 3. Phased plan

### Phase 1 (P0) — Career intelligence foundation — THIS PHASE
1. **Career Digital Twin** (`CareerProfile`): versioned, per-user,
   evidence-provenanced model (`user-provided` / `system-derived` /
   `ai-inferred` / `externally-verified`), owned API with mass-assignment
   protection, export endpoint (data portability), delete endpoint
   (deletion-safe design).
2. **Advanced Skill Gap** (`skill-gap-advanced`): required vs estimated
   current proficiency, evidence strength, confidence, gap severity,
   dependency impact (via the existing skill graph), explainable priority
   buckets (critical / high-impact / supporting / optional).
3. **Next-Best-Action engine**: deterministic, explainable ranking of
   1 primary + up to 2 secondary + up to 3 optional actions derived from
   the user's twin, latest stored skill-gap report, and roadmap state.
   Returns `insufficient evidence` states instead of guessing.

### Phase 2 (P1) — planned
- Career Match Engine (multi-dimensional, explainable)
- Adaptive roadmap recalculation from twin deltas
- Project Intelligence tied to gap priorities
- Resume ↔ JD optimization plan (reorder/clarify only — never invent facts)

### Phase 3 (P2) — planned
- Career timeline / event stream (`CareerEvent`)
- Progress analytics (before/after from stored evidence only)
- Multilingual career intelligence (en/ta/tanglish/hi) with technical-term
  preservation
- What-if simulation engine (explicitly labelled projections)

## 4. Engineering rules for every new endpoint

Authentication decision, authorization decision, ownership decision,
Zod input validation, output sanitization, rate-limit consideration,
tests (security + behaviour), observability (request ID), documentation.

## 5. Verification gates

Each phase lands only with: full backend suite green (≥103 baseline),
Python AI suite green (≥43 baseline), `tsc -b --noEmit` + production
frontend build clean, secret scan clean, npm audit clean, pip check pass.
Docker verification runs at release-candidate time; if unavailable the
release status is `BLOCKED_BY_ENVIRONMENT`, never silently certified.
