const mongoose = require('mongoose');

const supportedCompanies = ['TCS', 'Infosys', 'Wipro', 'Capgemini', 'Cognizant', 'Accenture', 'HCL'];
const supportedCategories = ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability'];

const companyAptitudeTrainingSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
      enum: supportedCompanies,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: supportedCategories,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: [{ type: String, trim: true }],
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  { timestamps: true },
);

companyAptitudeTrainingSchema.index({ company: 1, category: 1, difficulty: 1 });
companyAptitudeTrainingSchema.index({ question: 'text', title: 'text', tags: 'text' });

module.exports = mongoose.model('CompanyAptitudeTraining', companyAptitudeTrainingSchema);
