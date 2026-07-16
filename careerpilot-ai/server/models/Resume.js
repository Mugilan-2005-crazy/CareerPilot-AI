const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    filename: { type: String, required: true, trim: true, index: true },
    contentType: { type: String, trim: true },
    storageKey: { type: String, trim: true },
    sizeBytes: { type: Number, min: 0 },
    isPrimary: { type: Boolean, default: false, index: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

resumeSchema.index({ user: 1, isPrimary: 1 });

module.exports = mongoose.model('Resume', resumeSchema);
