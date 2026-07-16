const mongoose = require('mongoose');

const codingQuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    prompt: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
    tags: [{ type: String, index: true }],
    languages: [{ type: String }],
    sampleCode: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model('CodingQuestion', codingQuestionSchema);
