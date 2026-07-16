const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    read: { type: Boolean, default: false, index: true },
    meta: { type: Object },
    type: { type: String, enum: ['info', 'alert', 'success', 'warning'], default: 'info', index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Notification', notificationSchema);
