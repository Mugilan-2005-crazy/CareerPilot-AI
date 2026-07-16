const CompanyAptitudeTraining = require('../models/CompanyAptitudeTraining');
const { createCrudService } = require('../services/baseService');

const service = createCrudService(CompanyAptitudeTraining, {
  searchFields: ['title', 'question', 'company', 'category', 'tags'],
});

const listCompanyAptitudeTraining = async (req, res, next) => {
  try {
    const result = await service.list({
      query: req.query,
      user: req.user,
      filters: {
        company: req.query.company,
        category: req.query.category,
        difficulty: req.query.difficulty,
        isActive: req.query.isActive,
      },
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getCompanyAptitudeTraining = async (req, res, next) => {
  try {
    const item = await service.get({ id: req.params.id });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const createCompanyAptitudeTraining = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.user && payload.createdBy === undefined) {
      payload.createdBy = req.user._id;
    }
    const item = await service.create({ payload });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const updateCompanyAptitudeTraining = async (req, res, next) => {
  try {
    const item = await service.update({ id: req.params.id, payload: req.body });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const deleteCompanyAptitudeTraining = async (req, res, next) => {
  try {
    const item = await service.remove({ id: req.params.id });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCompanyAptitudeTraining,
  getCompanyAptitudeTraining,
  createCompanyAptitudeTraining,
  updateCompanyAptitudeTraining,
  deleteCompanyAptitudeTraining,
};
