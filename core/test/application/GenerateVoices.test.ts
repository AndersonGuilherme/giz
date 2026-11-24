import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { GenerateVoices } from '../../src/application/use-cases/GenerateVoices.ts';
import { Cast } from '../../src/domain/cast/Cast.ts';
import { Character } from '../../src/domain/cast/Character.ts';
import { Project } from '../../src/domain/project/Project.ts';
import { Chapter } from '../../src/domain/script/Chapter.ts';
import { Line } from '../../src/domain/script/Line.ts';
import { Lines } from '../../src/domain/script/Lines.ts';
import { Script } from '../../src/domain/script/Script.ts';
import { CharacterId } from '../../src/domain/values/CharacterId.ts';
import { Language } from '../../src/domain/values/Language.ts';
import { AspectRatio } from '../../src/domain/values/AspectRatio.ts';
import { FakeAligner } from '../doubles/FakeAligner.ts';
import { InMemoryVoiceStore } from '../doubles/InMemoryVoiceStore.ts';
import { FakePhonemizer } from '../doubles/FakePhonemizer.ts';
import { FakeVoice } from '../doubles/FakeVoice.ts';

type Options = { texts?: string[]; style?: string; provider?: 'qwen' | 'recording'; model?: '0.6b' | '1.7b'; pronunciation?: string };

function project({ texts = ['Oi, eu sou a Ana.', 'Hoje vamos aprender juntos.'], style, provider = 'qwen', model, pronunciation }: Options = {}): Project {
  const ana = CharacterId.of('ana');
  const character = Character.of(ana, {
    name: 'Ana', rig: 'test', parameters: {}, voice: { id: 'vivian', style }, defaultExpression: 'neutral',
  });
  const lines = texts.map((text, i) => Line.of(ana, { id: String(i + 1), chapter: Chapter.of(1), text, pronunciation: i === 0 ? pronunciation : undefined }));
  return Project.of(
    { title: 'T', format: 'story', language: Language.PORTUGUESE, aspect: AspectRatio.VERTICAL, captionStyle: 'words', voice: { provider, model } },
    { cast: Cast.of([character]), script: Script.of(['Abertura'], Lines.of(lines)), warnings: [] },
  );
}

function build() {
  const voice = new FakeVoice();
  const store = new InMemoryVoiceStore();
  const aligner = new FakeAligner();
  const useCase = new GenerateVoices({ voice, phonemizer: new FakePhonemizer(), store, aligner });
  return { voice, store, aligner, useCase };
}

test('a line with the same hash is not generated again', async () => {
  const { voice, useCase } = build();
  await useCase.run(project());
  await useCase.run(project());
  assert.equal(voice.calls, 2);
});

test('changing the text of one line regenerates only that line', async () => {
  const { voice, useCase } = build();
  await useCase.run(project());
  const report = await useCase.run(project({ texts: ['Oi, eu sou a Ana.', 'Hoje vamos aprender muito.'] }));
  assert.equal(voice.calls, 3);
  assert.deepEqual(report, { generated: ['2'], skipped: ['1'] });
});

test('changing style, pronunciation or provider regenerates', async () => {
  const { voice, useCase } = build();
  await useCase.run(project());
  await useCase.run(project({ style: 'excited' }));
  await useCase.run(project({ style: 'excited', pronunciation: 'Oi, eu sou a Âna.' }));
  await useCase.run(project({ style: 'excited', pronunciation: 'Oi, eu sou a Âna.', provider: 'recording' }));
  assert.equal(voice.calls, 2 + 2 + 1 + 2);
});

test('changing the voice model regenerates every line (0.6b and 1.7b sound different)', async () => {
  const { voice, useCase } = build();
  await useCase.run(project({ model: '0.6b' }));
  const report = await useCase.run(project({ model: '1.7b' }));
  assert.deepEqual(report.generated, ['1', '2']);
  await useCase.run(project({ model: '1.7b' }));
  assert.equal(voice.calls, 4);
});

test('a new take of a recording (another fingerprint from the provider) regenerates only that line', async () => {
  const { voice, useCase } = build();
  voice.fingerprints = { '1': 'take-1', '2': 'take-1' };
  await useCase.run(project({ provider: 'recording' }));
  voice.fingerprints = { '1': 'take-2', '2': 'take-1' };
  const report = await useCase.run(project({ provider: 'recording' }));
  assert.deepEqual(report, { generated: ['1'], skipped: ['2'] });
});

