const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  if (err.name === 'CastError') {
    response.message = 'Invalid ID format';
    return res.status(400).json(response);
  }

  if (err.code === 11000) {
    response.message = 'Duplicate field value entered';
    return res.status(409).json(response);
  }

  if (err.name === 'ValidationError') {
    response.message = 'Validation error';
    return res.status(400).json(response);
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler,
};
