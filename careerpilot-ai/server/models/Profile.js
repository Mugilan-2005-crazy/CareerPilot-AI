const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    summary: { type: String, default: '' },
    skills: [{ type: String, index: true }],
    education: [
      {
        institution: String,
        degree: String,
        startYear: Number,
        endYear: Number,
      },
    ],
    experience: [
      {
        company: String,
        role: String,
        start: Date,
        end: Date,
        responsibilities: [String],
      },
    ],
  },
  { timestamps: true },
);

profileSchema.index({ skills: 1 });

module.exports = mongoose.model('Profile', profileSchema);
