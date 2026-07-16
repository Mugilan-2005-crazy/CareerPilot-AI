const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    fullName: { type: String, trim: true, required: true },
    headline: { type: String, trim: true },
    summary: { type: String, default: '' },
    location: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    skills: [{ type: String, trim: true, lowercase: true, index: true }],
    education: [
      {
        institution: { type: String, required: true, trim: true },
        degree: { type: String, required: true, trim: true },
        field: { type: String, trim: true },
        startYear: { type: Number, min: 1900, max: 2100 },
        endYear: { type: Number, min: 1900, max: 2100 },
      },
    ],
    experience: [
      {
        company: { type: String, required: true, trim: true },
        role: { type: String, required: true, trim: true },
        startDate: { type: Date },
        endDate: { type: Date },
        responsibilities: [{ type: String, trim: true }],
      },
    ],
    achievements: [{ type: String, trim: true }],
    certifications: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

profileSchema.index({ skills: 1, headline: 1 });

module.exports = mongoose.model('StudentProfile', profileSchema);
