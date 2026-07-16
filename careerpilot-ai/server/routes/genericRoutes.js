const express = require('express');
module.exports = function (Model, controller, options = {}) {
  const router = express.Router();
  const auth = require('../middleware/auth');
  const authorize = require('../middleware/authorize');

  router.get('/', auth, controller.list);
  router.post('/', auth, authorize(options.createRoles || ['admin']), controller.create);
  router.get('/:id', auth, controller.get);
  router.put('/:id', auth, authorize(options.updateRoles || ['admin']), controller.update);
  router.delete('/:id', auth, authorize(options.deleteRoles || ['admin']), controller.remove);

  return router;
};
