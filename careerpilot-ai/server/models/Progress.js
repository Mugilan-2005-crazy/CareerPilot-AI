const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    module: { type: String },
    completed: { type: Boolean, default: false },
    score: { type: Number },
    details: { type: Object },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Progress', progressSchema);
