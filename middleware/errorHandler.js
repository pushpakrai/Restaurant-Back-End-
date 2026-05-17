const { logger } = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  logger.error('Request failed', { status, message, path: req.path, stack: err.stack });

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { detail: err.stack }),
  });
}

module.exports = { errorHandler };
