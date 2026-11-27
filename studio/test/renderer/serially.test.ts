import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serially } from '../../src/renderer/state/serially.ts';

test('calls made at once run and answer in the order they were made, even when an earlier one is slower or fails', async () => {
  const run = serially();
  const order: string[] = [];
  const slow = run(async () => {
    await new Promise((done) => setTimeout(done, 20));
    order.push('first');
    throw new Error('falhou');
  });
  const fast = run(async () => void order.push('second'));
  await assert.rejects(slow, /falhou/);
  await fast;
  assert.deepEqual(order, ['first', 'second']);
});
