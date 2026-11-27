import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DiskProjectStateReader } from '../../../src/infrastructure/disk/DiskProjectStateReader.ts';

const folders: string[] = [];
after(() => Promise.all(folders.map((folder) => rm(folder, { recursive: true, force: true }))));

const at = (seconds: number) => new Date(1_700_000_000_000 + seconds * 1000);

async function file(folder: string, path: string, seconds: number): Promise<void> {
  const full = join(folder, path);
  await mkdir(join(full, '..'), { recursive: true });
  await writeFile(full, '');
  await utimes(full, at(seconds), at(seconds));
}

async function rendered(seconds = 100): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'giz-state-'));
  folders.push(folder);
  for (const path of ['project.json', 'script.json', 'cast/ana.json', 'voice/1.wav']) await file(folder, path, 10);
  await file(folder, 'output/video.mp4', seconds);
  return folder;
}

const reader = new DiskProjectStateReader();

test('idea.json and script.json are found by name', async () => {
  const folder = await rendered();
  assert.equal(await reader.hasIdea(folder), false);
  assert.equal(await reader.hasScript(folder), true);
  await file(folder, 'idea.json', 1);
  assert.equal(await reader.hasIdea(folder), true);
});

test('no output/video.mp4: not made', async () => {
  const folder = await rendered();
  await rm(join(folder, 'output', 'video.mp4'));
  assert.deepEqual(await reader.video(folder), { made: false, olderThanInputs: false });
});

test('a video newer than every project file is current; a later change to any file (nested too) makes it older', async () => {
  const folder = await rendered();
  assert.deepEqual(await reader.video(folder), { made: true, olderThanInputs: false });
  await file(folder, 'voice/2.json', 200);
  assert.deepEqual(await reader.video(folder), { made: true, olderThanInputs: true });
});

test('the output folder, idea.json and hidden files are not inputs of the video', async () => {
  const folder = await rendered();
  await file(folder, 'output/captions.srt', 300);
  await file(folder, 'idea.json', 300);
  await file(folder, '.git/index', 300);
  await file(folder, 'voice/.DS_Store', 300);
  assert.deepEqual(await reader.video(folder), { made: true, olderThanInputs: false });
});
