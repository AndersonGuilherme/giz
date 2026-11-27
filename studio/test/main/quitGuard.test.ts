import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quitAfterSaves } from '../../src/main/quitGuard.ts';

test('the first quit waits for the saves in flight, then quits; a later quit goes through', async () => {
  let listener: ((event: { preventDefault: () => void }) => void) | undefined;
  let quits = 0;
  let release: () => void = () => undefined;
  const app = { on: (_name: 'before-quit', given: typeof listener) => (listener = given), quit: () => void quits++ };
  quitAfterSaves(app, () => new Promise<void>((done) => (release = done)));
  let prevented = 0;
  listener!({ preventDefault: () => void prevented++ });
  assert.equal(prevented, 1);
  await new Promise((done) => setImmediate(done));
  assert.equal(quits, 0, 'still saving');
  release();
  await new Promise((done) => setImmediate(done));
  assert.equal(quits, 1);
  listener!({ preventDefault: () => void prevented++ });
  assert.equal(prevented, 1);
});
