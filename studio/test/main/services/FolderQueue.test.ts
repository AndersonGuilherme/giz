import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FolderQueue } from '../../../src/main/services/FolderQueue.ts';

const later = () => new Promise((done) => setImmediate(done));

test("one folder's writes run one after the other, in the order asked; another folder does not wait", async () => {
  const queue = new FolderQueue();
  const order: string[] = [];
  let release: () => void = () => undefined;
  const first = queue.run('/a', () => new Promise<string>((done) => (release = () => (order.push('a1'), done('a1')))));
  const second = queue.run('/a', async () => (order.push('a2'), 'a2'));
  const other = queue.run('/b', async () => (order.push('b1'), 'b1'));
  await other;
  await later();
  assert.deepEqual(order, ['b1'], 'the second write of /a waits for the first');
  release();
  assert.deepEqual(await Promise.all([first, second]), ['a1', 'a2']);
  assert.deepEqual(order, ['b1', 'a1', 'a2']);
});

test('a failed write answers its own caller and does not stop the next one', async () => {
  const queue = new FolderQueue();
  const failed = queue.run('/a', async () => {
    throw new Error('disco cheio');
  });
  const next = queue.run('/a', async () => 'ok');
  await assert.rejects(failed, /disco cheio/);
  assert.equal(await next, 'ok');
});

test('settled waits for every write in flight, of every folder (the app waits for it before quitting)', async () => {
  const queue = new FolderQueue();
  const done: string[] = [];
  let release: () => void = () => undefined;
  void queue.run('/a', () => new Promise<void>((finish) => (release = () => (done.push('a'), finish()))));
  void queue.run('/b', async () => void done.push('b')).catch(() => undefined);
  let settled = false;
  const waiting = queue.settled().then(() => (settled = true));
  await later();
  assert.equal(settled, false);
  release();
  await waiting;
  assert.deepEqual(done.sort(), ['a', 'b']);
  await queue.settled();
});
