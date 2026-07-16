const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    headquarters: { type: String },
    industry: { type: String, index: true },
    website: { type: String },
    tags: [{ type: String, index: true }],
  },
  { timestamps: true },
);

module.exports = mongoose.model('Company', companySchema);
