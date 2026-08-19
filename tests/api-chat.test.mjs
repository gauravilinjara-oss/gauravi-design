import test from 'node:test';
import assert from 'node:assert/strict';

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    setHeader() {},
    write() {},
    end() {},
  };
}

test('rejects non-POST requests', async () => {
  const { default: handler } = await import('../api/chat.js');
  const res = responseRecorder();
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.body, { error: 'Method not allowed' });
});

test('fails safely when the Anthropic key is absent', async () => {
  const previous = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  try {
    const { default: handler } = await import(`../api/chat.js?missing-key=${Date.now()}`);
    const res = responseRecorder();
    await handler({ method: 'POST', headers: {}, body: { messages: [] } }, res);
    assert.equal(res.statusCode, 503);
    assert.deepEqual(res.body, { error: 'Assistant temporarily unavailable' });
  } finally {
    if (previous) process.env.ANTHROPIC_API_KEY = previous;
  }
});
