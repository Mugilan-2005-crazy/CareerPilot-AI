const mongoose = require('mongoose');

/**
 * Career Digital Twin (v1.1 P0).
 *
 * A persistent, versioned, evidence-provenanced model of the candidate.
 * Rules:
 *  - One twin per user (unique index on `user`).
 *  - Every skill carries an evidence provenance so no attribute is silently
 *    invented: `user-provided`, `system-derived`, `ai-inferred`, or
 *    `externally-verified`.
 *  - `version` increments on every successful update so downstream engines
 *    (skill gaps, roadmaps, next-best-action) can explain which twin state
 *    produced a result.
 *  - The document never stores credentials, tokens, or secrets.
 */
const PROFICIENCY_LEVELS = ['unknown', 'beginner', 'intermediate', 'advanced', 'expert'];
const PROVENANCE_LEVELS = ['user-provided', 'system-derived', 'ai-inferred', 'externally-verified'];

const evidenceSchema = new mongoose.Schema(
  {
    source: { type: String, enum: PROVENANCE_LEVELS, required: true },
    // Free-form pointer to where the evidence came from, e.g.
    // "resume:senior-dev-role", "github:repo-url", "assessment:react-basics".
    // Capped to keep documents bounded; never used to store raw private data.
    ref: { type: String, trim: true, maxlength: 300 },
    weight: { type: Number, min: 0, max: 1, default: 0.5 },
    capturedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const skillStateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true, maxlength: 100 },
    proficiency: { type: String, enum: PROFICIENCY_LEVELS, default: 'unknown' },
    confidence: { type: Number, min: 0, max: 1, default: 0.3 },
    evidence: { type: [evidenceSchema], default: [] },
  },
  { _id: false },
);

const careerTwinSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    version: { type: Number, default: 1, min: 1 },
    identity: {
      fullName: { type: String, trim: true, maxlength: 120 },
      headline: { type: String, trim: true, maxlength: 160 },
      currentLevel: {
        type: String,
        enum: ['student', 'fresher', 'junior', 'mid', 'senior', 'career-transition'],
        default: 'student',
      },
    },
    skills: { type: [skillStateSchema], default: [] },
    targetRoles: [{ type: String, trim: true, maxlength: 120 }],
    preferences: {
      availableHoursPerWeek: { type: Number, min: 0, max: 80, default: 10 },
      preferredLanguage: { type: String, enum: ['en', 'ta', 'tanglish', 'hi'], default: 'en' },
      deadline: { type: Date },
    },
    derived: {
      // Recomputed by server-side engines from stored evidence only. Never
      // accepted from client input (mass-assignment protection).
      evidenceStrength: { type: Number, min: 0, max: 100, default: 0 },
      lastRecomputedAt: { type: Date },
    },
  },
  { timestamps: true },
);

careerTwinSchema.index({ 'skills.name': 1 });

careerTwinSchema.methods.incrementVersion = function incrementVersion() {
  this.version = (this.version || 1) + 1;
  return this.version;
};

careerTwinSchema.methods.toExport = function toExport() {
  return {
    exportedAt: new Date().toISOString(),
    version: this.version,
    identity: this.identity,
    skills: this.skills,
    targetRoles: this.targetRoles,
    preferences: this.preferences,
    derived: this.derived,
  };
};

module.exports = mongoose.model('CareerProfile', careerTwinSchema);
module.exports.PROFICIENCY_LEVELS = PROFICIENCY_LEVELS;
module.exports.PROVENANCE_LEVELS = PROVENANCE_LEVELS;
