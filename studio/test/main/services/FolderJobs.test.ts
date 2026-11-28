import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FolderJobs } from '../../../src/main/services/FolderJobs.ts';
import { folderJobsGuard } from '../../../src/main/ipc/folderJobsGuard.ts';
import type { Handlers } from '../../../src/main/ipc/registry.ts';

// A job that runs until `finish` is called.
function held() {
  let finish: () => void = () => undefined;
  const done = new Promise<void>((resolve) => (finish = resolve));
  return { done, finish: () => finish() };
}

test('a render and a voice or scenario job never run on the same folder at once; other folders and other pairs may', async () => {
  const jobs = new FolderJobs();
  const render = held();
  const running = jobs.run('/p', 'render', () => render.done);
  await assert.rejects(jobs.run('/p', 'voices', async () => 1), { code: 'busy', message: /renderizado/ });
  await assert.rejects(jobs.run('/p/', 'scenarios', async () => 1), { code: 'busy' });
  assert.equal(await jobs.run('/q', 'voices', async () => 'q'), 'q');
  render.finish();
  await running;
  const voices = held();
  const making = jobs.run('/p', 'voices', () => voices.done);
  await assert.rejects(jobs.run('/p', 'render', async () => 1), { code: 'busy', message: /vozes/ });
  assert.equal(await jobs.run('/p', 'scenarios', async () => 'both'), 'both');
  voices.finish();
  await making;
  assert.equal(await jobs.run('/p', 'render', async () => 'free'), 'free');
});

test('a job that fails frees its folder too', async () => {
  const jobs = new FolderJobs();
  await assert.rejects(jobs.run('/p', 'scenarios', async () => Promise.reject(new Error('sem chave'))), /sem chave/);
  assert.equal(await jobs.run('/p', 'render', async () => 'ok'), 'ok');
});

test('the channels of a render and of voice and scenario generation go through the folder jobs; the others do not', async () => {
  const render = held();
  const calls: string[] = [];
  const handlers = {
    'video.render': async () => (await render.done, { video: 'v', captions: 'c' }),
    'voices.generate': async () => void calls.push('voices'),
    'scenarios.generate': async () => void calls.push('scenarios'),
    'voices.read': async () => void calls.push('read'),
  } as unknown as Handlers;
  const guarded = folderJobsGuard(handlers, new FolderJobs(), { voices: async () => undefined });
  const call = (name: string, request: unknown) => (guarded as unknown as Record<string, (request: unknown) => Promise<unknown>>)[name]!(request);
  const rendering = call('video.render', { folder: '/p', aspect: '16:9' });
  await assert.rejects(call('voices.generate', { folder: '/p' }), { code: 'busy' });
  await assert.rejects(call('scenarios.generate', { folder: '/p', lineId: '1', force: false }), { code: 'busy' });
  await call('voices.read', { folder: '/p' });
  render.finish();
  await rendering;
  await call('voices.generate', { folder: '/p' });
  assert.deepEqual(calls, ['read', 'voices']);
});

test("a cancelled voice job answers at once but keeps its folder until the voice worker really ended it", async () => {
  const worker = held();
  const handlers = {
    'video.render': async () => ({ video: 'v', captions: 'c' }),
    'voices.generate': async () => Promise.reject(Object.assign(new Error('cancelado'), { code: 'cancelled' })),
  } as unknown as Handlers;
  const guarded = folderJobsGuard(handlers, new FolderJobs(), { voices: () => worker.done }) as unknown as Record<string, (request: unknown) => Promise<unknown>>;
  await assert.rejects(guarded['voices.generate']!({ folder: '/p' }), { code: 'cancelled' });
  await assert.rejects(guarded['video.render']!({ folder: '/p', aspect: '16:9' }), { code: 'busy' });
  assert.deepEqual(await guarded['video.render']!({ folder: '/q', aspect: '16:9' }), { video: 'v', captions: 'c' });
  worker.finish();
  await worker.done;
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(await guarded['video.render']!({ folder: '/p', aspect: '16:9' }), { video: 'v', captions: 'c' });
});

test("a voice call refused at once (another folder's job is busy, an unknown line) never waits for that job nor keeps its folder", async () => {
  const otherJob = held();
  let ask = 0;
  const handlers = {
    'video.render': async () => ({ video: 'v', captions: 'c' }),
    'voices.generate': async () => Promise.reject(Object.assign(new Error('ocupado'), { code: 'busy' })),
    'voices.record': async () => Promise.reject(Object.assign(new Error('fala desconhecida'), { code: 'invalid-request' })),
  } as unknown as Handlers;
  const guarded = folderJobsGuard(handlers, new FolderJobs(), { voices: () => ((ask += 1), otherJob.done) }) as unknown as Record<string, (request: unknown) => Promise<unknown>>;
  await assert.rejects(guarded['voices.generate']!({ folder: '/b' }), { code: 'busy', message: 'ocupado' });
  await assert.rejects(guarded['voices.record']!({ folder: '/b', lineId: 'x', wav: new Uint8Array() }), { code: 'invalid-request' });
  assert.equal(ask, 0, 'the global voice job is never waited for');
  assert.deepEqual(await guarded['video.render']!({ folder: '/b', aspect: '16:9' }), { video: 'v', captions: 'c' });
  otherJob.finish();
});

test('a folder reached through a link is the same folder: a render there clashes with voices through the link', async () => {
  const real = await mkdtemp(join(tmpdir(), 'gizzy-jobs-'));
  const alias = `${real}-alias`;
  await symlink(real, alias);
  const jobs = new FolderJobs();
  const release = jobs.claim(real, 'render');
  assert.throws(() => jobs.claim(alias, 'voices'), { code: 'busy' });
  release();
  jobs.claim(alias, 'voices')();
  await rm(alias);
  await rm(real, { recursive: true });
});
