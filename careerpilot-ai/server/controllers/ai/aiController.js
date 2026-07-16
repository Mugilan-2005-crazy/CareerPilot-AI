const axios = require('axios');
const { AI_SERVICE_URL } = require('../../config/environment');

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 20000,
});

const analyzeResume = async (req, res, next) => {
  try {
    const response = await aiClient.post('/api/ai/resume-analysis', req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
};

const analyzeSkillGap = async (req, res, next) => {
  try {
    const response = await aiClient.post('/api/ai/skill-gap', req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
};

const predictPlacement = async (req, res, next) => {
  try {
    const response = await aiClient.post('/api/ai/placement-prediction', req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
};

const recommendCompanies = async (req, res, next) => {
  try {
    const response = await aiClient.post('/api/ai/company-recommendation', req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
};

const generateInterviewQuestions = async (req, res, next) => {
  try {
    const response = await aiClient.post('/api/ai/interview-questions', req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeResume,
  analyzeSkillGap,
  predictPlacement,
  recommendCompanies,
  generateInterviewQuestions,
};
