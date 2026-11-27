import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentSecurityPolicy } from '../../config/contentSecurity.ts';

test('the packaged page gets the strict policy: no websocket, no inline styles or scripts', () => {
  const policy = contentSecurityPolicy(false);
  assert.doesNotMatch(policy, /ws:|unsafe-inline|unsafe-eval/);
  assert.match(policy, /script-src 'self'/);
  assert.match(policy, /default-src 'self'/);
});

test('only the Vite dev server adds its websocket and inline styles; scripts stay self-only', () => {
  const policy = contentSecurityPolicy(true);
  assert.match(policy, /connect-src 'self' ws:\/\/localhost:\*/);
  assert.match(policy, /style-src 'self' 'unsafe-inline'/);
  assert.match(policy, /script-src 'self';/);
});
