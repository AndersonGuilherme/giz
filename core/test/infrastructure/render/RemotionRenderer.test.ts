import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RemotionRenderer } from '../../../src/infrastructure/render/RemotionRenderer.ts';
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
