const mongoose = require('mongoose');

const roadmapProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true, index: true },
    milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'ObjectId' },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', index: true },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed', 'skipped'], default: 'not_started', index: true },
    score: { type: Number, min: 0, max: 100 },
    assessmentId: { type: mongoose.Schema.Types.ObjectId },
    completedAt: { type: Date },
    details: { type: Object },
  },
  { timestamps: true },
);

roadmapProgressSchema.index({ user: 1, roadmap: 1, skill: 1 });
roadmapProgressSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('RoadmapProgress', roadmapProgressSchema);
