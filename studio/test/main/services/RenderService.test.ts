import { test } from 'node:test';
import assert from 'node:assert/strict';
import { percentSteps, RenderService } from '../../../src/main/services/RenderService.ts';
import { BuildService } from '../../../src/main/services/video/BuildService.ts';
import { historyOf, HISTORY_SIZE } from '../../../src/main/services/video/renderHistory.ts';
import type { VideoRenderJob } from '../../../src/main/ports/VideoCore.ts';
import type { RenderProgress } from '../../../src/shared/contract.ts';
import { grantsFor } from '../../doubles/fakes.ts';
import { MemoryMediaFiles } from '../../doubles/mediaFakes.ts';
import { FakeVideoCore, NO_ITEMS } from '../../doubles/videoFakes.ts';

const NOW = new Date('2026-11-27T15:04:00.000Z');

function setup(progress: (event: RenderProgress) => void = () => undefined) {
  const core = new FakeVideoCore();
  const grants = grantsFor('/p', '/q');
  const files = new MemoryMediaFiles();
  const service = new RenderService({ core, build: new BuildService({ core, grants, serve: () => undefined }), files, grants, progress, now: () => NOW });
  return { core, files, service };
}

test('progress is sent once per whole percent, clamped to 0..1', () => {
  const sent: number[] = [];
  const step = percentSteps(({ fraction }) => sent.push(fraction));
  [0, 0.001, 0.004, 0.011, 0.5, 0.505, 1, 1.2].forEach(step);
  assert.deepEqual(sent, [0, 0.01, 0.5, 1]);
});

test('render streams the progress, returns the files and enters the history (date, aspect, length, files)', async () => {
  const progress: RenderProgress[] = [];
  const { core, files, service } = setup((event) => progress.push(event));
  core.renderWith = async (job) => [0.25, 0.5, 1].forEach(job.onProgress);
  const rendered = await service.render({ folder: '/p', aspect: '16:9' });
  assert.deepEqual(rendered, { video: '/p/output/video.mp4', captions: '/p/output/captions.srt' });
  assert.deepEqual(progress, [{ fraction: 0.25 }, { fraction: 0.5 }, { fraction: 1 }]);
  assert.deepEqual(await historyOf(files, '/p'), [{ at: NOW.toISOString(), aspect: '16:9', seconds: 62.5, ...rendered }]);
});

test('the other aspect renders to its own files (the project video stays); the history keeps the newest ten', async () => {
  const { core, files, service } = setup();
  for (let count = 0; count < HISTORY_SIZE; count += 1) await service.render({ folder: '/p', aspect: '16:9' });
  const rendered = await service.render({ folder: '/p', aspect: '9:16' });
  assert.deepEqual(core.renders.at(-1), { folder: '/p', aspect: '9:16', variant: '9x16' });
  assert.equal(rendered.video, '/p/output/video-9x16.mp4');
  const history = await historyOf(files, '/p');
  assert.equal(history.length, HISTORY_SIZE);
  assert.equal(history[0]?.aspect, '9:16');
});

test('a render cut short (rehearsal mode) enters the history with the length it really has', async () => {
  const { core, files, service } = setup();
  core.renderedSeconds = 1;
  assert.deepEqual(await service.render({ folder: '/p', aspect: '16:9' }), { video: '/p/output/video.mp4', captions: '/p/output/captions.srt' });
  assert.equal((await historyOf(files, '/p'))[0]?.seconds, 1);
});

test('montar comes first: a missing voice or a check error in that aspect refuses the render before core renders', async () => {
  const { core, service } = setup();
  core.checks['9:16'] = { errors: [{ line: 'a3', message: 'o título não cabe' }], warnings: [] };
  await assert.rejects(service.render({ folder: '/p', aspect: '9:16' }), { code: 'invalid-project', message: /verificação em 9:16 encontrou 1 erro/, details: ['fala 3: o título não cabe'] });
  core.items_ = { ...NO_ITEMS, voices: { stale: [], missing: ['a1'] } };
  await assert.rejects(service.render({ folder: '/p', aspect: '16:9' }), { code: 'invalid-project' });
  assert.deepEqual(core.renders, []);
  assert.equal(service.cancel(), false);
});

// A render that waits until its signal aborts, as Remotion's renderMedia does when cancelled.
const untilAborted = async ({ signal }: VideoRenderJob) => new Promise<void>((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('renderMedia() got cancelled'))));

test('cancel stops the running render, which then fails as cancelled (no history); a second render meanwhile is busy', async () => {
  const { core, files, service } = setup();
  core.renderWith = untilAborted;
  const running = service.render({ folder: '/p', aspect: '16:9' });
  await assert.rejects(service.render({ folder: '/q', aspect: '16:9' }), { code: 'busy' });
  while (core.renders.length === 0) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(service.cancel(), true);
  await assert.rejects(running, { code: 'cancelled' });
  assert.equal(service.cancel(), false);
  assert.deepEqual(await historyOf(files, '/p'), []);
});

test('a render failure that was not a cancel passes through as it is', async () => {
  const { core, service } = setup();
  core.renderWith = async () => {
    throw new Error('ffmpeg falhou');
  };
  await assert.rejects(service.render({ folder: '/p', aspect: '16:9' }), { message: 'ffmpeg falhou' });
  assert.equal(service.cancel(), false);
});

test('a folder the person did not give is refused before anything loads', async () => {
  const { core, service } = setup();
  await assert.rejects(service.render({ folder: '/etc', aspect: '16:9' }), { code: 'invalid-request' });
  assert.deepEqual(core.inspected, []);
  assert.equal(service.cancel(), false);
});
