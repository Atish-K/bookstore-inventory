const AppError = require('../utils/app-error');

// all errors end up here, so the response format is always the same:
// { error: { message, field } }  - field only when it's related to an input
// note: express needs all 4 params to treat this as an error handler
function errorHandler(err, req, res, next) {
  const { status, message, field } = getErrorInfo(err);

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: field ? { message, field } : { message },
  });
}

function getErrorInfo(err) {
  if (err instanceof AppError) {
    return { status: err.statusCode, message: err.message, field: err.field };
  }

  // invalid JSON in request body
  if (err.type === 'entity.parse.failed') {
    return { status: 400, message: 'Request body is not valid JSON' };
  }

  // unknown error - log it, but don't send internal details to the client
  return { status: 500, message: 'Something went wrong on the server' };
}

module.exports = errorHandler;
