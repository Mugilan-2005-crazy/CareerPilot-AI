const express = require('express');
const router = express.Router();
const controller = require('../controllers/companyController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.get('/', auth, controller.listCompanies);
router.post('/', auth, authorize(['admin']), controller.createCompany);
router.get('/:id', auth, controller.getCompany);
router.put('/:id', auth, authorize(['admin']), controller.updateCompany);
router.delete('/:id', auth, authorize(['admin']), controller.deleteCompany);

module.exports = router;
