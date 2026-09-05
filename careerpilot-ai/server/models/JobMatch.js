const mongoose = require('mongoose');

const jobMatchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', required: true, index: true },
    matchScore: { type: Number, min: 0, max: 100, default: 0, index: true },
    confidence: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    strengths: [{ type: String, trim: true }],
    skillGaps: [{ type: String, trim: true }],
    recommendedNextSkills: [{ type: String, trim: true }],
    reasoning: { type: String, trim: true },
    alternativeCareers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Career' }],
    source: { type: String, enum: ['heuristic', 'model', 'hybrid'], default: 'heuristic' },
    calculatedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

jobMatchSchema.index({ user: 1, career: 1 }, { unique: true });
jobMatchSchema.index({ user: 1, matchScore: -1 });

module.exports = mongoose.model('JobMatch', jobMatchSchema);
