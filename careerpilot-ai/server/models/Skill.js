const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, trim: true },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', index: true },
    parentSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', index: true },
    difficulty: { type: String, enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'], default: 'intermediate', index: true },
    estimatedEffortHours: { type: Number, min: 0, default: 10 },
    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    relatedSkills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    tools: [{ type: String, trim: true, lowercase: true }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

skillSchema.index({ name: 'text', description: 'text' });
skillSchema.index({ domain: 1, difficulty: 1 });

module.exports = mongoose.model('Skill', skillSchema);
