const mongoose = require('mongoose');

const codingQuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
    tags: [{ type: String, trim: true, lowercase: true, index: true }],
    languages: [{ type: String, trim: true }],
    sampleCode: { type: String, trim: true },
    topic: { type: String, trim: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('CodingQuestion', codingQuestionSchema);
