const mongoose = require('mongoose');

const careerSkillMappingSchema = new mongoose.Schema(
  {
    career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', required: true, index: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    weight: { type: Number, min: 0, max: 1, default: 0.5 },
    required: { type: Boolean, default: false },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);

careerSkillMappingSchema.index({ career: 1, skill: 1 }, { unique: true });

module.exports = mongoose.model('CareerSkillMapping', careerSkillMappingSchema);
