const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, trim: true },
    questions: [{ type: String, trim: true }],
    answers: [{ type: String, trim: true }],
    score: { type: Number, min: 0, max: 100 },
    feedback: { type: String, trim: true },
    conductedAt: { type: Date, default: Date.now, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('MockInterview', mockInterviewSchema);
