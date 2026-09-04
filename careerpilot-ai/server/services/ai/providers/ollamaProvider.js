const axios = require('axios');
const { OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT_MS } = require('../../../config/environment');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_TIMEOUT = 20000;

function _getClient() {
  return axios.create({ baseURL: OLLAMA_URL, timeout: OLLAMA_TIMEOUT_MS || DEFAULT_TIMEOUT });
}

async function health() {
  try {
    const client = _getClient();
    const resp = await client.get('/health').catch(() => null);
    return !!resp && resp.status === 200;
  } catch (err) {
    return false;
  }
}

function _extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  // First try to parse entire text as JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to find a JSON object substring
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (e2) {
      return null;
    }
  }
}

async function request(task, payload, requestId) {
  if (!OLLAMA_MODEL) {
    return { success: false, provider: 'ollama', requestId, error: 'OLLAMA_MODEL not configured', structuredData: null };
  }

  const id = requestId || uuidv4();
  const prompt = `RequestId:${id}\nTask:${task}\nPayload:${JSON.stringify(payload)}\n\nRespond with valid JSON only representing the task result object.`;

  const start = Date.now();
  try {
    const client = _getClient();
    const resp = await client.post('/api/generate', { model: OLLAMA_MODEL, prompt });
    const latency = Date.now() - start;

    if (!resp || !resp.data) {
      return { success: false, provider: 'ollama', model: OLLAMA_MODEL, requestId: id, content: null, structuredData: null, latency, error: 'empty response' };
    }

    const resultText = resp.data.output || resp.data.text || (typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data));

    const parsed = _extractJson(resultText) || null;

    return {
      success: !!parsed,
      provider: 'ollama',
      model: OLLAMA_MODEL,
      requestId: id,
      content: parsed || resultText,
      structuredData: parsed,
      latency,
      fallbackUsed: false,
      error: parsed ? null : 'invalid_or_unstructured_response',
    };
  } catch (err) {
    const latency = Date.now() - start;
    const message = (err && err.message) || 'ollama request failed';
    return { success: false, provider: 'ollama', model: OLLAMA_MODEL, requestId: id, content: null, structuredData: null, latency, error: message };
  }
}

module.exports = { request, health };
