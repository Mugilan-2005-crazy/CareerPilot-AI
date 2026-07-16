const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    target: { type: Object },
    ip: { type: String, trim: true },
    details: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('AdminLog', adminLogSchema);
