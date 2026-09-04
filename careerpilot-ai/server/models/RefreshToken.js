const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String },
    tokenHash: { type: String, index: true },
    expires: { type: Date, required: true },
    revoked: { type: Date },
    replacedByTokenHash: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
