const axios = require('axios');
const { AI_SERVICE_URL } = require('../../config/environment');

const client = axios.create({ baseURL: AI_SERVICE_URL, timeout: 20000 });

async function getSkillPrerequisites(req, res, next) {
  try {
    const { skill } = req.params;
    const resp = await client.get(`/api/skill-graph/prerequisites/${encodeURIComponent(skill)}`);
    return res.json(resp.data);
  } catch (err) {
    next(err);
  }
}

async function getSkillDependents(req, res, next) {
  try {
    const { skill } = req.params;
    const resp = await client.get(`/api/skill-graph/dependents/${encodeURIComponent(skill)}`);
    return res.json(resp.data);
  } catch (err) {
    next(err);
  }
}

async function getRelatedSkills(req, res, next) {
  try {
    const { skill } = req.params;
    const resp = await client.get(`/api/skill-graph/related/${encodeURIComponent(skill)}`);
    return res.json(resp.data);
  } catch (err) {
    next(err);
  }
}

async function getSkillDepth(req, res, next) {
  try {
    const { skill } = req.params;
    const resp = await client.get(`/api/skill-graph/depth/${encodeURIComponent(skill)}`);
    return res.json(resp.data);
  } catch (err) {
    next(err);
  }
}

async function postLearningOrder(req, res, next) {
  try {
    const resp = await client.post('/api/skill-graph/learning-order', req.body);
    return res.json(resp.data);
  } catch (err) {
    next(err);
  }
}

async function postSkillCoverage(req, res, next) {
  try {
    const resp = await client.post('/api/skill-graph/coverage', req.body);
    return res.json(resp.data);
  } catch (err) {
    next(err);
  }
}

async function postSuggestNextSkills(req, res, next) {
  try {
    const resp = await client.post('/api/skill-graph/suggest-next', req.body);
    return res.json(resp.data);
  } catch (err) {
    next(err);
  }
}

async function postSkillGraphSubset(req, res, next) {
  try {
    const resp = await client.post('/api/skill-graph/subset', req.body);
    return res.json(resp.data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSkillPrerequisites,
  getSkillDependents,
  getRelatedSkills,
  getSkillDepth,
  postLearningOrder,
  postSkillCoverage,
  postSuggestNextSkills,
  postSkillGraphSubset,
};
