const axios = require('axios');
const { AI_SERVICE_URL } = require('../../../config/environment');

function _getClient() {
  return axios.create({ baseURL: AI_SERVICE_URL, timeout: 20000 });
}

async function request(task, payload, requestId) {
  // Map task to microservice endpoint
  const endpointMap = {
    'resume-analysis': '/api/ai/resume-analysis',
    'skill-gap': '/api/ai/skill-gap',
    'placement-prediction': '/api/ai/placement-prediction',
    'company-recommendation': '/api/ai/company-recommendation',
    'interview-questions': '/api/ai/interview-questions',
  };

  const path = endpointMap[task];
  if (!path) throw new Error(`Unknown deterministic task: ${task}`);

  const client = _getClient();
  const start = Date.now();
  const resp = await client.post(path, payload);
  const latency = Date.now() - start;

  return {
    success: true,
    provider: 'deterministic',
    model: 'deterministic-service',
    requestId,
    content: resp.data,
    structuredData: resp.data,
    latency,
    fallbackUsed: false,
  };
}

async function health() {
  try {
    const client = _getClient();
    const resp = await client.get('/health');
    return resp && resp.status === 200;
  } catch (e) {
    return false;
  }
}

module.exports = { request, health };

