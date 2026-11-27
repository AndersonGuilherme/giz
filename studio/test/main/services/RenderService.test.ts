import { test } from 'node:test';
import assert from 'node:assert/strict';
import { percentSteps, RenderService } from '../../../src/main/services/RenderService.ts';
import type { RenderJob } from '../../../src/main/ports/StudioCore.ts';
import type { RenderProgress } from '../../../src/shared/contract.ts';
import { FakeCore, fakeProject } from '../../doubles/fakes.ts';

test('progress is sent once per whole percent, clamped to 0..1', () => {
  const sent: number[] = [];
  const step = percentSteps(({ fraction }) => sent.push(fraction));
  [0, 0.001, 0.004, 0.011, 0.5, 0.505, 1, 1.2].forEach(step);
  assert.deepEqual(sent, [0, 0.01, 0.5, 1]);
});

test('render streams the progress and returns the files', async () => {
  const progress: RenderProgress[] = [];
  const core = new FakeCore(fakeProject('9:16'), undefined, async (job) => [0.25, 0.5, 1].forEach(job.onProgress));
  const service = new RenderService({ core, progress: (event) => progress.push(event) });
  const files = await service.render({ folder: '/p', aspect: '9:16' });
  assert.deepEqual(files, { video: '/p/output/video.mp4', captions: '/p/output/captions.srt' });
  assert.deepEqual(progress, [{ fraction: 0.25 }, { fraction: 0.5 }, { fraction: 1 }]);
});

test('an aspect other than the project one is refused before rendering', async () => {
  let rendered = false;
  const core = new FakeCore(fakeProject('16:9'), undefined, async () => void (rendered = true));
  const service = new RenderService({ core, progress: () => undefined });
  await assert.rejects(service.render({ folder: '/p', aspect: '9:16' }), { code: 'invalid-request', message: 'Este projeto é 16:9, não 9:16.' });
  assert.equal(rendered, false);
});

// A render that waits until its signal aborts, as Remotion's renderMedia does when cancelled.
const untilAborted = async ({ signal }: RenderJob) => new Promise<void>((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('renderMedia() got cancelled'))));

test('cancel stops the running render, which then fails as cancelled; a second render meanwhile is busy', async () => {
  const service = new RenderService({ core: new FakeCore(fakeProject(), undefined, untilAborted), progress: () => undefined });
  const running = service.render({ folder: '/p', aspect: '16:9' });
  await assert.rejects(service.render({ folder: '/q', aspect: '16:9' }), { code: 'busy' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(service.cancel(), true);
  await assert.rejects(running, { code: 'cancelled' });
  assert.equal(service.cancel(), false);
});

test('a render failure that was not a cancel passes through as it is', async () => {
  const core = new FakeCore(fakeProject(), undefined, async () => {
    throw new Error('ffmpeg falhou');
  });
  const service = new RenderService({ core, progress: () => undefined });
  await assert.rejects(service.render({ folder: '/p', aspect: '16:9' }), { message: 'ffmpeg falhou' });
  assert.equal(service.cancel(), false);
});
