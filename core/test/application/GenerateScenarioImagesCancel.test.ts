import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { GeneratedImage, ImageRequest } from '../../src/application/ports/ImageProvider.ts';
import { GenerateScenarioImages } from '../../src/application/use-cases/images/GenerateScenarioImages.ts';
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
import { FakeImageProvider } from '../doubles/FakeImageProvider.ts';
import { InMemoryScenarioImageStore } from '../doubles/InMemoryScenarioImageStore.ts';

function project(): Project {
  const ana = CharacterId.of('ana');
  const character = Character.of(ana, { name: 'Ana', rig: 'test', parameters: {}, voice: { id: 'vivian' }, defaultExpression: 'neutral' });
  const lines = ['uma praça', 'um laboratório'].map((prompt, i) => {
    const scene = { type: 'scenario' as const, background: { generate: { prompt } }, characters: [] };
    return Line.of(ana, { id: String(i + 1), chapter: Chapter.of(1), text: 'Oi.', scene });
  });
  return Project.of(
    { title: 'T', format: 'story', language: Language.PORTUGUESE, aspect: AspectRatio.VERTICAL, voice: { provider: 'qwen' } },
    { cast: Cast.of([character]), script: Script.of(['Abertura'], Lines.of(lines)), warnings: [] },
  );
}

// Aborts while the (paid) call is in flight: its answer must be thrown away, never saved nor linked.
class AbortingProvider extends FakeImageProvider {
  readonly #controller: AbortController;

  constructor(controller: AbortController) {
    super();
    this.#controller = controller;
  }

  override async generate(request: ImageRequest): Promise<GeneratedImage> {
    this.#controller.abort();
    return super.generate(request);
  }
}

test('a cancel while an image is being made: nothing is saved nor linked, the next scene is never asked for', async () => {
  const controller = new AbortController();
  const images = new AbortingProvider(controller);
  const store = new InMemoryScenarioImageStore();
  const useCase = new GenerateScenarioImages({ images, store });
  await assert.rejects(useCase.run(project(), { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(images.requests.length, 1);
  assert.equal(store.savedHash('1'), undefined);
  assert.deepEqual(store.linked, []);
});

test('an already aborted signal calls nothing', async () => {
  const images = new FakeImageProvider();
  const useCase = new GenerateScenarioImages({ images, store: new InMemoryScenarioImageStore() });
  await assert.rejects(useCase.run(project(), { only: '2', signal: AbortSignal.abort() }), { name: 'AbortError' });
  assert.equal(images.requests.length, 0);
});
