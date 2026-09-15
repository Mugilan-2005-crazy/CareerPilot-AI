const CareerProfile = require('../models/CareerProfile');
const { careerTwinUpdate } = require('../schemas/careerTwinSchema');

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

    return res.json({ success: true, data: twin.toJSON(), requestId: req.requestId });
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

module.exports = {
  getMyTwin,
  updateMyTwin,
  exportMyTwin,
  deleteMyTwin,
  recomputeDerived,
};
