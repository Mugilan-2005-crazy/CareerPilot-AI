const mongoose = require('mongoose');

/**
 * CareerSnapshot (v1.1 Phase 2) — compact career-state history.
 *
 * One snapshot per twin update enables before/after progress comparisons
 * ("evidence strength 48 → 79") without storing full twin copies. Capped at
 * SNAPSHOT_RETENTION per user; oldest are pruned on write.
 */
const SNAPSHOT_RETENTION = 50;

const careerSnapshotSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    twinVersion: { type: Number, required: true, min: 1 },
    evidenceStrength: { type: Number, min: 0, max: 100, default: 0 },
    skillCount: { type: Number, min: 0, default: 0 },
    // Compact per-skill summary — name + proficiency only.
    skillsSummary: [{
      name: { type: String, trim: true, maxlength: 100 },
      proficiency: { type: String, maxlength: 20 },
    }],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

careerSnapshotSchema.index({ user: 1, createdAt: -1 });

/**
 * Persist a snapshot and prune beyond the retention cap.
 */
careerSnapshotSchema.statics.record = async function record(user, twin) {
  const doc = await this.create({
    user,
    twinVersion: twin.version,
    evidenceStrength: twin.derived ? twin.derived.evidenceStrength : 0,
    skillCount: Array.isArray(twin.skills) ? twin.skills.length : 0,
    skillsSummary: (twin.skills || []).slice(0, 200).map((s) => ({
      name: s.name,
      proficiency: s.proficiency,
    })),
  });
  const stale = await this.find({ user }).sort({ createdAt: -1 }).skip(SNAPSHOT_RETENTION).select('_id').lean();
  if (stale.length > 0) {
    await this.deleteMany({ _id: { $in: stale.map((s) => s._id) } });
  }
  return doc;
};

module.exports = mongoose.model('CareerSnapshot', careerSnapshotSchema);
module.exports.SNAPSHOT_RETENTION = SNAPSHOT_RETENTION;