test('the request uses the pronunciation, voice, style and language', async () => {
  const { voice, useCase } = build();
  await useCase.run(project({ style: 'calma', pronunciation: 'Ói, eu sou a Âna.' }));
  assert.deepEqual(voice.requests[0], { lineId: '1', text: 'Ói, eu sou a Âna.', voice: 'vivian', style: 'calma', language: Language.PORTUGUESE });
});

test('the record has one viseme per frame and X in silence', async () => {
  const { store, useCase } = build();
  await useCase.run(project());
  const record = await store.read('1');
  assert.equal(record.visemes.length, record.envelope.length);
  assert.equal(record.visemes[0], 'X');
  assert.equal(record.visemes.at(-1), 'X');
  assert.match(record.visemes, /^X+M[MA]+A+X+$/);
  assert.equal(record.envelope.length, record.visemes.length);
  assert.equal(record.file, 'voice/1.wav');
  assert.match(record.hash, /^[0-9a-f]{40}$/);
});

test('the saved audio is already trimmed: only 0.04 s of silence is left at the ends', async () => {
  const { store, useCase } = build();
  await useCase.run(project());
  const record = await store.read('1');
  const expected = 0.2 + 0.2 + 0.05 * 'Oi, eu sou a Ana.'.length + 2 * 0.04;
  assert.ok(Math.abs(record.durationSeconds - expected) < 0.002, `duração ${record.durationSeconds}`);
});

test('progress is reported for every line', async () => {
  const { useCase } = build();
  const warnings: unknown[] = [];
  await useCase.run(project(), (progress) => warnings.push(progress));
  await useCase.run(project(), (progress) => warnings.push(progress));
  assert.deepEqual(warnings, [
    { done: 1, total: 2, lineId: '1', generated: true },
    { done: 2, total: 2, lineId: '2', generated: true },
    { done: 1, total: 2, lineId: '1', generated: false },
    { done: 2, total: 2, lineId: '2', generated: false },
  ]);
});

test('the record has the time of each word of the script text (not of the pronunciation)', async () => {
  const { store, aligner, useCase } = build();
  await useCase.run(project({ pronunciation: 'Ói, eu sou a Âna.' }));
  const record = await store.read('1');
  assert.deepEqual(aligner.texts, ['Oi, eu sou a Ana.', 'Hoje vamos aprender juntos.']);
  assert.deepEqual(record.words?.map((p) => p.text), ['Oi,', 'eu', 'sou', 'a', 'Ana.']);
  assert.ok(record.words!.at(-1)!.end <= record.durationSeconds + 1e-9);
});

test('a line with [span] beats sends the voice its text without brackets, and the hash follows the spoken text', async () => {
  const { voice, store, useCase } = build();
  await useCase.run(project({ texts: ['O [bug] voltou.'] }));
  assert.equal(voice.requests[0]?.text, 'O bug voltou.');
  const first = await store.read('1');
  await useCase.run(project({ texts: ['O [bug] voltou.'], pronunciation: 'O [bãg] voltou.' }));
  assert.equal(voice.requests[1]?.text, 'O bãg voltou.');
  assert.notEqual((await store.read('1')).hash, first.hash);
});

test('a line whose spoken text did not change keeps its hash: bracket-free lines are not re-recorded by the bracket fix', async () => {
  const { store, voice, useCase } = build();
  await useCase.run(project({ texts: ['Oi, eu sou a Ana.'] }));
  // The hash before the fix: text | pronunciation (the text itself) | voice | style | language | provider. Without a
  // model and a fingerprint (a recording), nothing is added to it.
  const before = createHash('sha1').update(['Oi, eu sou a Ana.', 'Oi, eu sou a Ana.', 'vivian', '', 'pt-BR', 'qwen'].join('|')).digest('hex');
  assert.equal((await store.read('1')).hash, before);
  await useCase.run(project({ texts: ['Oi, eu sou a Ana.'] }));
  assert.equal(voice.calls, 1, 'the same spoken text is skipped');
});
