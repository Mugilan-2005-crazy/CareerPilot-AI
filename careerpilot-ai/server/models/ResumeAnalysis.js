const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    resumeText: { type: String },
    atsScore: { type: Number },
    keywords: [{ type: String }],
    recommendations: [{ type: String }],
  },
  { timestamps: true },
);

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
