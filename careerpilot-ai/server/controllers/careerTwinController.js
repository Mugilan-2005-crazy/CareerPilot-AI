const CareerProfile = require('../models/CareerProfile');
const CareerEvent = require('../models/CareerEvent');
const CareerSnapshot = require('../models/CareerSnapshot');
const { careerTwinUpdate } = require('../schemas/careerTwinSchema');
const { recordTwinEvents } = require('../services/careerState');
const orchestrator = require('../services/ai/orchestrator');
const { sanitizeOutput } = require('./ai/careerIntelligenceController');

/**
 * Career Digital Twin controller.
 *
 * Security decisions (per the v1.1 engineering rules):
 *  - authentication: enforced by route middleware
 *  - ownership: the twin is ALWAYS scoped to req.user.id; the client can
 *    never create, read, or mutate another user's twin
 *  - mass assignment: `derived`, `version`, `user`, and any unknown fields
 *    are rejected by the strict Zod schema; the server recomputes `derived`
 *  - output: safe JSON only; export endpoint returns a portable copy
 */

const PROFILE_SELECT = '-__v';

async function getMyTwin(req, res, next) {
  try {
    let twin = await CareerProfile.findOne({ user: req.user.id }).select(PROFILE_SELECT).lean();
    if (!twin) {
      // Meaningful empty state: auto-provision a minimal twin on first read.
      twin = await CareerProfile.create({ user: req.user.id });
      try {
        await CareerEvent.create({ user: req.user.id, type: 'twin_created', detail: {}, twinVersion: 1 });
      } catch (err) {
        // Timeline context must never block twin provisioning.
      }
      twin = await CareerProfile.findById(twin._id).select(PROFILE_SELECT).lean();
    }
    return res.json({ success: true, data: twin, requestId: req.requestId });
  } catch (error) {
    return next(error);
  }
}

async function updateMyTwin(req, res, next) {
  try {
    const parsed = careerTwinUpdate.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid career twin payload' },
        requestId: req.requestId,
      });
    }

    const patch = parsed.data;
    const twin = await CareerProfile.findOne({ user: req.user.id });
    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Career twin not found' },
        requestId: req.requestId,
      });
    }

    // Capture pre-mutation state for the career event diff + snapshot.
    const before = twin.toObject();

    if (patch.identity) Object.assign(twin.identity, patch.identity);
    if (patch.skills) twin.skills = patch.skills;
    if (patch.targetRoles) twin.targetRoles = patch.targetRoles;
    if (patch.preferences) {
      const prefs = patch.preferences;
      if (prefs.availableHoursPerWeek !== undefined) twin.preferences.availableHoursPerWeek = prefs.availableHoursPerWeek;
      if (prefs.preferredLanguage !== undefined) twin.preferences.preferredLanguage = prefs.preferredLanguage;
      if (prefs.deadline !== undefined) twin.preferences.deadline = new Date(prefs.deadline);
    }

    twin.incrementVersion();
    recomputeDerived(twin);
    await twin.save();

    // Closed loop: record what changed (timeline) and snapshot the state
    // (before/after progress). Failures here must not fail the update.
    let recordedEvents = 0;
    try {
      const events = await recordTwinEvents(req.user.id, before, twin);
      recordedEvents = events.length;
      await CareerSnapshot.record(req.user.id, twin);
    } catch (err) {
      // Timeline/snapshot is eventually-consistent context, not a gate.
    }

    return res.json({
      success: true,
      data: twin.toJSON(),
      meta: { eventsRecorded: recordedEvents },
      requestId: req.requestId,
    });
  } catch (error) {
    return next(error);
  }
}

