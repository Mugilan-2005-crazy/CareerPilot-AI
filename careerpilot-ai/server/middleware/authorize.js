// role-based authorization middleware
module.exports = function authorize(roles = []) {
  if (typeof roles === 'string') roles = [roles];

  return (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
