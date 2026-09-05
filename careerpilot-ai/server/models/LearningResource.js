const mongoose = require('mongoose');

const learningResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ['course', 'book', 'video', 'article', 'practice', 'certification'], default: 'course', index: true },
    url: { type: String, trim: true },
    provider: { type: String, trim: true },
    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    relatedCareers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Career' }],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
    estimatedHours: { type: Number, min: 0, default: 5 },
    isFree: { type: Boolean, default: false },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

learningResourceSchema.index({ title: 'text', description: 'text' });
learningResourceSchema.index({ type: 1, difficulty: 1 });

module.exports = mongoose.model('LearningResource', learningResourceSchema);
