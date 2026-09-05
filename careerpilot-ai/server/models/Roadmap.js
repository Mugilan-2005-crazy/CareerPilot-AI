const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    durationMonths: { type: Number, min: 1, max: 60, default: 6 },
    availableHoursPerWeek: { type: Number, min: 1, max: 80, default: 10 },
    learningPreference: { type: String, enum: ['visual', 'auditory', 'kinesthetic', 'reading', 'mixed'], default: 'mixed' },
    targetDeadline: { type: Date },
    status: { type: String, enum: ['active', 'paused', 'completed', 'archived'], default: 'active', index: true },
    completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
    milestones: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
        estimatedWeeks: { type: Number, min: 1, default: 2 },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        order: { type: Number, min: 0, default: 0 },
      },
    ],
  },
  { timestamps: true },
);

roadmapSchema.index({ user: 1, career: 1, status: 1 });

module.exports = mongoose.model('Roadmap', roadmapSchema);
