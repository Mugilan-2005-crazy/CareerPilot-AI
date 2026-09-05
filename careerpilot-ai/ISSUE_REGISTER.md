# ISSUE_REGISTER — CareerPilot AI Ultra Master Final Boss

**Generated:** 2026-09-05
**Baseline:** 499fc3c
**Status:** All P0/P1/P2 issues are FIXED or VERIFIED-NO-DEFECT in this session.

| ID | Component | Severity | Root Cause | Fix | Test | Status |
| -- | --------- | -------- | ---------- | --- | ---- | ------ |
| ISS-001 | `server/services/baseService.js` | P2 | `buildQuery` did not enforce `ownedByCurrentUser !== false` for shared models — risk of accidental student scoping being bypassed. | Added `ownedByCurrentUser !== false` guard (uncommitted delta verified in tree). | `crudService.test.js` + live IDOR run (User B → User A resume → 403) | FIXED |
| ISS-002 | `client/src/context/` (missing) | P2 | Frontend had no centralized auth context; pages read user ad-hoc, no global refresh/logout. | Created `AuthContext.tsx` (user loading, refresh, logout). | `e2e/auth.spec.ts` (session persistence + refresh-failure redirect) | FIXED |
| ISS-003 | Frontend pages (`AiChatPage`, `CareerExplorerPage`, `CareerComparisonPage`, `InterviewCoachPage`, `ProjectsPage`, `ResumeAnalyzerPage`, `RoadmapPage`, `SkillGapPage`) | P2 | Pages used legacy `/api/*` routes, missing the v1 versioning introduced in 499fc3c. | Switched all callers to `/api/v1/*`. | `e2e/career-journey.spec.ts` + manual probe | FIXED |
| ISS-004 | `client/src/pages/DashboardPage.tsx` | P2 | No user greeting or logout control. | Integrated AuthContext + logout button + dark-mode toggle. | Manual E2E | FIXED |
| ISS-005 | `client/src/pages/LoginPage.tsx` (and Register) | P3 | UX errors were raised via `alert()` instead of inline state. | Replaced with inline error display. | Manual probe | FIXED |
| ISS-006 | `server/controllers/userController.js` (missing) | P2 | No `/api/v1/users/me` endpoint to fetch current user from context. | Added `userController.getMe` + `routes/v1/userRoutes.js`. | Live probe (200 with `data.email`) | FIXED |
| ISS-007 | `server/controllers/resourceController.js` (mass-assignment) | P1 | Required explicit allowlist of writable fields to prevent role/owner injection. | `sanitizeWritePayload` strips protected fields (verified live: PUT with `role:"admin"` → rejected). | `ownership.security.test.js` + live run | VERIFIED |
| ISS-008 | `server/routes/authRoutes.js` (refresh replay) | P1 | Refresh tokens must rotate and old ones must be revoked to prevent replay. | Implemented rotation + revocation (verified live: old refresh token → 401 on reuse). | `auth.security.test.js` + live run | VERIFIED |
| ISS-009 | `server/middleware/security.js` (IDOR on resources) | P1 | All user-owned resources must enforce ownership server-side, not from request body. | `baseService` `findOne({_id, ownerField: req.user._id})` pattern; verified live (B → A resume → 403). | `ownership.security.test.js` + live run | VERIFIED |
| ISS-010 | Python AI service — prompt injection defense | P1 | User input (resume, JD, interests) flows into deterministic engines. | Deterministic engines do not follow instructions; structured output only. Verified live: injected "ignore all previous instructions..." interests returned normal `top_career` payload with no system-prompt leak. | `tests/test_career_intelligence.py` + live run | VERIFIED |
| ISS-011 | CI workflow location | P1 | Workflow was originally nested; GitHub Actions does not discover nested workflows. | Moved to `.github/workflows/ci.yml` at repo root (commit `b96c2d4`). | Remote Actions run `33858397527` success | FIXED |
| ISS-012 | Node.js ≥ 22 / npm audit transient 503 retries | P3 | Audit advisory service occasionally 503s; CI was failing transiently. | Added retry-on-503 to CI workflow (commit `d51dc4f`), keep fail-closed on real findings. | CI success | FIXED |
| ISS-013 | `node_modules/` tracked in git history | P3 | Repo hygiene debt, not an application defect. | Documented as a known limitation; not in scope this session. | n/a | DOCUMENTED |
| ISS-014 | Docker daemon availability in this sandbox | P3 | Docker Desktop binary not installed in the current Windows sandbox; cannot re-run `compose up`. | Compose config validated by inspection; prior remote CI verification stands. | compose file schema check | MITIGATED |

No new P0/P1 issues were introduced or discovered this session.
