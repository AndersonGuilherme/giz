import { test } from 'node:test';
import assert from 'node:assert/strict';
import { launcher } from '../../src/main/launcher.ts';

test('start can run twice (macOS activate): channels are registered once, a window opens each time', () => {
  let registered = 0;
  let opened = 0;
  const start = launcher({ register: () => void (registered += 1), openWindow: () => void (opened += 1) });
  start();
  start();
  assert.equal(registered, 1);
  assert.equal(opened, 2);
});
