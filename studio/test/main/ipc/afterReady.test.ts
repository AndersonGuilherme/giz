import { test } from 'node:test';
import assert from 'node:assert/strict';
import { afterReady } from '../../../src/main/ipc/afterReady.ts';
import type { Handlers } from '../../../src/main/ipc/registry.ts';
import { REQUEST_SCHEMAS } from '../../../src/main/ipc/schemas.ts';

const handlersThat = (answer: () => Promise<unknown>) =>
  Object.fromEntries(Object.keys(REQUEST_SCHEMAS).map((name) => [name, answer])) as unknown as Handlers;

test('no channel answers before the start is done (the projects folder is granted first)', async () => {
  const order: string[] = [];
  let finishStart = () => undefined as void;
  const ready = new Promise<void>((done) => (finishStart = done)).then(() => void order.push('restored'));
  const handlers = afterReady(handlersThat(async () => order.push('call')), ready);
  const call = handlers['script.check']({ folder: '/p' });
  await new Promise((done) => setTimeout(done, 10));
  assert.deepEqual(order, []);
  finishStart();
  await call;
  assert.deepEqual(order, ['restored', 'call']);
});

test('a failed start does not block the calls', async () => {
  const handlers = afterReady(handlersThat(async () => 'ok'), Promise.reject(new Error('gizzycera.config.json quebrado')));
  assert.equal(await handlers['settings.get']({}), 'ok');
});
