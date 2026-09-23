// for errors we throw on purpose (404, 400, 409...), anything else is treated as 500
class AppError extends Error {
  constructor(message, statusCode = 500, field) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.field = field;
  }
}

module.exports = AppError;
