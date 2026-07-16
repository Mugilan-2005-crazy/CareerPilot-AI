const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    module: { type: String, required: true, trim: true, index: true },
    completed: { type: Boolean, default: false, index: true },
    score: { type: Number, min: 0, max: 100 },
    details: { type: Object },
    milestone: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Progress', progressSchema);
