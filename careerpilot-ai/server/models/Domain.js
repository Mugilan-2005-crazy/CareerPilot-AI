const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

domainSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Domain', domainSchema);
