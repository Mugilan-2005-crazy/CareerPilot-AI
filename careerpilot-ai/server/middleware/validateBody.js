module.exports = function validateBody(requiredFields = []) {
  return (req, res, next) => {
    const missing = [];
    requiredFields.forEach((field) => {
      if (req.body[field] === undefined || req.body[field] === null) missing.push(field);
    });
    if (missing.length) return res.status(400).json({ success: false, message: 'Missing fields', missing });
    next();
  };
};
