const { AI_PROVIDER } = require('../../config/environment');
let deterministic = require('./providers/deterministicProvider');
let ollama;
try {
  ollama = require('./providers/ollamaProvider');
} catch (e) {
  ollama = null;
}

/**
 * Global orchestrator timeout safety (milliseconds)
 * Ensures even if all providers hang, we eventually return an error
 * Set to 35 seconds (5 seconds beyond Ollama's default 30s timeout)
 */
const ORCHESTRATOR_TIMEOUT_MS = 35000;

/**
 * Validates AI provider response has content
 * Ensures response isn't null or undefined
 */
function _validateResponse(resp) {
  if (!resp || typeof resp !== 'object') {
    return false;
  }
  // Response must have some content to be valid
  // Either success/content fields or structuredData
  if (!resp.success && !resp.content && !resp.structuredData) {
    return false;
  }
  return true;
}

/**
 * Wraps a promise with a timeout
 * Returns error if promise doesn't resolve within timeout
 */
function _withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function handle(task, payload, requestId) {
  const start = Date.now();

  const validProviders = ['deterministic', 'ollama', 'auto'];
  if (!validProviders.includes(AI_PROVIDER)) {
    return { success: false, provider: null, requestId, error: `Invalid AI_PROVIDER configuration: ${AI_PROVIDER}` };
  }

  try {
    // Wrap entire orchestration in timeout protection
    const result = await _withTimeout(
      _executeOrchestration(task, payload, requestId, start),
      ORCHESTRATOR_TIMEOUT_MS
    );
    return result;
  } catch (timeoutErr) {
    // Orchestrator-level timeout occurred
    return {
      success: false,
      provider: null,
      requestId,
      error: 'AI orchestrator timeout',
      details: timeoutErr.message,
      latency: Date.now() - start,
    };
  }
}

/**
 * Internal orchestration logic
 * Tries Ollama first (if configured), falls back to deterministic
 */
async function _executeOrchestration(task, payload, requestId, start) {
  // AUTO or OLLAMA preference: try Ollama first when configured
  if (AI_PROVIDER === 'ollama' || AI_PROVIDER === 'auto') {
    if (ollama) {
      try {
        const resp = await ollama.request(task, payload, requestId);
        // If the provider returned structured data, accept it.
        if (resp && _validateResponse(resp) && resp.structuredData) {
          resp.latency = Date.now() - start;
          resp.fallbackUsed = false;
          resp.requestId = requestId;
          return resp;
        }
        // If Ollama returned a structured error or failed, continue to fallback
      } catch (err) {
        // Provider error - continue to fallback
      }
    }
  }

  // Deterministic fallback — always available and preserves existing behaviour
  try {
    const det = await deterministic.request(task, payload, requestId);
    if (_validateResponse(det)) {
      det.fallbackUsed = AI_PROVIDER === 'ollama' || AI_PROVIDER === 'auto';
      det.latency = Date.now() - start;
      det.requestId = requestId;
      return det;
    }
  } catch (err) {
    // Provider error - return structured error
  }

  // All providers failed or returned invalid responses
  return {
    success: false,
    provider: null,
    requestId,
    error: 'All AI providers failed',
    latency: Date.now() - start,
  };
}

async function health() {
  const status = {
    deterministic: { available: false },
    ollama: { available: false },
  };

  // Check deterministic microservice health
  try {
    const det = await deterministic.health().catch(() => false);
    if (det) status.deterministic.available = true;
  } catch (e) {
    // ignore
  }

  if (ollama && typeof ollama.health === 'function') {
    try {
      status.ollama.available = !!(await ollama.health());
    } catch (e) {
      status.ollama.available = false;
    }
  }

  return status;
}

module.exports = { handle, health };
