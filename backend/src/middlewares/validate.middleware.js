const AppError = require('../utils/app-error');

// usage: validate({ params: idParam, body: addBookSchema })
// validated values are stored in req.validated because express 5 doesn't allow overwriting req.query
function validate(schemas) {
  return (req, res, next) => {
    req.validated = {};

    for (const [source, schema] of Object.entries(schemas)) {
      const { value, error } = schema.validate(req[source] ?? {}, {
        stripUnknown: true,
        errors: { wrap: { label: false } },
        messages: { 'string.empty': '{#label} is required' },
      });

      if (error) {
        const detail = error.details[0];
        return next(new AppError(detail.message, 400, detail.path.join('.')));
      }

      req.validated[source] = value;
    }

    next();
  };
}

module.exports = validate;
