const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, trim: true },
    headquarters: { type: String, trim: true },
    industry: { type: String, trim: true, index: true },
    website: { type: String, trim: true },
    tags: [{ type: String, trim: true, lowercase: true, index: true }],
    size: { type: String, enum: ['startup', 'mid', 'large'], default: 'mid' },
    locations: [{ type: String, trim: true }],
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

companySchema.index({ name: 'text', industry: 'text', description: 'text' });

module.exports = mongoose.model('Company', companySchema);
