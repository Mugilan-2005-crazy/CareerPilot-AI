const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', index: true },
    atsScore: { type: Number, min: 0, max: 100, default: 0 },
    keywords: [{ type: String, trim: true }],
    strengths: [{ type: String, trim: true }],
    weaknesses: [{ type: String, trim: true }],
    recommendations: [{ type: String, trim: true }],
    summary: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
