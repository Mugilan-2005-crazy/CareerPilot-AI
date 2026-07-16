const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String },
    questions: [{ type: String }],
    answers: [{ type: String }],
    score: { type: Number, min: 0, max: 100 },
    feedback: { type: String },
    conductedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model('MockInterview', mockInterviewSchema);
