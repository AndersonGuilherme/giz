import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { RecordedVoice } from '../../src/application/ports/VoiceStore.ts';
import { BuildTimeline } from '../../src/application/use-cases/BuildTimeline.ts';
import { Cast } from '../../src/domain/cast/Cast.ts';
import { Character } from '../../src/domain/cast/Character.ts';
import type { WordJson } from '../../src/domain/speech/WordJson.ts';
import { Project } from '../../src/domain/project/Project.ts';
import { Chapter } from '../../src/domain/script/Chapter.ts';
import type { Scene } from '../../src/domain/script/Scene.ts';
import { Line, type LineData } from '../../src/domain/script/Line.ts';
import { Lines } from '../../src/domain/script/Lines.ts';
import { Script } from '../../src/domain/script/Script.ts';
import { CharacterId } from '../../src/domain/values/CharacterId.ts';
import { Language } from '../../src/domain/values/Language.ts';
import { AspectRatio } from '../../src/domain/values/AspectRatio.ts';
import { InMemoryVoiceStore } from '../doubles/InMemoryVoiceStore.ts';

type TestLine = Omit<LineData, 'chapter'> & { speaker?: string };

const BREATHER = 11; // 0.35 s at 30 fps
const title: Scene = { type: 'title', overline: 'Aula 1', title: 'Cupons' };

function project(lines: TestLine[]): Project {
  const ana = Character.of(CharacterId.of('ana'), { name: 'Ana', rig: 'test', parameters: { skin: '#aa8866' }, voice: { id: 'vivian' }, defaultExpression: 'happy' });
  const teo = Character.of(CharacterId.of('teo'), { name: 'Téo', rig: 'test', parameters: {}, voice: { id: 'ryan' }, defaultExpression: 'neutral' });
  const narrator = Character.of(CharacterId.NARRATOR, { name: 'Narrador', parameters: {}, voice: { id: 'eric' }, defaultExpression: 'neutral' });
  const list = lines.map(({ speaker = 'ana', ...data }) => Line.of(CharacterId.of(speaker), { ...data, chapter: Chapter.of(1) }));
  return Project.of(
    { title: 'Cupons', format: 'lesson', language: Language.PORTUGUESE, aspect: AspectRatio.VERTICAL, captionStyle: 'words', voice: { provider: 'qwen' } },
    { cast: Cast.of([ana, teo, narrator]), script: Script.of(['Abertura'], Lines.of(list)), warnings: [] },
  );
}

function voice(lineId: string, frames: number, { words, envelope }: { words?: WordJson[]; envelope?: number[] } = {}): RecordedVoice {
  return {
    file: `voice/${lineId}.wav`, hash: 'h', durationSeconds: frames / 30 + 0.01,
    envelope: envelope ?? Array(frames).fill(0.5), visemes: 'A'.repeat(frames), ...(words ? { words } : {}),
  };
}

function build(voices: RecordedVoice[]) {
  const store = new InMemoryVoiceStore();
  voices.forEach((record, index) => store.records.set(String(index + 1), record));
  return new BuildTimeline({ store });
}

const withScene = (id: string, text: string, extra: Partial<TestLine> = {}): TestLine => ({ id, text, scene: title, ...extra });

test('a line without a scene inherits the previous scene', async () => {
  const card: Scene = { type: 'card', variant: 'summary', title: 'Resumo', items: ['a'] };
  const useCase = build([voice('1', 30), voice('2', 30), voice('3', 30)]);
  const props = await useCase.run(project([withScene('1', 'Oi.'), { id: '2', text: 'Tudo bem?' }, { id: '3', text: 'Fim.', scene: card }]));
  const [first, second, third] = props.segments;
  assert.deepEqual(second!.scene, first!.scene);
  assert.equal(second!.sceneKey, first!.sceneKey);
  assert.deepEqual(third!.scene, card);
  assert.notEqual(third!.sceneKey, second!.sceneKey);
});

test('a first line without a scene is rejected', async () => {
  const useCase = build([voice('1', 30)]);
  await assert.rejects(useCase.run(project([{ id: '1', text: 'Oi.' }])), /fala 1: a primeira fala precisa de cena/);
});

const COUPON = 'Um cliente [usou um cupom] e [pagou mais].';
const COUPON_WORDS: WordJson[] = [
  { text: 'Um', start: 0, end: 0.2 }, { text: 'cliente', start: 0.2, end: 0.6 }, { text: '[usou', start: 0.6, end: 0.9 },
  { text: 'um', start: 0.9, end: 1 }, { text: 'cupom]', start: 1, end: 1.4 }, { text: 'e', start: 1.4, end: 1.5 },
  { text: '[pagou', start: 1.5, end: 1.9 }, { text: 'mais].', start: 2, end: 2.3 },
];

