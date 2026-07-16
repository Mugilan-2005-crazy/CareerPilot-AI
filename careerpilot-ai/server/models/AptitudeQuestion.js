const mongoose = require('mongoose');

const aptitudeQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    choices: [{ type: String }],
    answer: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
    tags: [{ type: String, index: true }],
  },
  { timestamps: true },
);

module.exports = mongoose.model('AptitudeQuestion', aptitudeQuestionSchema);
