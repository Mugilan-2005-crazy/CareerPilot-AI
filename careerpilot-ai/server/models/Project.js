const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    problem: { type: String, trim: true },
    technologies: [{ type: String, trim: true, lowercase: true }],
    skillsCovered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate', index: true },
    expectedOutcome: { type: String, trim: true },
    architecture: { type: String, trim: true },
    milestones: [{ type: String, trim: true }],
    resumeBulletSuggestions: [{ type: String, trim: true }],
    relatedCareers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Career' }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ difficulty: 1, isActive: 1 });

module.exports = mongoose.model('Project', projectSchema);
