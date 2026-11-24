import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { projectFiles } from '../../../src/infrastructure/render/projectFiles.ts';
import type { SegmentJson, VideoProps } from '../../../src/domain/timeline/VideoProps.ts';

type Partial = Readonly<{ scene: SegmentJson['scene']; audio?: string; beats?: SegmentJson['beats'] }>;

function segment({ scene, audio, beats = [] }: Partial): SegmentJson {
  return {
    lineId: '1', speaker: 'ana', chapter: 1, start: 0, lineDuration: 30, totalDuration: 30, scene, sceneKey: 0,
    words: [], beats, states: {}, audio,
  };
}

function props(segments: SegmentJson[]): VideoProps {
  return {
    fps: 30, width: 1080, height: 1920, language: 'pt-BR', format: 'story', captionStyle: 'words', title: 'T',
    chapters: ['A'], totalFrames: 30, segments, cast: [], soundEffects: [],
  };
}

const scenario = (image?: string) => ({ type: 'scenario' as const, background: { image, vector: 'room' }, characters: [] });

async function projectWith(files: string[]): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'giz-files-'));
  for (const file of files) {
    await mkdir(join(folder, file, '..'), { recursive: true });
    await writeFile(join(folder, file), 'x');
  }
  return folder;
}

test('the scenario images of the script are staged at the same relative path as the voices', async () => {
  const folder = await projectWith(['scenarios/room.png', 'voice/1.wav']);
  const files = projectFiles(props([segment({ scene: scenario('scenarios/room.png'), audio: 'voice/1.wav' })]), folder);
  assert.deepEqual(files, [
    { from: join(folder, 'voice/1.wav'), at: 'voice/1.wav' },
    { from: join(folder, 'scenarios/room.png'), at: 'scenarios/room.png' },
  ]);
  await rm(folder, { recursive: true, force: true });
});

test('an image a beat switches to is staged too, each image once', async () => {
  const folder = await projectWith(['a.png', 'b.png']);
  const beats = [{ frame: 10, changes: { background: { image: 'b.png' } } }, { frame: 20, changes: { background: { image: 'a.png' } } }];
  const files = projectFiles(props([segment({ scene: scenario('a.png'), beats }), segment({ scene: scenario('a.png') })]), folder);
  assert.deepEqual(files.map((file) => file.at), ['a.png', 'b.png']);
  await rm(folder, { recursive: true, force: true });
});

test('a missing image is not staged (the render falls back to the vector background), lesson scenes have none', async () => {
  const folder = await projectWith([]);
  const lesson = { type: 'title' as const, title: 'Oi' } as unknown as SegmentJson['scene'];
  const files = projectFiles(props([segment({ scene: scenario('missing.png') }), segment({ scene: lesson }), segment({ scene: scenario() })]), folder);
  assert.deepEqual(files, []);
  await rm(folder, { recursive: true, force: true });
});
