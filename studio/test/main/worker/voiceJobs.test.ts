import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SampleVoice, SpokenSample, VoiceJob } from '../../../src/main/ports/MediaCore.ts';
import type { SampleRequest, VoiceWork } from '../../../src/main/ports/VoiceWork.ts';
import type { FromVoiceWorker } from '../../../src/main/worker/voiceMessages.ts';
import { VoiceJobs } from '../../../src/main/worker/voiceJobs.ts';

const SAMPLE: SpokenSample = { wav: new Uint8Array([1, 2, 3]), seconds: 0.2, envelope: [0.5], visemes: 'A' };

/** Two lines per job, each one waiting for `next()`; it honors the signal between lines, as core does. */
class SteppedWork implements VoiceWork {
  readonly jobs: Array<Readonly<{ folder: string; job: VoiceJob }>> = [];
  readonly samples: Array<Readonly<{ voice: SampleVoice; request: SampleRequest }>> = [];
  #steps: Array<() => void> = [];

  next(): void {
    this.#steps.shift()?.();
  }

  async generate(folder: string, job: VoiceJob): Promise<void> {
    this.jobs.push({ folder, job });
    for (const lineId of ['1', '2']) {
      job.signal?.throwIfAborted();
      await new Promise<void>((resolve) => this.#steps.push(resolve));
      job.onLine?.(Number(lineId), 2, lineId);
    }
  }

  async sample(voice: SampleVoice, request: SampleRequest): Promise<SpokenSample> {
    this.samples.push({ voice, request });
    if (request.text === 'falha') throw new Error('o modelo não abriu');
    return SAMPLE;
  }
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

function jobsWith(work: VoiceWork) {
  const told: FromVoiceWorker[] = [];
  return { jobs: new VoiceJobs(work, (message) => told.push(message)), told };
}

test('a lines job: each line done is told, then its end; the key reaches the work, not the messages', async () => {
  const work = new SteppedWork();
  const { jobs, told } = jobsWith(work);
  jobs.receive({ type: 'voices', id: 1, folder: '/p', key: 'segredo', language: 'pt-BR' });
  await settle();
  work.next();
  await settle();
  work.next();
  await settle();
  assert.deepEqual(told, [
    { type: 'line', id: 1, done: 1, total: 2, lineId: '1' },
    { type: 'line', id: 1, done: 2, total: 2, lineId: '2' },
    { type: 'ended', id: 1 },
  ]);
  assert.equal(work.jobs[0]!.job.key, 'segredo');
  assert.ok(!JSON.stringify(told).includes('segredo'));
});

test('jobs run one after another (one model in use at a time); a sample asked meanwhile waits and gets its audio', async () => {
  const work = new SteppedWork();
  const { jobs, told } = jobsWith(work);
  jobs.receive({ type: 'voices', id: 1, folder: '/p', only: '2', language: 'pt-BR' });
  jobs.receive({ type: 'sample', id: 2, voice: { provider: 'qwen', model: '1.7b' }, request: { id: 'vivian', text: 'Oi', language: 'pt-BR' }, language: 'pt-BR' });
  await settle();
  assert.equal(work.samples.length, 0);
  work.next();
  await settle();
  work.next();
  await settle();
  assert.deepEqual(told.slice(-2), [{ type: 'ended', id: 1 }, { type: 'ended', id: 2, sample: SAMPLE }]);
  assert.deepEqual(work.samples[0]!.voice, { provider: 'qwen', model: '1.7b' });
});

test('a cancel stops the job before its next line; the end is told once the line in flight is done', async () => {
  const work = new SteppedWork();
  const { jobs, told } = jobsWith(work);
  jobs.receive({ type: 'voices', id: 1, folder: '/p', language: 'pt-BR' });
  await settle();
  jobs.receive({ type: 'cancel', id: 1 });
  await settle();
  assert.equal(told.length, 0);
  work.next();
  await settle();
  assert.deepEqual(told.map(({ type }) => type), ['line', 'failed']);
});

test('a job that fails tells its message; a message of another shape is refused without running anything', async () => {
  const work = new SteppedWork();
  const { jobs, told } = jobsWith(work);
  jobs.receive({ type: 'sample', id: 3, voice: { provider: 'qwen' }, request: { id: 'vivian', text: 'falha', language: 'pt-BR' }, language: 'en' });
  await settle();
  assert.deepEqual(told, [{ type: 'failed', id: 3, message: 'o modelo não abriu' }]);
  jobs.receive({ type: 'voices', id: 4, folder: '/p', unknown: 1 });
  jobs.receive('nada');
  await settle();
  assert.equal(told.length, 2);
  assert.deepEqual([told[1]!.type, told[1]!.id], ['failed', 4]);
  assert.equal(work.jobs.length, 0);
});
