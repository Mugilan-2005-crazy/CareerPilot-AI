const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, trim: true },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true, index: true },
    experienceLevel: { type: String, enum: ['entry', 'mid', 'senior', 'lead', 'principal'], default: 'mid', index: true },
    requiredSkills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    preferredSkills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    skillWeights: { type: Map, of: Number, default: {} },
    educationExpectations: [{ type: String, trim: true }],
    tools: [{ type: String, trim: true, lowercase: true }],
    certifications: [{ type: String, trim: true }],
    learningPath: [{ type: String, trim: true }],
    relatedCareers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Career' }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

careerSchema.index({ name: 'text', description: 'text' });
careerSchema.index({ domain: 1, experienceLevel: 1 });

module.exports = mongoose.model('Career', careerSchema);
