import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorkerVoiceWork, type VoiceChannel } from '../../../../src/main/adapters/media/WorkerVoiceWork.ts';
import type { ToVoiceWorker } from '../../../../src/main/worker/voiceMessages.ts';

/** A worker channel the test answers by hand; `crash` ends the process as a crash would. */
class FakeChannel implements VoiceChannel {
  readonly sent: ToVoiceWorker[] = [];
  killed = false;
  #onMessage: (message: unknown) => void = () => undefined;
  #onExit: (code: number) => void = () => undefined;

  send(message: ToVoiceWorker): void {
    this.sent.push(message);
  }
  onMessage(listener: (message: unknown) => void): void {
    this.#onMessage = listener;
  }
  onExit(listener: (code: number) => void): void {
    this.#onExit = listener;
  }
  kill(): void {
    this.killed = true;
    this.#onExit(0);
  }
  answer(message: unknown): void {
    this.#onMessage(message);
  }
  crash(code: number): void {
    this.#onExit(code);
  }
}

function runner() {
  const channels: FakeChannel[] = [];
  const work = new WorkerVoiceWork(() => {
    const channel = new FakeChannel();
    channels.push(channel);
    return channel;
  });
  return { work, channels };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));
const SAMPLE = { wav: new Uint8Array([1, 2]), seconds: 0.4, envelope: [0.2], visemes: 'A' };
const REQUEST = { id: 'vivian', text: 'Oi', language: 'pt-BR' as const };

test('the worker is opened on the first job only, and kept for the next ones', async () => {
  const { work, channels } = runner();
  assert.equal(channels.length, 0);
  const first = work.sample({ provider: 'qwen', model: '0.6b' }, REQUEST);
  channels[0]!.answer({ type: 'ended', id: 1, sample: SAMPLE });
  assert.deepEqual(await first, SAMPLE);
  const second = work.sample({ provider: 'qwen' }, REQUEST);
  channels[0]!.answer({ type: 'ended', id: 2, sample: SAMPLE });
  await second;
  assert.equal(channels.length, 1);
  assert.deepEqual(channels[0]!.sent.map(({ id }) => id), [1, 2]);
});

test('a lines job: each line reaches onLine; it ends only when the worker says it ended', async () => {
  const { work, channels } = runner();
  const lines: string[] = [];
  let ended = false;
  const job = work.generate('/p', { only: '2', key: 'k', onLine: (_done, _total, lineId) => lines.push(lineId) }).then(() => (ended = true));
  const channel = channels[0]!;
  assert.deepEqual(channel.sent[0], { type: 'voices', id: 1, folder: '/p', only: '2', key: 'k', language: 'pt-BR' });
  channel.answer({ type: 'line', id: 1, done: 1, total: 1, lineId: '2' });
  await settle();
  assert.deepEqual([lines, ended], [['2'], false]);
  channel.answer({ type: 'ended', id: 1 });
  await job;
  assert.ok(ended);
});

test('a cancel is sent to the worker; the job still ends only when the worker ends it, as a cancel', async () => {
  const { work, channels } = runner();
  const controller = new AbortController();
  const job = work.generate('/p', { signal: controller.signal });
  let settled = false;
  void job.catch(() => undefined).then(() => (settled = true));
  controller.abort();
  assert.deepEqual(channels[0]!.sent[1], { type: 'cancel', id: 1 });
  await settle();
  assert.equal(settled, false);
  channels[0]!.answer({ type: 'failed', id: 1, message: 'This operation was aborted' });
  await assert.rejects(job, { name: 'AbortError' });
});

test('a failure keeps its readable message; the worker stays open', async () => {
  const { work, channels } = runner();
  const job = work.generate('/p', {});
  channels[0]!.answer({ type: 'failed', id: 1, message: 'Falta o modelo 1.7b.' });
  await assert.rejects(job, /Falta o modelo 1.7b/);
  assert.equal(channels[0]!.killed, false);
});

test('a crash fails every job in flight with a readable error; the next job opens a new worker', async () => {
  const { work, channels } = runner();
  const job = work.generate('/p', {});
  const sample = work.sample({ provider: 'qwen' }, REQUEST);
  channels[0]!.crash(134);
  await assert.rejects(job, /processo das vozes parou.*134/);
  await assert.rejects(sample, /processo das vozes parou/);
  const next = work.sample({ provider: 'qwen' }, REQUEST);
  assert.equal(channels.length, 2);
  channels[1]!.answer({ type: 'ended', id: channels[1]!.sent[0]!.id, sample: SAMPLE });
  assert.deepEqual(await next, SAMPLE);
});

test('an answer of another shape closes the worker and fails what was in flight', async () => {
  const { work, channels } = runner();
  const job = work.generate('/p', {});
  channels[0]!.answer({ type: 'line', id: 1, done: 'um' });
  await assert.rejects(job, /fora do formato/);
  assert.equal(channels[0]!.killed, true);
});

test('restart closes an idle worker at once; the next job opens a new one (a new model or config is read there)', async () => {
  const { work, channels } = runner();
  const first = work.sample({ provider: 'qwen' }, REQUEST);
  channels[0]!.answer({ type: 'ended', id: 1, sample: SAMPLE });
  await first;
  work.restart();
  assert.equal(channels[0]!.killed, true);
  const next = work.sample({ provider: 'qwen' }, REQUEST);
  assert.equal(channels.length, 2);
  channels[1]!.answer({ type: 'ended', id: 2, sample: SAMPLE });
  await next;
});

test('restart during a job waits for it to end: the job is not failed, the worker closes right after', async () => {
  const { work, channels } = runner();
  const job = work.generate('/p', {});
  work.restart();
  assert.equal(channels[0]!.killed, false);
  channels[0]!.answer({ type: 'ended', id: 1 });
  await job;
  assert.equal(channels[0]!.killed, true);
  work.restart();
  assert.equal(channels.length, 1, 'nothing open, nothing to close');
});

test('a sample that ends without its audio is refused as an answer of another shape', async () => {
  const { work, channels } = runner();
  const sample = work.sample({ provider: 'qwen' }, REQUEST);
  channels[0]!.answer({ type: 'ended', id: 1 });
  await assert.rejects(sample, /fora do formato/);
});

test('a send that throws (the worker just died) fails that job and leaves nothing pending', async () => {
  const { work, channels } = runner();
  const first = work.sample({ provider: 'qwen' }, REQUEST);
  channels[0]!.answer({ type: 'ended', id: 1, sample: SAMPLE });
  await first;
  channels[0]!.send = () => {
    throw new Error('port closed');
  };
  await assert.rejects(work.generate('/p', {}), /port closed/);
  channels[0]!.crash(1);
  const next = work.sample({ provider: 'qwen' }, REQUEST);
  channels[1]!.answer({ type: 'ended', id: channels[1]!.sent[0]!.id, sample: SAMPLE });
  assert.deepEqual(await next, SAMPLE);
});
