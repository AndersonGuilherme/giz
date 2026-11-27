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

test('the packaged page names no network origin: no https:, no http:, no Google Fonts host', () => {
  const policy = contentSecurityPolicy(false);
  assert.doesNotMatch(policy, /https?:|gstatic|googleapis/);
  assert.match(policy, /connect-src 'self';/);
});

test("the video's bundled fonts load from the page itself or the media scheme (core's fonts folder, served)", () => {
  assert.match(contentSecurityPolicy(false), /font-src 'self' giz-media:;/);
});
