const CareerProfile = require('../models/CareerProfile');
const SkillGapReport = require('../models/SkillGapReport');
const Roadmap = require('../models/Roadmap');

/**
 * Next-Best-Action engine (v1.1 P0).
 *
 * Deterministic, explainable ranking that answers: "What should I do next?"
 *
 * Inputs are the user's OWN stored data: their career twin, their latest
 * skill-gap report, and their roadmap progress. When evidence is missing the
 * engine says so ("Insufficient evidence") instead of fabricating advice.
 *
 * Output contract: 1 primary action, up to 2 secondary, up to 3 optional.
 * Every action carries: title, why (evidence-based reason), expectedOutcome,
 * effort, priority class.
 */

const PROFICIENCY_ORDER = ['unknown', 'beginner', 'intermediate', 'advanced', 'expert'];

function computeNextBestActions({ twin, skillGapReport, roadmap }) {
  const actions = { primary: null, secondary: [], optional: [], context: {} };

  const skills = (twin && Array.isArray(twin.skills)) ? twin.skills : [];
  const targetRoles = (twin && Array.isArray(twin.targetRoles)) ? twin.targetRoles : [];
  actions.context = {
    twinVersion: twin ? twin.version : null,
    targetRole: targetRoles[0] || null,
    evidenceStrength: twin && twin.derived ? twin.derived.evidenceStrength : null,
    skillCount: skills.length,
    hasSkillGapReport: !!skillGapReport,
    hasRoadmap: !!roadmap,
  };

  const candidates = [];

  // 1. No twin yet -> onboarding is the primary action.
  if (!twin || skills.length === 0) {
    return {
      ...actions,
      primary: {
        title: 'Build your Career Twin',
        why: 'No skill evidence is stored yet. Career intelligence cannot be computed without it.',
        expectedOutcome: 'Personalized skill gaps, career matches, and a next-best-action loop.',
        effort: '10-20 minutes',
        priority: 'P0',
        roi: 'HIGH',
        kind: 'evidence',
      },
      secondary: [],
      optional: [],
    };
  }

  // 2. Weak evidence on stored skills -> strengthen evidence first.
  const weakEvidenceSkills = skills.filter(
    (s) => !Array.isArray(s.evidence) || s.evidence.length === 0 || s.proficiency === 'unknown',
  );
  if (weakEvidenceSkills.length > 0) {
    candidates.push({
      title: `Add evidence for ${weakEvidenceSkills.length} skill${weakEvidenceSkills.length > 1 ? 's' : ''}`,
      why: `${weakEvidenceSkills.slice(0, 3).map((s) => s.name).join(', ')} are claimed but have no supporting evidence, so confidence in them is low.`,
      expectedOutcome: 'Higher-confidence skill profile and more reliable career matches.',
      effort: '5 minutes per skill',
      priority: 'P1',
      roi: 'HIGH',
      kind: 'evidence',
    });
  }

  // 3. Stored skill-gap report with missing skills -> close the top gap.
  const missing = skillGapReport && Array.isArray(skillGapReport.missingSkills)
    ? skillGapReport.missingSkills.filter(Boolean)
    : [];
  if (missing.length > 0) {
    candidates.push({
      title: `Close the "${missing[0]}" skill gap`,
      why: `Your latest skill-gap analysis${skillGapReport.role ? ` for ${skillGapReport.role}` : ''} lists ${missing.length} missing skill${missing.length > 1 ? 's' : ''}, starting with ${missing[0]}.`,
      expectedOutcome: `Reduces the highest-priority gap blocking ${skillGapReport.role || targetRoles[0] || 'your target role'}.`,
      effort: 'Depends on the skill — schedule it on your roadmap',
      priority: 'P0',
      roi: 'HIGH',
      kind: 'skill-gap',
    });
  }

  // 4. Roadmap with incomplete milestones -> resume the next milestone.
  const pendingMilestone = roadmap && Array.isArray(roadmap.milestones)
    ? roadmap.milestones.find((m) => !m.completed)
    : null;
  if (pendingMilestone) {
    candidates.push({
      title: `Continue roadmap milestone: ${pendingMilestone.title || 'next step'}`,
      why: `Your active roadmap has an unfinished milestone (step ${pendingMilestone.order || '?'} of ${roadmap.milestones.length}).`,
      expectedOutcome: 'Roadmap progress and refreshed readiness signals.',
      effort: 'Per your plan',
      priority: 'P1',
      roi: 'MEDIUM',
      kind: 'roadmap',
    });
  }

  // 5. No target role set -> decision gap.
  if (targetRoles.length === 0) {
    candidates.push({
      title: 'Set a target role',
      why: 'Without a target role, skill gaps cannot be prioritized against a concrete destination.',
      expectedOutcome: 'Gap analysis and roadmap generation become possible.',
      effort: '5 minutes',
      priority: 'P1',
      roi: 'HIGH',
      kind: 'goal',
    });
  }

  // 6. All evidence is healthy -> validate with an assessment/interview.
  if (candidates.length === 0) {
    candidates.push({
      title: 'Validate your strongest skills with an assessment',
      why: 'Your stored evidence is consistent, but interview readiness should be validated against real questions.',
      expectedOutcome: 'Measured readiness signal and updated twin confidence.',
      effort: '20-40 minutes',
      priority: 'P2',
      roi: 'MEDIUM',
      kind: 'validation',
    });
  }

  const order = { P0: 0, P1: 1, P2: 2 };
  const roiOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  candidates.sort(
    (a, b) =>
      (order[a.priority] ?? 3) - (order[b.priority] ?? 3) ||
      (roiOrder[a.roi] ?? 3) - (roiOrder[b.roi] ?? 3),
  );
  actions.primary = candidates[0] || null;
  actions.secondary = candidates.slice(1, 3);
  actions.optional = candidates.slice(3, 6);
  return actions;
}

async function getMyNextBestAction(req, res, next) {
  try {
    const [twin, skillGapReport, roadmap] = await Promise.all([
      CareerProfile.findOne({ user: req.user.id }).lean(),
      SkillGapReport.findOne({ user: req.user.id }).sort({ updatedAt: -1 }).lean(),
      Roadmap.findOne({ user: req.user.id }).sort({ updatedAt: -1 }).lean(),
    ]);

    const result = computeNextBestActions({ twin, skillGapReport, roadmap });
    return res.json({ success: true, data: result, requestId: req.requestId });
  } catch (error) {
    return next(error);
  }
}

module.exports = { computeNextBestActions, getMyNextBestAction, PROFICIENCY_ORDER };
