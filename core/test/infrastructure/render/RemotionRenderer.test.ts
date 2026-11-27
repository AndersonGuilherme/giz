import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { partFileOf, RemotionRenderer, remotionCancelSignal, type RemotionCalls } from '../../../src/infrastructure/render/RemotionRenderer.ts';
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

test('a render limited to some frames renders only the first ones (never past the video)', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-renderer-'));
  const ranges: unknown[] = [];
  const calls = {
    withBundle: async (_sources: unknown, _files: unknown, use: (serveUrl: string) => Promise<unknown>) => use('/bundle'),
    selectComposition: async () => ({ id: 'Video', durationInFrames: 20 }),
    renderMedia: async (options: { frameRange?: unknown; outputLocation: string }) => {
      ranges.push(options.frameRange ?? null);
      await writeFile(options.outputLocation, '');
    },
  } as unknown as RemotionCalls;
  try {
    await new RemotionRenderer(SOURCES, folder, { calls, frames: 10 }).render(PROPS, join(folder, 'output', 'video.mp4'), () => undefined);
    await new RemotionRenderer(SOURCES, folder, { calls, frames: 90 }).render(PROPS, join(folder, 'output', 'video.mp4'), () => undefined);
    await new RemotionRenderer(SOURCES, folder, { calls }).render(PROPS, join(folder, 'output', 'video.mp4'), () => undefined);
    assert.deepEqual(ranges, [[0, 9], [0, 19], null]);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test('a render limited to fewer than one frame still renders the first one', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-renderer-'));
  const ranges: unknown[] = [];
  const calls = {
    withBundle: async (_sources: unknown, _files: unknown, use: (serveUrl: string) => Promise<unknown>) => use('/bundle'),
    selectComposition: async () => ({ id: 'Video', durationInFrames: 20 }),
    renderMedia: async (options: { frameRange?: unknown; outputLocation: string }) => {
      ranges.push(options.frameRange);
      await writeFile(options.outputLocation, '');
    },
  } as unknown as RemotionCalls;
  try {
    await new RemotionRenderer(SOURCES, folder, { calls, frames: 0 }).render(PROPS, join(folder, 'output', 'video.mp4'), () => undefined);
    assert.deepEqual(ranges, [[0, 0]]);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test('the part file is hidden next to the video, unique per render, and keeps the .mp4 extension Remotion asks for', () => {
  const part = partFileOf('/p/output/video-9x16.mp4');
  assert.match(part, /^\/p\/output\/\.video-9x16\.[0-9a-f-]{36}\.part\.mp4$/);
  assert.notEqual(partFileOf('/p/output/video.mp4'), partFileOf('/p/output/video.mp4'));
});

// renderMedia writes `bytes` to its output location, then fails when `fail` says so.
function writingCalls(bytes: string, fail?: () => Error) {
  const locations: string[] = [];
  const calls = {
    withBundle: async (_sources: unknown, _files: unknown, use: (serveUrl: string) => Promise<unknown>) => use('/bundle'),
    selectComposition: async () => ({ id: 'Video', durationInFrames: 20 }),
    renderMedia: async ({ outputLocation }: { outputLocation: string }) => {
      locations.push(outputLocation);
      await writeFile(outputLocation, bytes);
      if (fail) throw fail();
    },
  } as unknown as RemotionCalls;
  return { calls, locations };
}

test('the video appears only once whole: rendered to a part file, then renamed over the old one', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-renderer-'));
  const output = join(folder, 'output', 'video.mp4');
  const { calls, locations } = writingCalls('new video');
  try {
    await new RemotionRenderer(SOURCES, folder, { calls }).render(PROPS, output, () => undefined);
    assert.notEqual(locations[0], output);
    assert.equal(await readFile(output, 'utf8'), 'new video');
    assert.deepEqual(await readdir(join(folder, 'output')), ['video.mp4']);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test('a failed or cancelled render leaves the old video as it was and no part file', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-renderer-'));
  const output = join(folder, 'output', 'video.mp4');
  try {
    await new RemotionRenderer(SOURCES, folder, { calls: writingCalls('old video').calls }).render(PROPS, output, () => undefined);
    const { calls } = writingCalls('half a video', () => new Error('renderMedia was cancelled'));
    await assert.rejects(new RemotionRenderer(SOURCES, folder, { calls }).render(PROPS, output, () => undefined), /cancelled/);
    assert.equal(await readFile(output, 'utf8'), 'old video');
    assert.deepEqual(await readdir(join(folder, 'output')), ['video.mp4']);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
