const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');
const xss = require('xss-clean');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const sanitizeMongo = (req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.params = mongoSanitize(req.params);
  req.query = mongoSanitize(req.query);
  next();
};

const xssProtection = (req, res, next) => {
  xss(req.body);
  next();
};

module.exports = { limiter, sanitizeMongo, xssProtection };
