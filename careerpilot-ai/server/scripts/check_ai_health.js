const orchestrator = require('../services/ai/orchestrator');

(async () => {
  try {
    const status = await orchestrator.health();
    console.log('AI provider health:', JSON.stringify(status, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Health check failed:', err.message || err);
    process.exit(2);
  }
})();
