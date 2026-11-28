import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { GenerateScenarioImages, type ImageProgress } from '../../src/application/use-cases/images/GenerateScenarioImages.ts';
import { ScenarioImageError } from '../../src/application/use-cases/images/ScenarioImageError.ts';
import { Cast } from '../../src/domain/cast/Cast.ts';
import { Character } from '../../src/domain/cast/Character.ts';
import { Project } from '../../src/domain/project/Project.ts';
import type { ImageStyle } from '../../src/domain/scenario/ImageStyle.ts';
import { scenarioImagePrompt } from '../../src/domain/scenario/ScenarioImagePrompt.ts';
import { Chapter } from '../../src/domain/script/Chapter.ts';
import { Line } from '../../src/domain/script/Line.ts';
import { Lines } from '../../src/domain/script/Lines.ts';
import type { Background } from '../../src/domain/script/Scene.ts';
import { Script } from '../../src/domain/script/Script.ts';
import { AspectRatio } from '../../src/domain/values/AspectRatio.ts';
import { CharacterId } from '../../src/domain/values/CharacterId.ts';
import { Language } from '../../src/domain/values/Language.ts';
import { FakeImageProvider } from '../doubles/FakeImageProvider.ts';
import { InMemoryScenarioImageStore } from '../doubles/InMemoryScenarioImageStore.ts';

type Options = { aspect?: AspectRatio; style?: ImageStyle; backgrounds?: Array<Background | undefined> };

const DEFAULT_BACKGROUNDS: Background[] = [
  { generate: { prompt: 'uma praça ao entardecer' } },
  { vector: 'room' },
  { generate: { prompt: 'um laboratório', style: 'chalk' }, image: 'scenes/3.png' },
];

function project({ aspect = AspectRatio.VERTICAL, style, backgrounds = DEFAULT_BACKGROUNDS }: Options = {}): Project {
  const ana = CharacterId.of('ana');
  const character = Character.of(ana, { name: 'Ana', rig: 'test', parameters: {}, voice: { id: 'vivian' }, defaultExpression: 'neutral' });
  const lines = backgrounds.map((background, i) => {
    const scene = background ? { type: 'scenario' as const, background, characters: [] } : undefined;
    return Line.of(ana, { id: String(i + 1), chapter: Chapter.of(1), text: 'Oi.', scene });
  });
  return Project.of(
    { title: 'T', format: 'story', language: Language.PORTUGUESE, aspect, voice: { provider: 'qwen' }, style },
    { cast: Cast.of([character]), script: Script.of(['Abertura'], Lines.of(lines)), warnings: [] },
  );
}

function build(images = new FakeImageProvider()) {
  const store = new InMemoryScenarioImageStore();
  return { images, store, generate: new GenerateScenarioImages({ images, store }) };
}

const STORY_WORDS = { format: 'story', style: 'words' } as const;
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

test('only the scenes with background.generate get an image; each prompt is the composed one, at the bleed size', async () => {
  const { images, store, generate } = build();
  const report = await generate.run(project());
  assert.deepEqual(report, { generated: ['1', '3'], kept: [], own: [] });
  assert.deepEqual(images.requests[0], {
    prompt: scenarioImagePrompt({ prompt: 'uma praça ao entardecer', style: 'painted-2d', aspect: AspectRatio.VERTICAL, caption: STORY_WORDS }),
    size: { width: 1216, height: 2160 },
  });
  assert.equal(images.requests[1]?.prompt, scenarioImagePrompt({ prompt: 'um laboratório', style: 'chalk', aspect: AspectRatio.VERTICAL, caption: STORY_WORDS }));
  assert.deepEqual([...store.saved.keys()], ['1', '3']);
  assert.deepEqual(store.saved.get('1')?.madeBy, { provider: 'fal', model: 'fake-flux' });
  assert.deepEqual(store.linked, ['1', '3']);
});

test('the project style applies to scenes without their own; a 16:9 project asks for 2160×1216', async () => {
  const { images, generate } = build();
  await generate.run(project({ aspect: AspectRatio.HORIZONTAL, style: 'watercolor' }));
  assert.equal(images.requests[0]?.prompt, scenarioImagePrompt({ prompt: 'uma praça ao entardecer', style: 'watercolor', aspect: AspectRatio.HORIZONTAL, caption: STORY_WORDS }));
  assert.match(images.requests[1]!.prompt, /chalk/);
  assert.deepEqual(images.requests[0]?.size, { width: 2160, height: 1216 });
});

test('the cache hash: prompt, style, aspect, provider and model', async () => {
  const { store, generate } = build();
  await generate.run(project());
  assert.equal(store.savedHash('1'), sha256('uma praça ao entardecer|painted-2d|9:16|fal|fake-flux'));
  assert.equal(store.savedHash('3'), sha256('um laboratório|chalk|9:16|fal|fake-flux'));
});

