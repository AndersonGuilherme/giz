import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NO_RENDER, reduceRender, renderOf, type RenderJobState } from '../../src/renderer/state/renderJob.ts';

const FILES = { video: '/p/output/video.mp4', captions: '/p/output/captions.srt' };
const run = (events: Parameters<typeof reduceRender>[1][]) => events.reduce(reduceRender, NO_RENDER);

test('a render goes preparing → progress → done, and its end is counted once for its folder', () => {
  const started = run([{ type: 'started', folder: '/p', aspect: '9:16' }]);
  assert.deepEqual(renderOf(started, '/p'), { status: 'running', aspect: '9:16', fraction: null });
  const halfway = reduceRender(started, { type: 'progress', folder: '/p', aspect: '9:16', fraction: 0.5 });
  assert.deepEqual(renderOf(halfway, '/p'), { status: 'running', aspect: '9:16', fraction: 0.5 });
  const done = reduceRender(halfway, { type: 'rendered', folder: '/p', aspect: '9:16', files: FILES });
  assert.deepEqual(renderOf(done, '/p'), { status: 'done', aspect: '9:16', files: FILES });
  assert.deepEqual(done.ended, { folder: '/p', count: 1 });
});

test("another folder sees no render of its own: the running one is someone else's", () => {
  const state = run([{ type: 'started', folder: '/p', aspect: '16:9' }]);
  assert.deepEqual(renderOf(state, '/q'), { status: 'idle' });
  assert.equal(state.job.status === 'running' && state.job.folder, '/p');
});

test('a screen shown again re-attaches to the render main says is running, and progress keeps naming it', () => {
  const attached = run([{ type: 'attached', status: { folder: '/p', aspect: '9:16', fraction: 0.3 } }]);
  assert.deepEqual(renderOf(attached, '/p'), { status: 'running', aspect: '9:16', fraction: 0.3 });
  const later = reduceRender(attached, { type: 'progress', folder: '/p', aspect: '9:16', fraction: 0.6 });
  assert.deepEqual(renderOf(later, '/p'), { status: 'running', aspect: '9:16', fraction: 0.6 });
  assert.deepEqual(reduceRender(NO_RENDER, { type: 'attached', status: null }), NO_RENDER);
});

test('progress of a render this window did not start (after a reload) shows it too', () => {
  const state = reduceRender(NO_RENDER, { type: 'progress', folder: '/p', aspect: '16:9', fraction: 0.1 });
  assert.deepEqual(renderOf(state, '/p'), { status: 'running', aspect: '16:9', fraction: 0.1 });
});

test('a cancel, a failure or a render that vanished end it; each end counts', () => {
  const failure = { code: 'failed', message: 'ffmpeg', details: [] } as const;
  const cancelled = run([{ type: 'started', folder: '/p', aspect: '16:9' }, { type: 'cancelled', folder: '/p', aspect: '16:9' }]);
  assert.deepEqual(renderOf(cancelled, '/p'), { status: 'cancelled', aspect: '16:9' });
  const failed: RenderJobState = reduceRender(reduceRender(cancelled, { type: 'started', folder: '/p', aspect: '16:9' }), { type: 'failed', folder: '/p', aspect: '16:9', failure });
  assert.deepEqual(renderOf(failed, '/p'), { status: 'idle', failure });
  assert.equal(failed.ended.count, 2);
  const vanished = reduceRender(reduceRender(failed, { type: 'attached', status: { folder: '/q', aspect: '9:16', fraction: null } }), { type: 'vanished' });
  assert.deepEqual(renderOf(vanished, '/q'), { status: 'idle' });
  assert.deepEqual(vanished.ended, { folder: '/q', count: 3 });
});

test('an old event of a finished render does not bring it back', () => {
  const done = run([{ type: 'started', folder: '/p', aspect: '16:9' }, { type: 'rendered', folder: '/p', aspect: '16:9', files: FILES }]);
  assert.equal(reduceRender(done, { type: 'progress', folder: '/p', aspect: '16:9', fraction: 1 }), done);
});

test('a late progress step of a render that just vanished does not bring it back (no second reload)', () => {
  const gone = run([{ type: 'attached', status: { folder: '/p', aspect: '16:9', fraction: 0.9 } }, { type: 'vanished' }]);
  assert.equal(reduceRender(gone, { type: 'progress', folder: '/p', aspect: '16:9', fraction: 1 }), gone);
  const other = reduceRender(gone, { type: 'progress', folder: '/q', aspect: '9:16', fraction: 0.2 });
  assert.deepEqual(renderOf(other, '/q'), { status: 'running', aspect: '9:16', fraction: 0.2 });
});
