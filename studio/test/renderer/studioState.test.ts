import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_STATE, reduce, type StudioState } from '../../src/renderer/state/studioState.ts';
import type { ProjectSummary } from '../../src/shared/contract.ts';

const PROJECT = { folder: '/p', title: 'T', format: 'lesson', language: 'pt-BR', aspect: '16:9', cast: [], chapters: 1, lines: 1, warnings: [] } satisfies ProjectSummary;

test('opening a project clears an old failure; opened shows the project and its report', () => {
  const failed = reduce(INITIAL_STATE, { type: 'failed', failure: { code: 'failed', message: 'x', details: [] } });
  const opening = reduce(failed, { type: 'opening' });
  assert.equal(opening.opening, true);
  assert.equal(opening.failure, undefined);
  const opened = reduce(opening, { type: 'opened', project: PROJECT, report: { errors: [], warnings: [] } });
  assert.equal(opened.opening, false);
  assert.equal(opened.project, PROJECT);
});

test('a render goes preparing → progress → done; progress outside a render is ignored', () => {
  const ignored = reduce(INITIAL_STATE, { type: 'render-progress', fraction: 0.4 });
  assert.deepEqual(ignored.render, { status: 'idle' });
  const started: StudioState = reduce(INITIAL_STATE, { type: 'render-started' });
  assert.deepEqual(started.render, { status: 'running', fraction: null });
  const halfway = reduce(started, { type: 'render-progress', fraction: 0.5 });
  assert.deepEqual(halfway.render, { status: 'running', fraction: 0.5 });
  const files = { video: '/p/output/video.mp4', captions: '/p/output/captions.srt' };
  assert.deepEqual(reduce(halfway, { type: 'rendered', files }).render, { status: 'done', files });
  assert.deepEqual(reduce(halfway, { type: 'render-cancelled' }).render, { status: 'cancelled' });
});
