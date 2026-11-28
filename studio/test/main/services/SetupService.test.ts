import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { TaskProgress } from '../../../src/shared/setup.ts';
import { progressSteps, SetupService } from '../../../src/main/services/SetupService.ts';
import { FakeSetupTools, InMemorySharedConfig, untilAborted } from '../../doubles/settingsFakes.ts';

function setupService(tools: FakeSetupTools) {
  const shared = new InMemorySharedConfig();
  const sent: TaskProgress[] = [];
  const service = new SetupService({ tools, shared, progress: (progress) => void sent.push(progress) });
  return { service, shared, sent };
}

test('the status asks the tools about the models folder of gizzycera.config.json', async () => {
  const { service, shared } = setupService(new FakeSetupTools());
  shared.values = { ...shared.values, modelsDir: '/m/ready' };
  assert.equal((await service.gpu()).ready, true);
  assert.equal((await service.models()).modelsDir, '/m/ready');
});

test('a task runs with the models folder and streams its progress, tagged with the task', async () => {
  const tools = new FakeSetupTools(async (_task, job) => {
    job.onProgress({ label: 'Qwen3-TTS 0.6B', receivedBytes: 0, totalBytes: 100 });
    job.onProgress({ label: 'Qwen3-TTS 0.6B', receivedBytes: 100, totalBytes: 100 });
  });
  const { service, sent } = setupService(tools);
  assert.equal(await service.run('voice-0.6b'), true);
  assert.deepEqual(tools.runs, [['voice-0.6b', '/home/ana/.cache/gizzycera']]);
  assert.deepEqual(sent.map(({ task, receivedBytes }) => [task, receivedBytes]), [['voice-0.6b', 0], ['voice-0.6b', 100]]);
});

test('stop aborts the running task, which answers cancelled; stopping a task that is not running says false', async () => {
  const { service } = setupService(new FakeSetupTools((_task, job) => untilAborted(job.signal)));
  const running = service.run('voice-1.7b');
  await assert.rejects(service.run('voice-1.7b'), { code: 'busy' });
  assert.equal(service.stop('whisper'), false);
  assert.equal(service.stop('voice-1.7b'), true);
  await assert.rejects(running, { code: 'cancelled' });
  assert.equal(service.stop('voice-1.7b'), false, 'the stopped task is no longer running');
});

test('a finished GPU install makes the GPU the voice device in gizzycera.config.json; a failed one changes nothing', async () => {
  const done = setupService(new FakeSetupTools());
  await done.service.run('gpu');
  assert.deepEqual(done.shared.writes, [{ device: 'cuda' }]);
  const failing = setupService(new FakeSetupTools(async () => {
    throw new Error('sem rede');
  }));
  await assert.rejects(failing.service.run('gpu'), /sem rede/);
  assert.deepEqual(failing.shared.writes, []);
  await failing.service.models();
});

test('progress steps: at most one event per half percent of a file, and one whenever the file changes', () => {
  const sent: TaskProgress[] = [];
  const step = progressSteps('gpu', (progress) => void sent.push(progress));
  for (let received = 0; received <= 1000; received += 1) step({ label: 'cudnn', receivedBytes: received, totalBytes: 1000 });
  assert.equal(sent.length, 201);
  step({ label: 'libcublas', receivedBytes: 0, totalBytes: 0 });
  step({ label: 'libcublas', receivedBytes: 10, totalBytes: 0 });
  assert.equal(sent.length, 202);
  assert.deepEqual(sent.at(-1), { task: 'gpu', label: 'libcublas', receivedBytes: 0, totalBytes: 0 });
});

test('the local voice is ready when that model size (or the configured one) is downloaded in the models folder', async () => {
  const tools = new FakeSetupTools();
  const { service, shared } = setupService(tools);
  shared.values = { ...shared.values, modelsDir: '/m/ready', model: '1.7b' };
  assert.equal(await service.localVoiceReady(), false);
  tools.readyModels = ['1.7b'];
  assert.equal(await service.localVoiceReady(), true, 'no size named: the configured one');
  assert.equal(await service.localVoiceReady('0.6b'), false);
  shared.values = { ...shared.values, modelsDir: '/m/elsewhere' };
  assert.equal(await service.localVoiceReady('1.7b'), false);
});
