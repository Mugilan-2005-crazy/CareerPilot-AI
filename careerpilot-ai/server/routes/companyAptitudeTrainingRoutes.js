const express = require('express');
const controller = require('../controllers/companyAptitudeTrainingController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', auth, authorize(['student', 'admin']), controller.listCompanyAptitudeTraining);
router.post('/', auth, authorize(['admin']), controller.createCompanyAptitudeTraining);
router.get('/:id', auth, authorize(['student', 'admin']), controller.getCompanyAptitudeTraining);
router.put('/:id', auth, authorize(['admin']), controller.updateCompanyAptitudeTraining);
router.delete('/:id', auth, authorize(['admin']), controller.deleteCompanyAptitudeTraining);

module.exports = router;
