const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

module.exports = function createResourceRoutes(Model, controller, options = {}) {
  const router = express.Router();
  const readRoles = options.readRoles || ['student', 'admin'];
  const writeRoles = options.writeRoles || ['admin'];

  router.get('/', auth, authorize(readRoles), controller.list);
  router.post('/', auth, authorize(writeRoles), controller.create);
  router.get('/:id', auth, authorize(readRoles), controller.get);
  router.put('/:id', auth, authorize(writeRoles), controller.update);
  router.delete('/:id', auth, authorize(writeRoles), controller.remove);

  return router;
};