async function exportMyTwin(req, res, next) {
  try {
    const twin = await CareerProfile.findOne({ user: req.user.id }).select(PROFILE_SELECT).lean();
    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Career twin not found' },
        requestId: req.requestId,
      });
    }
    return res.json({
      success: true,
      data: new CareerProfile(twin).toExport(),
      requestId: req.requestId,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteMyTwin(req, res, next) {
  try {
    const result = await CareerProfile.deleteOne({ user: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Career twin not found' },
        requestId: req.requestId,
      });
    }
    return res.json({ success: true, data: { deleted: true }, requestId: req.requestId });
  } catch (error) {
    return next(error);
  }
}

/**
 * Recompute evidence strength (0-100) from stored evidence only.
 * Transparent rule: each skill contributes (max evidence weight, capped at
 * 0.9) weighted by its confidence, averaged over skills. A twin with no
 * skills scores 0 — we never pretend evidence exists.
 */
function recomputeDerived(twin) {
  const skills = Array.isArray(twin.skills) ? twin.skills : [];
  if (skills.length === 0) {
    twin.derived.evidenceStrength = 0;
    twin.derived.lastRecomputedAt = new Date();
    return 0;
  }
  const PROVENANCE_WEIGHT = {
    'externally-verified': 1.0,
    'system-derived': 0.8,
    'user-provided': 0.6,
    'ai-inferred': 0.4,
  };
  const total = skills.reduce((sum, s) => {
    const best = (s.evidence || []).reduce(
      (m, e) => Math.max(m, (PROVENANCE_WEIGHT[e.source] ?? 0.5) * (e.weight ?? 0.5)),
      0,
    );
    return sum + best * (s.confidence ?? 0.3);
  }, 0);
  twin.derived.evidenceStrength = Math.round((total / skills.length) * 100);
  twin.derived.lastRecomputedAt = new Date();
  return twin.derived.evidenceStrength;
}

/**
 * GET /career-twin/timeline — paginated career event stream.
 * Bounded: limit is clamped to 1..100 (default 20).
 */
async function getMyTimeline(req, res, next) {
  try {
    let limit = parseInt(req.query.limit, 10);
    if (!Number.isFinite(limit)) limit = 20;
    limit = Math.max(1, Math.min(limit, 100));
    const events = await CareerEvent.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-__v')
      .lean();
    return res.json({
      success: true,
      data: { events, count: events.length },
      requestId: req.requestId,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /career-twin/progress — before/after comparison from snapshots.
 * Compares the earliest and latest recorded snapshots. With fewer than two
 * snapshots the answer is "insufficient evidence", never a fabricated trend.
 */
async function getMyProgress(req, res, next) {
  try {
    const [first, latest, total] = await Promise.all([
      CareerSnapshot.findOne({ user: req.user.id }).sort({ createdAt: 1 }).lean(),
      CareerSnapshot.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
      CareerSnapshot.countDocuments({ user: req.user.id }),
    ]);

    if (!first || !latest || total < 2) {
      return res.json({
        success: true,
        data: { status: 'insufficient_evidence', snapshots: total },
        requestId: req.requestId,
      });
    }

    return res.json({
      success: true,
      data: {
        status: 'ok',
        snapshots: total,
        baseline: {
          twinVersion: first.twinVersion,
          evidenceStrength: first.evidenceStrength,
          skillCount: first.skillCount,
          capturedAt: first.createdAt,
        },
        current: {
          twinVersion: latest.twinVersion,
          evidenceStrength: latest.evidenceStrength,
          skillCount: latest.skillCount,
          capturedAt: latest.createdAt,
        },
        change: {
          evidenceStrength: latest.evidenceStrength - first.evidenceStrength,
          skillCount: latest.skillCount - first.skillCount,
        },
      },
      requestId: req.requestId,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /career-twin/career-match — twin-driven Career Match V2.
 *
 * The payload is built SERVER-SIDE from the user's own twin (never trusted
 * from the client), then passed through the orchestrator to the
 * deterministic match engine. No twin → meaningful empty state.
 */
async function getMyCareerMatch(req, res, next) {
  try {
    const targetRole = (req.body && req.body.targetRole) || null;
    const twin = await CareerProfile.findOne({ user: req.user.id }).lean();
    if (!twin || !Array.isArray(twin.skills) || twin.skills.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_EVIDENCE',
          message: 'Add skills with evidence to your career twin before requesting a career match.',
        },
        requestId: req.requestId,
      });
    }

    const resolvedTarget = targetRole || (twin.targetRoles && twin.targetRoles[0]) || null;
    if (!resolvedTarget) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_TARGET_ROLE',
          message: 'Set a target role on your career twin (or pass targetRole) first.',
        },
        requestId: req.requestId,
      });
    }

    const payload = {
      target_career: resolvedTarget,
      current_skills: twin.skills.map((s) => s.name),
      skill_evidence: twin.skills.map((s) => ({
        skill: s.name,
        proficiency: s.proficiency || 'unknown',
        evidence_count: Array.isArray(s.evidence) ? s.evidence.length : 0,
      })),
    };

    const aiResp = await orchestrator.handle('career-match-v2', payload, req.requestId);
    if (aiResp && aiResp.content) {
      const safe = sanitizeOutput(aiResp.content);
      if (safe) {
        return res.json({
          success: true,
          data: { ...safe, twinVersion: twin.version },
          requestId: req.requestId,
        });
      }
    }
    return res.status(502).json({
      success: false,
      error: { code: 'AI_UNAVAILABLE', message: 'Career match could not be computed right now. Please try again later.' },
      requestId: req.requestId,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMyTwin,
  updateMyTwin,
  exportMyTwin,
  deleteMyTwin,
  recomputeDerived,
  getMyTimeline,
  getMyProgress,
  getMyCareerMatch,
};
