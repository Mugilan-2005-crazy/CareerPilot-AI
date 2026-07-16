const mongoose = require('mongoose');

const communicationQuestionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true, trim: true },
    context: { type: String, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
    tags: [{ type: String, trim: true, lowercase: true, index: true }],
    topic: { type: String, trim: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('CommunicationQuestion', communicationQuestionSchema);
