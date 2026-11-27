import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { VideoProps } from '../../../src/domain/timeline/VideoProps.ts';
import { mediaSourceOf, videoMarks } from '../../../src/presentation/studio/videoMarks.ts';

const segment = (lineId: string, chapter: number, start: number) => ({ lineId, chapter, start }) as VideoProps['segments'][number];
const PROPS = { fps: 30, totalFrames: 300, chapters: ['Abertura', 'O golpe'], segments: [segment('1', 1, 0), segment('2', 1, 100), segment('3', 2, 200)] } as unknown as VideoProps;

test('each line and chapter starts where its first segment lands in the video (after the lead-in)', () => {
  const marks = videoMarks(PROPS);
  assert.equal(marks.durationInFrames, 15 + 300 + 30);
  assert.deepEqual(marks.lines, [{ lineId: '1', chapter: 1, frame: 15 }, { lineId: '2', chapter: 1, frame: 115 }, { lineId: '3', chapter: 2, frame: 215 }]);
  assert.deepEqual(marks.chapters, [{ number: 1, title: 'Abertura', frame: 15 }, { number: 2, title: 'O golpe', frame: 215 }]);
});

test('a chapter without lines has no mark', () => {
  const marks = videoMarks({ ...PROPS, chapters: ['Abertura', 'O golpe', 'Vazio'] });
  assert.deepEqual(marks.chapters.map(({ number }) => number), [1, 2]);
});

test("the window's media source gives each file of the video its URL, and nothing for any other file", () => {
  const source = mediaSourceOf({ 'voice/1.wav': 'giz-media://file/a/voice/1.wav' });
  assert.equal(source('voice/1.wav'), 'giz-media://file/a/voice/1.wav');
  assert.equal(source('scenes/9.png'), '');
});
