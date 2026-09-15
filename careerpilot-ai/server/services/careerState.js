const CareerEvent = require('../models/CareerEvent');

/**
 * Career state diffing (v1.1 Phase 2).
 *
 * Compares a twin before/after an accepted update and produces the career
 * events that explain the transition. Pure functions — unit-testable.
 */

function normalizeSkillMap(skills) {
  const map = new Map();
  for (const s of skills || []) {
    if (s && s.name) map.set(String(s.name).toLowerCase(), s);
  }
  return map;
}

/**
 * @param {object} before twin document prior to mutation (may be null)
 * @param {object} after twin document after mutation
 * @returns {Array<{type:string, detail:object}>}
 */
function diffTwin(before, after) {
  const events = [];
  if (!before) {
    events.push({ type: 'twin_created', detail: {} });
  }

  const beforeSkills = normalizeSkillMap(before ? before.skills : []);
  const afterSkills = normalizeSkillMap(after ? after.skills : []);

  for (const [name, skill] of afterSkills) {
    const prev = beforeSkills.get(name);
    if (!prev) {
      events.push({ type: 'skill_added', detail: { skill: name, proficiency: skill.proficiency || 'unknown' } });
      continue;
    }
    const prevEvCount = Array.isArray(prev.evidence) ? prev.evidence.length : 0;
    const nextEvCount = Array.isArray(skill.evidence) ? skill.evidence.length : 0;
    if (nextEvCount > prevEvCount) {
      events.push({ type: 'evidence_added', detail: { skill: name, evidenceCount: nextEvCount } });
    }
    if ((prev.proficiency || 'unknown') !== (skill.proficiency || 'unknown')) {
      events.push({
        type: 'proficiency_changed',
        detail: { skill: name, from: prev.proficiency || 'unknown', to: skill.proficiency || 'unknown' },
      });
    }
  }
  for (const name of beforeSkills.keys()) {
    if (!afterSkills.has(name)) {
      events.push({ type: 'skill_removed', detail: { skill: name } });
    }
  }

  const beforeRoles = (before && before.targetRoles) || [];
  const afterRoles = (after && after.targetRoles) || [];
  const rolesChanged =
    beforeRoles.length !== afterRoles.length ||
    afterRoles.some((r, i) => r !== beforeRoles[i]);
  if (before && rolesChanged) {
    events.push({ type: 'target_role_changed', detail: { targetRoles: afterRoles } });
  }

  return events;
}

/**
 * Persist diff events for a twin update. Returns the created events.
 */
async function recordTwinEvents(user, before, after) {
  const diffs = diffTwin(before, after);
  if (diffs.length === 0) return [];
  return CareerEvent.insertMany(
    diffs.map((d) => ({ user, type: d.type, detail: d.detail, twinVersion: after.version })),
  );
}

module.exports = { diffTwin, recordTwinEvents, normalizeSkillMap };
