const mongoose = require('mongoose');

const skillGapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    role: { type: String },
    detectedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    summary: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model('SkillGapReport', skillGapSchema);
