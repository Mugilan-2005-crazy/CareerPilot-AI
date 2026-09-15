const mongoose = require('mongoose');

/**
 * CareerEvent (v1.1 Phase 2) — append-only career timeline.
 *
 * Every meaningful career-state transition (skill added, proficiency
 * changed, evidence added, target role changed, twin created) is recorded
 * here so the product can answer "what changed and why". Payloads are small
 * and structured; no secrets, no raw resumes.
 */
const EVENT_TYPES = [
  'twin_created',
  'skill_added',
  'skill_removed',
  'proficiency_changed',
  'evidence_added',
  'target_role_changed',
  'preferences_changed',
];

const careerEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: EVENT_TYPES, required: true },
    twinVersion: { type: Number, min: 1 },
    // Small, structured detail — e.g. { skill: "react", from: "beginner",
    // to: "intermediate" }. Never contains raw documents.
    detail: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

careerEventSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CareerEvent', careerEventSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;
