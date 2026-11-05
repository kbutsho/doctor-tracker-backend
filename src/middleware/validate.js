const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

// validate({ params, query, body }) with zod schemas
module.exports = (schemas) => (req, _res, next) => {
  try {
    if (schemas.query) {
      const cleaned = Object.fromEntries(Object.entries(req.query).filter(([, v]) => v !== ''));
      req.query = schemas.query.parse(cleaned);
    }
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.body) req.body = schemas.body.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return next(new ApiError(400, 'Validation failed', details));
    }
    next(err);
  }
};
