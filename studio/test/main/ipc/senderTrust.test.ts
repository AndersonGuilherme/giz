import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTrustedSender, type SenderRules } from '../../../src/main/ipc/senderTrust.ts';

const webContents = { id: 1 };
const window = { webContents };
const DEV: SenderRules = { window: () => window, origin: { devServer: 'http://localhost:5173' } };
const PACKAGED: SenderRules = { window: () => window, origin: { indexFile: '/app/.vite/renderer/main_window/index.html' } };
const event = (url: string, extra: object = {}) => ({ sender: webContents, senderFrame: { url, parent: null }, ...extra });

test('the top frame of our window on the dev server origin is trusted', () => {
  assert.equal(isTrustedSender(event('http://localhost:5173/'), DEV), true);
  assert.equal(isTrustedSender(event('http://localhost:5173/#/x'), DEV), true);
});

test('another origin, another port or a file: page is refused in dev', () => {
  assert.equal(isTrustedSender(event('http://localhost:5174/'), DEV), false);
  assert.equal(isTrustedSender(event('https://example.com/'), DEV), false);
  assert.equal(isTrustedSender(event('file:///app/.vite/renderer/main_window/index.html'), DEV), false);
});

test('packaged, only our index.html over file: is trusted', () => {
  assert.equal(isTrustedSender(event('file:///app/.vite/renderer/main_window/index.html'), PACKAGED), true);
  assert.equal(isTrustedSender(event('file:///app/.vite/renderer/main_window/other.html'), PACKAGED), false);
  assert.equal(isTrustedSender(event('file:///tmp/evil/index.html'), PACKAGED), false);
  assert.equal(isTrustedSender(event('http://localhost:5173/'), PACKAGED), false);
});

test('no frame, a child frame, another webContents or no window at all is refused', () => {
  assert.equal(isTrustedSender({ sender: webContents, senderFrame: null }, DEV), false);
  assert.equal(isTrustedSender(event('http://localhost:5173/', { senderFrame: { url: 'http://localhost:5173/', parent: {} } }), DEV), false);
  assert.equal(isTrustedSender(event('http://localhost:5173/', { sender: { id: 2 } }), DEV), false);
  assert.equal(isTrustedSender(event('http://localhost:5173/'), { ...DEV, window: () => undefined }), false);
  assert.equal(isTrustedSender(undefined, DEV), false);
});