test('cache hit: a second run calls nothing and keeps (and links) every image', async () => {
  const { images, store, generate } = build();
  await generate.run(project());
  const progress: ImageProgress[] = [];
  const report = await generate.run(project(), {}, (step) => progress.push(step));
  assert.equal(images.requests.length, 2);
  assert.deepEqual(report, { generated: [], kept: ['1', '3'], own: [] });
  assert.deepEqual(progress, [
    { done: 1, total: 2, lineId: '1', status: 'current' },
    { done: 2, total: 2, lineId: '3', status: 'current' },
  ]);
  assert.deepEqual(store.linked, ['1', '3', '1', '3']);
});

test('cache miss: a changed prompt, style, aspect or model makes only the affected images again', async () => {
  const { images, store, generate } = build();
  await generate.run(project());
  const changed = [{ generate: { prompt: 'uma praça à noite' } }, DEFAULT_BACKGROUNDS[1], DEFAULT_BACKGROUNDS[2]];
  assert.deepEqual(await generate.run(project({ backgrounds: changed })), { generated: ['1'], kept: ['3'], own: [] });
  assert.deepEqual(await generate.run(project({ backgrounds: changed, style: 'flat-vector' })), { generated: ['1'], kept: ['3'], own: [] });
  assert.deepEqual(await generate.run(project({ backgrounds: changed, style: 'flat-vector', aspect: AspectRatio.HORIZONTAL })), { generated: ['1', '3'], kept: [], own: [] });
  const other = new GenerateScenarioImages({ images: new FakeImageProvider({ provider: 'openai', model: 'gpt-x' }), store });
  assert.deepEqual(await other.run(project({ backgrounds: changed, style: 'flat-vector', aspect: AspectRatio.HORIZONTAL })), { generated: ['1', '3'], kept: [], own: [] });
  assert.equal(images.requests.length, 6);
});

test('--force <lineId> makes that one image again (and only it); --only keeps it when current', async () => {
  const { images, generate } = build();
  await generate.run(project());
  assert.deepEqual(await generate.run(project(), { only: '3' }), { generated: [], kept: ['3'], own: [] });
  assert.deepEqual(await generate.run(project(), { force: '3' }), { generated: ['3'], kept: [], own: [] });
  assert.equal(images.requests.length, 3);
});

test('--only or --force naming a line without background.generate is a readable error', async () => {
  const { generate } = build();
  await assert.rejects(generate.run(project(), { force: '2' }), (error: Error) =>
    error instanceof ScenarioImageError && /a fala "2" não tem cenário a gerar \(falta background\.generate/.test(error.message));
  await assert.rejects(generate.estimate(project(), { only: '9' }), /a fala "9" não tem cenário a gerar/);
});

test('the estimate counts only the images still to make, before any call', async () => {
  const { images, generate } = build();
  const first = await generate.estimate(project());
  assert.equal(first.pending, 2);
  assert.equal(first.current, 0);
  assert.ok(Math.abs(first.cost.dollars()! - 0.2) < 1e-12);
  assert.equal(images.requests.length, 0);
  await generate.run(project());
  const second = await generate.estimate(project());
  assert.deepEqual({ pending: second.pending, current: second.current, own: second.own, dollars: second.cost.dollars() }, { pending: 0, current: 2, own: 0, dollars: 0 });
  assert.equal((await generate.estimate(project(), { force: '1' })).pending, 1);
});

test('a project without scenes to generate makes nothing and costs nothing', async () => {
  const { images, generate } = build();
  const plain = project({ backgrounds: [{ vector: 'room' }, undefined] });
  assert.deepEqual(await generate.run(plain), { generated: [], kept: [], own: [] });
  assert.equal((await generate.estimate(plain)).cost.dollars(), 0);
  assert.equal(images.requests.length, 0);
});

test('an uploaded image wins: a scene pointing elsewhere is never generated nor linked, even with --force', async () => {
  const { images, store, generate } = build();
  const backgrounds: Background[] = [{ generate: { prompt: 'uma praça' }, image: 'images/minha-praca.png' }, { generate: { prompt: 'um lab' } }];
  const progress: ImageProgress[] = [];
  assert.deepEqual(await generate.run(project({ backgrounds }), {}, (step) => progress.push(step)), { generated: ['2'], kept: [], own: ['1'] });
  assert.deepEqual(progress.map((step) => step.status), ['own', 'pending']);
  assert.equal(images.requests.length, 1);
  assert.deepEqual(store.linked, ['2']);
  assert.deepEqual(await generate.run(project({ backgrounds }), { force: '1' }), { generated: [], kept: [], own: ['1'] });
  const estimate = await generate.estimate(project({ backgrounds }));
  assert.deepEqual({ pending: estimate.pending, own: estimate.own }, { pending: 0, own: 1 });
  assert.equal(images.requests.length, 1);
});

test('a scenes/<id>.png that gizzy images did not make is refused before any paid call (typed error)', async () => {
  const { images, store, generate } = build();
  store.foreign.add('3');
  await assert.rejects(generate.estimate(project()), ScenarioImageError);
  await assert.rejects(generate.run(project()), (error: Error) =>
    error instanceof ScenarioImageError && /scenes\/3\.png já existe\(m\) e não foi\(ram\) feito\(s\) pelo gizzy images/.test(error.message));
  assert.equal(images.requests.length, 0);
  assert.equal(store.saved.size, 0);
});
