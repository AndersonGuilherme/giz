import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GenerateVoices, type Progress } from '../../src/application/use-cases/GenerateVoices.ts';
import { Cast } from '../../src/domain/cast/Cast.ts';
import { Character } from '../../src/domain/cast/Character.ts';
import { Project } from '../../src/domain/project/Project.ts';
import { Chapter } from '../../src/domain/script/Chapter.ts';
import { Line } from '../../src/domain/script/Line.ts';
import { Lines } from '../../src/domain/script/Lines.ts';
import { Script } from '../../src/domain/script/Script.ts';
import { AspectRatio } from '../../src/domain/values/AspectRatio.ts';
import { CharacterId } from '../../src/domain/values/CharacterId.ts';
import { Language } from '../../src/domain/values/Language.ts';
import { FakeAligner } from '../doubles/FakeAligner.ts';
import { FakePhonemizer } from '../doubles/FakePhonemizer.ts';
import { FakeVoice } from '../doubles/FakeVoice.ts';
import { InMemoryVoiceStore } from '../doubles/InMemoryVoiceStore.ts';

function project(texts = ['Oi.', 'Tudo bem?', 'Tchau.']): Project {
  const ana = CharacterId.of('ana');
  const character = Character.of(ana, { name: 'Ana', rig: 'test', parameters: {}, voice: { id: 'vivian' }, defaultExpression: 'neutral' });
  const lines = texts.map((text, i) => Line.of(ana, { id: String(i + 1), chapter: Chapter.of(1), text }));
  return Project.of(
    { title: 'T', format: 'story', language: Language.PORTUGUESE, aspect: AspectRatio.VERTICAL, voice: { provider: 'qwen' } },
    { cast: Cast.of([character]), script: Script.of(['Abertura'], Lines.of(lines)), warnings: [] },
  );
}

function build() {
  const voice = new FakeVoice();
  const useCase = new GenerateVoices({ voice, phonemizer: new FakePhonemizer(), store: new InMemoryVoiceStore(), aligner: new FakeAligner() });
  return { voice, useCase };
}

test('only: just the named lines are looked at (a current one is kept)', async () => {
  const { voice, useCase } = build();
  const progress: Progress[] = [];
  const report = await useCase.run(project(), (step) => progress.push(step), { only: ['2'] });
  assert.deepEqual(report, { generated: ['2'], skipped: [] });
  assert.deepEqual(progress, [{ done: 1, total: 1, lineId: '2', generated: true }]);
  const again = await useCase.run(project(), undefined, { only: ['2'] });
  assert.deepEqual(again, { generated: [], skipped: ['2'] });
  assert.equal(voice.calls, 1);
});

test('force: the named line is made again even when its hash is current', async () => {
  const { voice, useCase } = build();
  await useCase.run(project());
  const report = await useCase.run(project(), undefined, { only: ['3'], force: true });
  assert.deepEqual(report, { generated: ['3'], skipped: [] });
  assert.equal(voice.calls, 4);
});

test('only naming a line that does not exist is a readable error, before any call', async () => {
  const { voice, useCase } = build();
  await assert.rejects(useCase.run(project(), undefined, { only: ['9'] }), /fala "9" não existe/);
  assert.equal(voice.calls, 0);
});

test('a cancel stops before the next line: what was made is kept, nothing more is called', async () => {
  const { voice, useCase } = build();
  const controller = new AbortController();
  const run = useCase.run(project(), ({ done }) => (done === 1 ? controller.abort() : undefined), { signal: controller.signal });
  await assert.rejects(run, { name: 'AbortError' });
  assert.equal(voice.calls, 1);
  const rest = await useCase.run(project());
  assert.deepEqual(rest, { generated: ['2', '3'], skipped: ['1'] });
});
