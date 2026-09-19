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
    'career-matching': '/api/ai/career-matching',
    'skill-gap-enhanced': '/api/ai/skill-gap-enhanced',
    'skill-gap-advanced': '/api/ai/skill-gap-advanced',
    'career-match-v2': '/api/ai/career-match-v2',
    'roadmap': '/api/ai/roadmap',
    'project-recommendations': '/api/ai/project-recommendations',
    'jd-analysis': '/api/ai/jd-analysis',
    'career-transition': '/api/ai/career-transition',
    'ai-chat': '/api/ai/chat',
    // v1.1 career intelligence extensions (must stay in sync with
    // server/routes/aiCareerRoutes.js and the AI service routers).
    'resume-intelligence': '/api/ai/resume-intelligence',
    'jd-intelligence': '/api/ai/jd-intelligence',
    'career-path-explorer': '/api/ai/career-path-explorer',
    'career-path-details': '/api/ai/career-path-details',
    'what-if-simulation': '/api/ai/what-if-simulation',
    'interview-intelligence': '/api/ai/interview-intelligence',
    'interview-questions-intelligent': '/api/ai/interview-questions-intelligent',
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

