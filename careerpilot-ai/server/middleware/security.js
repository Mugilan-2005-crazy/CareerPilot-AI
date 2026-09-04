const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');
// xss-clean exports a factory that RETURNS a (req, res, next) middleware.
// Calling it directly as a function (e.g. xss(req.body)) is a silent no-op,
// so we must invoke it as middleware: xssClean()(...).
const xssClean = require('xss-clean');

// Global floor: every route is bounded. Endpoint-specific limiters below
// apply tighter budgets to expensive / abuse-prone endpoints (auth + AI).
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Authentication-related endpoints: brute-force resistance.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

// AI endpoints are expensive + unbounded computation; a tighter budget than
// the global limiter prevents abuse beyond the 200/15min global floor.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests, please try again later.' },
});

const sanitizeMongo = (req, res, next) => {
  // mongo-sanitize strips keys whose names start with '$' or contain '.'
  // from the (already parsed) input, neutralizing NoSQL operator injection.
  req.body = mongoSanitize(req.body);
  req.params = mongoSanitize(req.params);
  req.query = mongoSanitize(req.query);
  next();
};

// Real, functional input sanitization middleware (see xss-clean docs).
const xssProtection = xssClean();

module.exports = { limiter, authLimiter, aiLimiter, sanitizeMongo, xssProtection };
