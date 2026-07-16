const mongoose = require('mongoose');

const placementPredictionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    probability: { type: Number, min: 0, max: 1, default: 0 },
    confidence: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    factors: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('PlacementPrediction', placementPredictionSchema);
