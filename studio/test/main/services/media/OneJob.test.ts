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

test('stop (on quit) cancels the job and waits for its work to really end, but never longer than the given time', async () => {
  const job = new OneJob();
  let ended = false;
  const work = job.run((signal) => new Promise<void>((done) => signal.addEventListener('abort', () => setTimeout(() => {
    ended = true;
    done();
  }, 20))));
  work.catch(() => undefined);
  await job.stop(1000);
  assert.equal(ended, true, 'the work ended before stop answered');
  const stuck = new OneJob();
  stuck.run(() => new Promise(() => undefined)).catch(() => undefined);
  const started = Date.now();
  await stuck.stop(30);
  assert.ok(Date.now() - started < 500);
  await new OneJob().stop(10);
});