test('the beat of the second [span] falls on the frame of the word that opens it', async () => {
  const useCase = build([voice('1', 75, { words: COUPON_WORDS })]);
  const props = await useCase.run(project([withScene('1', COUPON, { beats: [{ expression: 'surprised' }, { expression: 'angry' }] })]));
  const [segment] = props.segments;
  assert.deepEqual(segment!.beats.map((beat) => beat.frame), [18, 45]);
  assert.deepEqual(segment!.beats[1]!.changes, { expression: 'angry' });
});

test('the segment words come in relative frames and without the brackets', async () => {
  const useCase = build([voice('1', 75, { words: COUPON_WORDS })]);
  const props = await useCase.run(project([withScene('1', COUPON, { beats: [{}, {}] })]));
  const words = props.segments[0]!.words;
  assert.deepEqual(words.map((word) => word.text), ['Um', 'cliente', 'usou', 'um', 'cupom', 'e', 'pagou', 'mais.']);
  assert.deepEqual(words[6], { text: 'pagou', start: 45, end: 57 });
});

test('without recorded words, the beat is interpolated over the voiced frames', async () => {
  const envelope = [...Array(10).fill(0), ...Array(30).fill(0.5)];
  const useCase = build([voice('1', 40, { envelope })]);
  const props = await useCase.run(project([withScene('1', 'aaaa [bbbb]', { beats: [{}] })]));
  // "aaaa bbbb": the beat is at character 5 of 9 → voiced frame no. floor(5/9 × 30) = 16 → frame 10 + 16
  assert.equal(props.segments[0]!.beats[0]!.frame, 26);
  assert.deepEqual(props.segments[0]!.words.map((word) => word.text), ['aaaa', 'bbbb']);
});

test('a beat count different from the [spans] count is rejected', async () => {
  const useCase = build([voice('1', 75, { words: COUPON_WORDS })]);
  await assert.rejects(useCase.run(project([withScene('1', COUPON, { beats: [{}] })])), /fala 1: 2 \[trechos\] no texto, mas 1 marca/);
});

test('scene changes from beats carry over to the next line', async () => {
  const card: Scene = { type: 'card', variant: 'summary', title: 'Resumo', items: ['a', 'b'], shown: 1 };
  const useCase = build([voice('1', 30), voice('2', 30)]);
  const props = await useCase.run(project([
    { id: '1', text: 'Primeiro [segundo].', scene: card, beats: [{ shown: 2, pose: 'point' }] }, { id: '2', text: 'Viu?' },
  ]));
  assert.deepEqual(props.segments[0]!.beats[0]!.changes, { shown: 2, pose: 'point' });
  assert.deepEqual(props.segments[1]!.scene, { ...card, shown: 2 });
  assert.equal(props.segments[1]!.sceneKey, props.segments[0]!.sceneKey);
});

test('total frames = sum of the durations', async () => {
  const useCase = build([voice('1', 30), voice('2', 45)]);
  const props = await useCase.run(project([withScene('1', 'Oi.'), { id: '2', text: 'Tudo bem?' }]));
  const [first, second] = props.segments;
  assert.equal(first!.lineDuration, 30);
  assert.equal(first!.totalDuration, 30 + BREATHER);
  assert.equal(second!.start, 30 + BREATHER);
  assert.equal(props.totalFrames, first!.totalDuration + second!.totalDuration);
});

test('the line duration is the envelope length, not the duration rounded up', async () => {
  const useCase = build([voice('1', 30)]);
  const props = await useCase.run(project([withScene('1', 'Oi.')]));
  assert.equal(props.segments[0]!.lineDuration, 30);
});

test('new code on screen gets a reading hold; the line that inherits the code does not', async () => {
  const lines = [...Array(10).keys()].map((number) => `linha ${number}`);
  const code: Scene = { type: 'code', title: 'cupom.ts', lines: [...lines, '', '  '], added: [2] };
  const useCase = build([voice('1', 30), voice('2', 30)]);
  const props = await useCase.run(project([{ id: '1', text: 'Veja.', scene: code }, { id: '2', text: 'Viu?' }]));
  // 10 lines with text × 0.35 s = 3.5 → 4 s (minimum 4, maximum 9) + 1 s for having added lines
  assert.deepEqual(props.segments[0]!.holdAfter, { seconds: 5, label: 'Leia o código' });
  assert.equal(props.segments[0]!.totalDuration, 30 + 150 + BREATHER);
  assert.equal(props.segments[1]!.holdAfter, undefined);
  assert.equal(props.segments[1]!.totalDuration, 30 + BREATHER);
});

