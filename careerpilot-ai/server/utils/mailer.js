const nodemailer = require('nodemailer');
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  SMTP_TIMEOUT_MS,
  SMTP_ENABLED,
} = require('../config/environment');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Boolean(SMTP_SECURE),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });
  return transporter;
}

async function sendMail({ to, subject, html }) {
  if (!SMTP_ENABLED) {
    // Safe, explicit, non-leaky failure: the caller is responsible for
    // surfacing this as a generic user-facing string ("if a user exists, an
    // email will be sent") rather than promising delivery.
    const err = new Error('Mailer not configured');
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }

  const t = getTransporter();
  const info = await t.sendMail({
    from: SMTP_FROM || 'CareerPilot AI <no-reply@example.com>',
    to,
    subject,
    html,
  });

  return { success: true, messageId: info.messageId };
}

module.exports = { sendMail };