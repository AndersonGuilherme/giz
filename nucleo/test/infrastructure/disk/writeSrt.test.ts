import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeSrt } from '../../../src/infrastructure/disk/writeSrt.ts';
import type { VideoProps } from '../../../src/domain/timeline/VideoProps.ts';

const props: VideoProps = {
  fps: 30, width: 1080, height: 1920, language: 'pt-BR', format: 'story', captionStyle: 'words', title: 'T', chapters: ['A'],
  totalFrames: 100, soundEffects: [], cast: [{ id: 'narrator', name: 'Narrador', parameters: {}, defaultExpression: 'neutral' }],
  segments: [{
    lineId: '1', speaker: 'narrator', chapter: 1, start: 30, lineDuration: 40, totalDuration: 50, scene: { type: 'talk' }, sceneKey: 0, beats: [], states: {},
    words: [{ text: 'Você', start: 6, end: 20 }, { text: 'nasceu.', start: 21, end: 40 }],
  }],
};

test('writeSrt saves the srt with the times of the words, creating the folder', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-srt-'));
  try {
    const file = join(folder, 'render', 'captions.srt');
    await writeSrt(props, file);
    assert.equal(await readFile(file, 'utf8'), '1\n00:00:01,700 --> 00:00:02,833\nVocê nasceu.\n');
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
