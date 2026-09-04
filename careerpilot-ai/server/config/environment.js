require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careerpilot_ai';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// Ollama / LLM configuration (optional in development)
const AI_PROVIDER = process.env.AI_PROVIDER || 'deterministic'; // 'ollama'|'deterministic'|'auto'
const OLLAMA_URL = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || '';
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS || '20000', 10);

// SMTP configuration for password reset emails.
// All values are sourced from process.env so secrets are never hard-coded.
// A boolean flag `SMTP_ENABLED` is derived to make the runtime contract
// explicit: a transporter is created and `sendMail` becomes operational
// only when every required credential is present.
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'CareerPilot AI <no-reply@example.com>';
const SMTP_TIMEOUT_MS = parseInt(process.env.SMTP_TIMEOUT_MS || '10000', 10);

const SMTP_ENABLED = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

// Production safety checks
const _DEFAULT_DEVELOPMENT_SECRET = 'dev-secret-change-me';
const _DEFAULT_EXAMPLE_SECRET = 'change-this-secret-in-production';

if (NODE_ENV === 'production') {
  if (!JWT_SECRET || JWT_SECRET === _DEFAULT_DEVELOPMENT_SECRET || JWT_SECRET === _DEFAULT_EXAMPLE_SECRET) {
    throw new Error('Missing or insecure JWT_SECRET. Set a strong JWT_SECRET in production environment.');
  }
}

module.exports = {
  PORT,
  NODE_ENV,
  MONGO_URI,
  JWT_SECRET: JWT_SECRET || _DEFAULT_DEVELOPMENT_SECRET,
  JWT_EXPIRES_IN,
  CLIENT_URL,
  AI_SERVICE_URL,
  AI_PROVIDER,
  OLLAMA_URL,
  OLLAMA_MODEL,
  OLLAMA_TIMEOUT_MS,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  SMTP_TIMEOUT_MS,
  SMTP_ENABLED,
};