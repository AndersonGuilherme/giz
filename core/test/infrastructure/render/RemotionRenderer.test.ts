import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RemotionRenderer, remotionCancelSignal, type RemotionCalls } from '../../../src/infrastructure/render/RemotionRenderer.ts';
import type { VideoProps } from '../../../src/domain/timeline/VideoProps.ts';

const PROPS = { title: 'T', totalFrames: 30, segments: [] } as unknown as VideoProps;
const SOURCES = { entryPoint: '/nowhere/index.ts', publicFolder: '/nowhere/public' };

test('an already aborted signal stops the render before anything is bundled or written', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-renderer-'));
  const controller = new AbortController();
  controller.abort();
  const renderer = new RemotionRenderer(SOURCES, folder, { signal: controller.signal });
  try {
    await assert.rejects(renderer.render(PROPS, join(folder, 'output', 'video.mp4'), () => undefined), { name: 'AbortError' });
    assert.equal(existsSync(join(folder, 'output')), false);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test('a cancel that arrives while the composition is being selected stops the render before renderMedia', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-renderer-'));
  const controller = new AbortController();
  let rendered = false;
  const calls = {
    withBundle: async (_sources: unknown, _files: unknown, use: (serveUrl: string) => Promise<unknown>) => use('/bundle'),
    selectComposition: async () => {
      controller.abort();
      return { id: 'Video' };
    },
    renderMedia: async () => {
      rendered = true;
      return {};
    },
  } as unknown as RemotionCalls;
  const renderer = new RemotionRenderer(SOURCES, folder, { signal: controller.signal, calls });
  try {
    await assert.rejects(renderer.render(PROPS, join(folder, 'output', 'video.mp4'), () => undefined), { name: 'AbortError' });
    assert.equal(rendered, false);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("Remotion's cancel signal fires even when the abort happened before it was made", () => {
  const controller = new AbortController();
  controller.abort();
  let cancelled = false;
  remotionCancelSignal(controller.signal)(() => (cancelled = true));
  assert.equal(cancelled, true);
});
