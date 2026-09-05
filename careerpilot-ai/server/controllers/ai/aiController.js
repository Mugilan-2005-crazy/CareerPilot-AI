const orchestrator = require('../../services/ai/orchestrator');

// Provider output is an untrusted boundary. We never pass it through verbatim:
// internal/transport fields leaked by a provider (i.e. error, stack, token,
// secret, latency, requestId, provider internals) are stripped, and only a
// plain result object reaches the client.
const INTERNAL_KEYS = new Set([
  'error',
  'stack',
  'message',
  'token',
  'refreshToken',
  'secret',
  'provider',
  'model',
  'latency',
  'requestId',
  'details',
  'fallbackUsed',
  'success',
  'statusCode',
]);

function sanitizeOutput(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return null;
  }
  const out = {};
  for (const [key, value] of Object.entries(content)) {
    if (INTERNAL_KEYS.has(key)) continue; // never forward provider internals
    // Reject nested secret-like values
    if (typeof value === 'string' && /(secret|password|token|api[_-]?key)/i.test(key)) continue;
    out[key] = value;
  }
  if (Object.keys(out).length === 0) return null;
  return out;
}

async function _handleTask(req, res, next, task) {
  try {
    // Pass request ID for correlation and tracing
    const aiResp = await orchestrator.handle(task, req.body, req.requestId);
    // Preserve the previous external API shape by returning the task result content
    if (aiResp && aiResp.content) {
      const safe = sanitizeOutput(aiResp.content);
      if (safe) {
        return res.json(safe);
      }
      return res.status(502).json({ success: false, message: 'AI provider returned an unsafe or empty result', requestId: req.requestId });
    }
    // If no structured content, return safe error
    return res.status(502).json({ success: false, message: 'AI provider failed to produce valid output', requestId: req.requestId });
  } catch (error) {
    next(error);
  }
}

const analyzeResume = (req, res, next) => _handleTask(req, res, next, 'resume-analysis');
const analyzeSkillGap = (req, res, next) => _handleTask(req, res, next, 'skill-gap');
const predictPlacement = (req, res, next) => _handleTask(req, res, next, 'placement-prediction');
const recommendCompanies = (req, res, next) => _handleTask(req, res, next, 'company-recommendation');
const generateInterviewQuestions = (req, res, next) => _handleTask(req, res, next, 'interview-questions');
const aiChat = (req, res, next) => _handleTask(req, res, next, 'ai-chat');

const health = async (req, res, next) => {
  try {
    const orchestrator = require('../../services/ai/orchestrator');
    const status = await orchestrator.health();
    return res.json({ success: true, status });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  analyzeResume,
  analyzeSkillGap,
  predictPlacement,
  recommendCompanies,
  generateInterviewQuestions,
  aiChat,
  health,
};
