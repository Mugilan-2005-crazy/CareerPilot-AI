const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true },
    target: { type: Object },
    ip: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model('AdminLog', adminLogSchema);
