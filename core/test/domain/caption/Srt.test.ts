import { test } from 'node:test';
import assert from 'node:assert/strict';
import { srtOf } from '../../../src/domain/caption/Srt.ts';
import type { SegmentJson, VideoProps, WordInFrames } from '../../../src/domain/timeline/VideoProps.ts';

function segment(speaker: string, start: number, words: WordInFrames[]): SegmentJson {
  const lineDuration = words.at(-1)?.end ?? 0;
  return {
    lineId: `${speaker}-${start}`, speaker, chapter: 1, start, lineDuration, totalDuration: lineDuration + 10,
    scene: { type: 'talk' }, sceneKey: 0, words, beats: [], states: {},
  };
}

function props(segments: SegmentJson[], format: VideoProps['format'] = 'lesson'): VideoProps {
  return {
    fps: 30, width: 1920, height: 1080, language: 'pt-BR', format, captionStyle: 'blocks', title: 'T', chapters: ['A'],
    totalFrames: 600, segments, soundEffects: [],
    cast: [
      { id: 'ana', name: 'Ana', rig: 'gizzy', parameters: {}, defaultExpression: 'neutral' },
      { id: 'narrator', name: 'Narrador', parameters: {}, defaultExpression: 'neutral' },
    ],
  };
}

test('the srt uses the real times of the words, moved by the video lead-in (0.5 s) so it matches the mp4', () => {
  const srt = srtOf(props([segment('ana', 30, [{ text: 'Oi,', start: 6, end: 15 }, { text: 'Téo.', start: 18, end: 40 }])]));
  assert.equal(srt, '1\n00:00:01,700 --> 00:00:02,833\nAna: Oi, Téo.\n');
});

test('cues are numbered across segments; the narrator (no body) has no name before the text', () => {
  const srt = srtOf(props([
    segment('ana', 0, [{ text: 'Oi.', start: 0, end: 9 }]),
    segment('narrator', 3600 * 30 + 61 * 30, [{ text: 'Fim.', start: 3, end: 12 }]),
  ]));
  assert.equal(srt, '1\n00:00:00,500 --> 00:00:00,800\nAna: Oi.\n\n2\n01:01:01,600 --> 01:01:01,900\nFim.\n');
});

test('a long line becomes sentence blocks, each from its first word to the next block (story too)', () => {
  const texts = 'Você acordou numa casa pequena, perto de uma praça larga e calma. O wi-fi caiu no domingo de manhã e ninguém sabia o motivo.'.split(' ');
  const words = texts.map((text, index) => ({ text, start: index * 10, end: index * 10 + 8 }));
  const srt = srtOf(props([segment('narrator', 0, words)], 'story'));
  const cues = srt.trim().split('\n\n');
  assert.equal(cues.length, 2);
  assert.equal(cues[0], '1\n00:00:00,500 --> 00:00:04,500\nVocê acordou numa casa pequena, perto de uma praça larga e calma.');
  assert.match(cues[1], /^2\n00:00:04,500 --> 00:00:08,433\nO wi-fi caiu/);
});

test('a segment without words (old props) adds no cue', () => {
  assert.equal(srtOf(props([segment('ana', 0, [])])), '');
});
