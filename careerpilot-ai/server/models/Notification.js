const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true },
    message: { type: String },
    read: { type: Boolean, default: false },
    meta: { type: Object },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Notification', notificationSchema);
