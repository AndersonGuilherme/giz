import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes } from '../../src/renderer/format.ts';
import { fractionOf, jobOf, reduceJobs, type JobEvent, type Jobs } from '../../src/renderer/state/setupJobs.ts';

const progress = (receivedBytes: number) => ({ task: 'voice-0.6b' as const, label: 'Qwen3-TTS 0.6B', receivedBytes, totalBytes: 100 });
const play = (events: JobEvent[]): Jobs => events.reduce(reduceJobs, {});

test('a task runs, pauses keeping where it was, resumes from there and finishes', () => {
  const paused = play([{ type: 'started', task: 'voice-0.6b' }, { type: 'progress', progress: progress(40) }, { type: 'stopped', task: 'voice-0.6b' }]);
  assert.deepEqual(jobOf(paused, 'voice-0.6b'), { status: 'stopped', progress: progress(40) });
  const resumed = reduceJobs(paused, { type: 'started', task: 'voice-0.6b' });
  assert.deepEqual(jobOf(resumed, 'voice-0.6b'), { status: 'running', progress: progress(40) });
  assert.deepEqual(jobOf(reduceJobs(resumed, { type: 'finished', task: 'voice-0.6b' }), 'voice-0.6b'), { status: 'done' });
  assert.deepEqual(jobOf(resumed, 'gpu'), { status: 'idle' });
});

test('a late progress event of a task that is not running is ignored; a failure keeps its message', () => {
  const late = reduceJobs({}, { type: 'progress', progress: progress(10) });
  assert.deepEqual(late, {});
  const failure = { code: 'failed' as const, message: 'A operação falhou.', details: ['sem rede'] };
  assert.deepEqual(jobOf(play([{ type: 'started', task: 'gpu' }, { type: 'failed', task: 'gpu', failure }]), 'gpu'), { status: 'failed', failure });
});

test('the fraction is unknown without a size, and never above 1', () => {
  assert.equal(fractionOf(null), null);
  assert.equal(fractionOf({ ...progress(0), totalBytes: 0 }), null);
  assert.equal(fractionOf(progress(25)), 0.25);
  assert.equal(fractionOf(progress(130)), 1);
});

test('sizes read naturally in each language: GB with one decimal, MB below a gigabyte', () => {
  assert.equal(formatBytes(5.9e9, 'pt-BR'), '5,9 GB');
  assert.equal(formatBytes(5.9e9, 'en'), '5.9 GB');
  assert.equal(formatBytes(240e6, 'pt-BR'), '240 MB');
  assert.equal(formatBytes(120e9, 'en'), '120 GB');
});
