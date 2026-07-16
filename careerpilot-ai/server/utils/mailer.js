const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = require('../config/environment');

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

async function sendMail({ to, subject, html }) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return { success: false, message: 'Mailer not configured' };
  }

  const info = await transporter.sendMail({
    from: SMTP_FROM || 'CareerPilot AI <no-reply@example.com>',
    to,
    subject,
    html,
  });

  return { success: true, messageId: info.messageId };
}

module.exports = { sendMail };
