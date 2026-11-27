import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OneJob } from '../../../../src/main/services/media/OneJob.ts';

const later = () => new Promise((done) => setImmediate(done));

test('a cancel answers at once as cancelled, but the job stays busy until its work really ends', async () => {
  const job = new OneJob();
  let finish: () => void = () => undefined;
  const running = job.run((signal) => new Promise<string>((done) => {
    finish = () => done('late');
    void signal;
  }));
  assert.equal(job.running(), true);
  assert.equal(job.cancel(), true);
  await assert.rejects(running, { code: 'cancelled' });
  assert.equal(job.running(), true, 'the line in flight is still running');
  await assert.rejects(job.run(async () => 'second'), { code: 'busy' });
  finish();
  await later();
  assert.equal(job.running(), false);
  assert.equal(await job.run(async () => 'second'), 'second');
});

test('a job that ends on its own or fails frees the slot; ended() waits for the work', async () => {
  const job = new OneJob();
  assert.equal(await job.run(async () => 1), 1);
  await assert.rejects(job.run(async () => {
    throw new Error('falhou');
  }), /falhou/);
  assert.equal(job.running(), false);
  await job.ended();
});
