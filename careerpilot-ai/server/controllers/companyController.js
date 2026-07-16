const Company = require('../models/Company');

const createCompany = async (req, res, next) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};

const listCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find().limit(100);
    res.json({ success: true, data: companies });
  } catch (err) {
    next(err);
  }
};

const getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};

const deleteCompany = async (req, res, next) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createCompany, listCompanies, getCompany, updateCompany, deleteCompany };
