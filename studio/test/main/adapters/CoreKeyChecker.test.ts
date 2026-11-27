import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CoreKeyChecker } from '../../../src/main/adapters/CoreKeyChecker.ts';

test("core's key check gets only this key, makes a single call, and answers the model and the tokens", async () => {
  const calls: Array<{ url: string; key: string | null }> = [];
  const send = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), key: new Headers(init?.headers).get('x-api-key') });
    return Response.json({ content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 11, output_tokens: 2 } });
  }) as typeof fetch;
  const checker = new CoreKeyChecker(send);
  assert.equal(checker.supports('anthropic'), true);
  assert.equal(checker.supports('fal'), false);
  const answer = await checker.check('anthropic', 'sk-ant-1');
  assert.deepEqual(answer, { model: 'claude-sonnet-5-5', inputTokens: 11, outputTokens: 2 });
  assert.deepEqual(calls, [{ url: 'https://api.anthropic.com/v1/messages', key: 'sk-ant-1' }]);
});

test('a refused key fails at once (no retry) with core readable message, without the key', async () => {
  let calls = 0;
  const send = (async () => {
    calls += 1;
    return new Response(JSON.stringify({ error: { message: 'bad key sk-ant-1' } }), { status: 401 });
  }) as typeof fetch;
  await assert.rejects(new CoreKeyChecker(send).check('anthropic', 'sk-ant-1'), (error: Error) => {
    assert.match(error.message, /a chave foi recusada \(401\)/);
    assert.equal(error.message.includes('sk-ant-1'), false);
    return true;
  });
  assert.equal(calls, 1);
});
