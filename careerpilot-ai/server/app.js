const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { limiter, sanitizeMongo, xssProtection } = require('./middleware/security');
const { requestLogger } = require('./utils/logger');
const { CLIENT_URL } = require('./config/environment');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(requestLogger);
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeMongo);
app.use(xssProtection);

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'CareerPilot AI API is healthy',
  });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
