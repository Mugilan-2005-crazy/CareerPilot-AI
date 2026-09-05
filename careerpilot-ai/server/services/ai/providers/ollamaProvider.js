const axios = require('axios');
const { OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT_MS } = require('../../../config/environment');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_TIMEOUT = 20000;
const DEFAULT_STREAM = false;

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
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (e2) {
      return null;
    }
  }
}

function _collectNdjsonLines(chunks) {
  const lines = [];
  let buffer = '';
  for (const chunk of chunks) {
    buffer += chunk;
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (line.length > 0) lines.push(line);
    }
  }
  if (buffer.trim().length > 0) lines.push(buffer.trim());
  return lines;
}

async function request(task, payload, requestId, stream) {
  if (!OLLAMA_MODEL) {
    return { success: false, provider: 'ollama', requestId, error: 'OLLAMA_MODEL not configured', structuredData: null };
  }

  const useStream = stream !== undefined ? stream : DEFAULT_STREAM;
  const id = requestId || uuidv4();
  const prompt = `RequestId:${id}\nTask:${task}\nPayload:${JSON.stringify(payload)}\n\nRespond with valid JSON only representing the task result object.`;

  const start = Date.now();
  try {
    const client = _getClient();
    const resp = await client.post('/api/generate', { model: OLLAMA_MODEL, prompt, stream: useStream });
    const latency = Date.now() - start;

    if (!resp || !resp.data) {
      return { success: false, provider: 'ollama', model: OLLAMA_MODEL, requestId: id, content: null, structuredData: null, latency, error: 'empty response' };
    }

    let resultText = '';
    if (useStream) {
      const chunks = resp.data;
      if (!Array.isArray(chunks)) {
        return { success: false, provider: 'ollama', model: OLLAMA_MODEL, requestId: id, content: null, structuredData: null, latency, error: 'invalid streaming response shape' };
      }
      for (const chunk of chunks) {
        if (chunk && typeof chunk.response === 'string') {
          resultText += chunk.response;
        }
      }
    } else {
      resultText = resp.data.response || resp.data.output || resp.data.text || '';
    }

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
