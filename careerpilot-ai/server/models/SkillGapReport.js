const mongoose = require('mongoose');

const skillGapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, trim: true },
    detectedSkills: [{ type: String, trim: true }],
    missingSkills: [{ type: String, trim: true }],
    summary: { type: String, trim: true },
    targetCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    recommendedResources: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

module.exports = mongoose.model('SkillGapReport', skillGapSchema);
