const mongoose = require('mongoose');

const placementPredictionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    probability: { type: Number },
    confidence: { type: String },
    factors: [{ type: String }],
  },
  { timestamps: true },
);

module.exports = mongoose.model('PlacementPrediction', placementPredictionSchema);
