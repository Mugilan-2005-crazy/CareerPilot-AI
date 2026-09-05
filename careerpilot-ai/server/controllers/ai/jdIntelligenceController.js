const orchestrator = require('../../services/ai/orchestrator');

const INTERNAL_KEYS = new Set([
  'error', 'stack', 'message', 'token', 'refreshToken', 'secret',
  'provider', 'model', 'latency', 'requestId', 'details',
  'fallbackUsed', 'success', 'statusCode',
]);

function sanitizeOutput(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null;
  const out = {};
  for (const [key, value] of Object.entries(content)) {
    if (INTERNAL_KEYS.has(key)) continue;
    if (typeof value === 'string' && /(secret|password|token|api[_-]?key)/i.test(key)) continue;
    out[key] = value;
  }
  if (Object.keys(out).length === 0) return null;
  return out;
}

async function _handleTask(req, res, next, task) {
  try {
    const aiResp = await orchestrator.handle(task, req.body, req.requestId);
    if (aiResp && aiResp.content) {
      const safe = sanitizeOutput(aiResp.content);
      if (safe) return res.json(safe);
      return res.status(502).json({ success: false, message: 'AI provider returned an unsafe or empty result', requestId: req.requestId });
    }
    return res.status(502).json({ success: false, message: 'AI provider failed to produce valid output', requestId: req.requestId });
  } catch (error) {
    next(error);
  }
}

const analyzeJobDescription = (req, res, next) => _handleTask(req, res, next, 'jd-analysis');

module.exports = {
  analyzeJobDescription,
};
