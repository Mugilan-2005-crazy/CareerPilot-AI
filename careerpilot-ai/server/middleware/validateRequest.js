const { ZodError } = require('zod');

function validateRequest(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
        });
      }
      next(error);
    }
  };
}

module.exports = { validateRequest };