test('an explicit holdAfter adds frames, keeps the label and ticks every second', async () => {
  const useCase = build([voice('1', 30)]);
  const props = await useCase.run(project([withScene('1', 'Pense.', { holdAfter: { seconds: 2, label: 'Pense' } })]));
  assert.deepEqual(props.segments[0]!.holdAfter, { seconds: 2, label: 'Pense' });
  assert.equal(props.segments[0]!.totalDuration, 30 + 60 + BREATHER);
  assert.deepEqual(props.soundEffects, [{ frame: 30, sound: 'tick' }, { frame: 60, sound: 'tick' }]);
});

test('sound effects of the line, the beats and the scene change go in absolute frames', async () => {
  const useCase = build([voice('1', 30), voice('2', 75, { words: COUPON_WORDS })]);
  const card: Scene = { type: 'card', variant: 'summary', title: 'Resumo', items: ['a'] };
  const props = await useCase.run(project([
    withScene('1', 'Oi.', { sfx: 'pop' }),
    { id: '2', text: COUPON, scene: card, beats: [{ sfx: 'ding' }, {}] },
  ]));
  const start = 30 + BREATHER;
  assert.deepEqual(props.soundEffects, [
    { frame: 0, sound: 'pop' }, { frame: start, sound: 'whoosh' }, { frame: start + 18, sound: 'ding' },
  ]);
});

test('the narrator speaks without a body state', async () => {
  const useCase = build([voice('1', 30)]);
  const props = await useCase.run(project([withScene('1', 'Era uma vez.', { speaker: 'narrator', reaction: { expression: 'surprised' } })]));
  const states = props.segments[0]!.states;
  assert.ok(!('narrator' in states));
  assert.deepEqual(states.ana, { pose: 'neutral', expression: 'surprised', look: 'other' });
  assert.deepEqual(states.teo, { pose: 'neutral', expression: 'surprised', look: 'other' });
});

test('the speaker uses the line pose, expression and look; listeners use the reaction or the default', async () => {
  const useCase = build([voice('1', 30), voice('2', 30)]);
  const props = await useCase.run(project([
    withScene('1', 'Oi.', { pose: 'wave', reaction: { pose: 'think' } }), { id: '2', text: 'Olá.', speaker: 'teo', look: 'camera' },
  ]));
  assert.deepEqual(props.segments[0]!.states, {
    ana: { pose: 'wave', expression: 'happy', look: 'content' }, teo: { pose: 'think', expression: 'neutral', look: 'other' },
  });
  assert.deepEqual(props.segments[1]!.states.teo, { pose: 'neutral', expression: 'neutral', look: 'camera' });
});

test('missing audio lists the pending lines', async () => {
  const useCase = build([voice('1', 30)]);
  const withoutAudio = project([withScene('1', 'Oi.'), { id: '2', text: 'Dois.' }, { id: '3', text: 'Três.' }]);
  await assert.rejects(useCase.run(withoutAudio), /falas sem áudio: 2, 3/);
});

test('the props are plain JSON: a JSON round trip gives the same object', async () => {
  const useCase = build([voice('1', 75, { words: COUPON_WORDS }), voice('2', 30)]);
  const props = await useCase.run(project([
    withScene('1', COUPON, { beats: [{ shown: 1 }, { sfx: 'pop' }], holdAfter: { seconds: 1, label: 'Pense' } }),
    { id: '2', text: 'Fim.', speaker: 'narrator' },
  ]));
  assert.deepEqual(JSON.parse(JSON.stringify(props)), props);
});

test('the project profile and the cast go in the props', async () => {
  const useCase = build([voice('1', 30)]);
  const props = await useCase.run(project([withScene('1', 'Oi.')]));
  const { fps, width, height, language, format, captionStyle, title: videoTitle, chapters, cast } = props;
  assert.equal('brand' in props, false);
  assert.deepEqual({ fps, width, height, language, format, captionStyle, title: videoTitle, chapters, cast }, {
    fps: 30, width: 1080, height: 1920, language: 'pt-BR', format: 'lesson', captionStyle: 'words', title: 'Cupons', chapters: ['Abertura'],
    cast: [
      { id: 'ana', name: 'Ana', rig: 'test', parameters: { skin: '#aa8866' }, defaultExpression: 'happy' },
      { id: 'teo', name: 'Téo', rig: 'test', parameters: {}, defaultExpression: 'neutral' },
      { id: 'narrator', name: 'Narrador', parameters: {}, defaultExpression: 'neutral' },
    ],
  });
  assert.equal(props.segments[0]!.audio, 'voice/1.wav');
  assert.equal(props.segments[0]!.visemes, 'A'.repeat(30));
});
