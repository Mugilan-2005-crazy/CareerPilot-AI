const mongoose = require('mongoose');

const communicationQuestionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    context: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
    tags: [{ type: String, index: true }],
  },
  { timestamps: true },
);

module.exports = mongoose.model('CommunicationQuestion', communicationQuestionSchema);
