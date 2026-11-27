import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ProjectError } from '../../../src/application/ports/ProjectError.ts';
import type { VoiceRequest } from '../../../src/application/ports/VoiceProvider.ts';
import type { CheckReport } from '../../../src/application/use-cases/CheckProject.ts';
import { GenerateScenarioImages } from '../../../src/application/use-cases/images/GenerateScenarioImages.ts';
import { GenerateVoices } from '../../../src/application/use-cases/GenerateVoices.ts';
import { EstimateCosts } from '../../../src/application/use-cases/status/EstimateCosts.ts';
import { ReadProjectStages } from '../../../src/application/use-cases/status/ReadProjectStages.ts';
import { CostEstimate } from '../../../src/domain/ai/CostEstimate.ts';
import { Cast } from '../../../src/domain/cast/Cast.ts';
import { Character } from '../../../src/domain/cast/Character.ts';
import type { Idea } from '../../../src/domain/idea/Idea.ts';
import { Project } from '../../../src/domain/project/Project.ts';
import { Chapter } from '../../../src/domain/script/Chapter.ts';
import { Line } from '../../../src/domain/script/Line.ts';
import { Lines } from '../../../src/domain/script/Lines.ts';
import type { Background } from '../../../src/domain/script/Scene.ts';
import { Script } from '../../../src/domain/script/Script.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { CharacterId } from '../../../src/domain/values/CharacterId.ts';
import { Language } from '../../../src/domain/values/Language.ts';
import { FakeAligner } from '../../doubles/FakeAligner.ts';
import { FakeImageProvider } from '../../doubles/FakeImageProvider.ts';
import { FakePhonemizer } from '../../doubles/FakePhonemizer.ts';
import { FakeProjectStateReader } from '../../doubles/FakeProjectStateReader.ts';
import { FakeVoice } from '../../doubles/FakeVoice.ts';
import { InMemoryScenarioImageStore } from '../../doubles/InMemoryScenarioImageStore.ts';
import { InMemoryVoiceStore } from '../../doubles/InMemoryVoiceStore.ts';

type Options = { texts?: string[]; prompts?: Array<string | undefined>; provider?: 'qwen' | 'elevenlabs' };

const TEXTS = ['Oi, eu sou a Ana.', 'Hoje vamos aprender.', 'Até logo.'];
const PROMPTS = ['uma praça', undefined, 'um laboratório'];

function project({ texts = TEXTS, prompts = PROMPTS, provider = 'qwen' }: Options = {}): Project {
  const ana = CharacterId.of('ana');
  const character = Character.of(ana, { name: 'Ana', rig: 'test', parameters: {}, voice: { id: 'vivian' }, defaultExpression: 'neutral' });
  const lines = texts.map((text, i) => {
    const prompt = prompts[i];
    const background: Background = prompt ? { generate: { prompt } } : { vector: 'room' };
    const scene = { type: 'scenario' as const, background, characters: [] };
    return Line.of(ana, { id: String(i + 1), chapter: Chapter.of(1), text, scene });
  });
  return Project.of(
    { title: 'T', format: 'story', language: Language.PORTUGUESE, aspect: AspectRatio.VERTICAL, captionStyle: 'words', voice: { provider } },
    { cast: Cast.of([character]), script: Script.of(['Abertura'], Lines.of(lines)), warnings: [] },
  );
}

/** A paid voice: one cent per character. */
class PricedVoice extends FakeVoice {
  estimate(request: VoiceRequest): CostEstimate {
    return CostEstimate.ofDollars(request.text.length / 100);
  }
}

const NO_ERRORS: CheckReport = { errors: [], warnings: [] };

function build(voice = new FakeVoice()) {
  const state = { project: project(), check: NO_ERRORS, loadError: undefined as Error | undefined };
  const reader = new FakeProjectStateReader();
  const voices = new InMemoryVoiceStore();
  const images = new FakeImageProvider();
  const scenarioImages = new InMemoryScenarioImageStore();
  const repository = { load: async () => { if (state.loadError) throw state.loadError; return state.project; } };
  const check = { run: () => state.check };
  const stages = new ReadProjectStages({ repository, check, reader, tools: () => ({ voice, voices, images, scenarioImages }) });
  const generateVoices = new GenerateVoices({ voice, phonemizer: new FakePhonemizer(), store: voices, aligner: new FakeAligner() });
  const generateImages = new GenerateScenarioImages({ images, store: scenarioImages });
  const makeAll = async () => { await generateVoices.run(state.project); await generateImages.run(state.project); };
  return { state, reader, stages, makeAll, voice };
}

const summary = (status: Awaited<ReturnType<ReadProjectStages['run']>>) =>
  Object.fromEntries(status.stages.each().map((report) => [report.stage, report.state]));

test('a fresh script: voices and images are ready (all missing), the video is ready', async () => {
  const { stages } = build();
  const status = await stages.run('/p');
  assert.deepEqual(summary(status), { idea: 'done', script: 'done', cast: 'done', scenarios: 'ready', voices: 'ready', video: 'ready' });
  assert.deepEqual(status.stages.of('voices').missing, ['1', '2', '3']);
  assert.deepEqual(status.stages.of('scenarios').missing, ['1', '3']);
});

test('after the voices and images are made (the same hashes as giz voice and giz images), they are done', async () => {
  const { stages, makeAll, reader } = build();
  await makeAll();
  reader.rendered = { made: true, olderThanInputs: false };
  assert.deepEqual(summary(await stages.run('/p')), { idea: 'done', script: 'done', cast: 'done', scenarios: 'done', voices: 'done', video: 'done' });
});

test('changing one line text marks only that line voice stale (and the video stale); the images stay done', async () => {
  const { state, stages, makeAll, reader } = build();
  await makeAll();
  reader.rendered = { made: true, olderThanInputs: false };
  state.project = project({ texts: ['Oi, eu sou a Ana.', 'Hoje vamos aprender juntos.', 'Até logo.'] });
  const status = await stages.run('/p');
  assert.deepEqual(status.stages.of('voices'), { stage: 'voices', state: 'stale', stale: ['2'], missing: [], problems: [] });
  assert.equal(status.stages.of('scenarios').state, 'done');
  assert.equal(status.stages.of('video').state, 'stale');
});

test('changing one image prompt marks only that scene stale; the voices stay done', async () => {
  const { state, stages, makeAll } = build();
  await makeAll();
  state.project = project({ prompts: ['uma praça', undefined, 'um laboratório à noite'] });
  const status = await stages.run('/p');
  assert.deepEqual([status.stages.of('scenarios').state, status.stages.of('scenarios').stale], ['stale', ['3']]);
  assert.equal(status.stages.of('voices').state, 'done');
});

test('check errors make the script stale with the line ids; a project that does not load lists its problems and nothing after', async () => {
  const { state, stages } = build();
  state.check = { errors: [{ line: '2', message: 'texto fora da área segura' }], warnings: [] };
  assert.deepEqual((await stages.run('/p')).stages.of('script').problems, ['fala 2: texto fora da área segura']);
  state.loadError = new ProjectError([{ file: 'script.json', path: 'lines[0].pose', message: '"dance" inválido' }]);
  const status = await stages.run('/p');
  assert.deepEqual(summary(status), { idea: 'done', script: 'stale', cast: 'empty', scenarios: 'empty', voices: 'empty', video: 'empty' });
  assert.deepEqual(status.stages.of('script').problems, ['script.json › lines[0].pose: "dance" inválido']);
  assert.equal(status.pending, undefined);
});

test('another load failure is not hidden as a stage', async () => {
  const { state, stages } = build();
  state.loadError = new Error('disco cheio');
  await assert.rejects(stages.run('/p'), /disco cheio/);
});

test('without script.json the project is not loaded: the script is ready with an idea, empty without', async () => {
  const { reader, stages } = build();
  reader.script = false;
  assert.equal((await stages.run('/p')).stages.of('script').state, 'ready');
  reader.idea = false;
  assert.equal((await stages.run('/p')).stages.of('script').state, 'empty');
});

const IDEA = JSON.parse(readFileSync(new URL('../../fixtures/ai/story-idea.json', import.meta.url), 'utf8')) as unknown;

function costs(maximum = CostEstimate.ofDollars(0.5), idea: unknown = IDEA) {
  const seen: unknown[] = [];
  const folder = { readIdea: async () => { if (idea instanceof Error) throw idea; return idea; } };
  const script = { estimate: async (value: Idea) => { seen.push(value); return { firstCall: CostEstimate.ofDollars(0.1), maximum }; } };
  return { seen, estimate: new EstimateCosts({ folder, script }) };
}

test('EstimateCosts: the free voice costs nothing; each missing or stale image is priced; a written script has no text cost', async () => {
  const { stages, makeAll, state } = build();
  await makeAll();
  state.project = project({ prompts: ['uma praça mudada', undefined, 'um laboratório'] });
  const result = await costs().estimate.run('/p', await stages.run('/p'));
  assert.equal(result.text, undefined);
  assert.deepEqual([result.images.count, result.images.cost.dollars()], [1, 0.1]);
  assert.deepEqual([result.voices.count, result.voices.cost.dollars()], [0, 0]);
  assert.equal(result.total.dollars(), 0.1);
});

test('EstimateCosts: a paid voice prices only the pending lines by their text', async () => {
  const { stages, makeAll, state } = build(new PricedVoice());
  state.project = project({ provider: 'elevenlabs' });
  await makeAll();
  state.project = project({ provider: 'elevenlabs', texts: ['Oi, eu sou a Ana.', 'Mudou.', 'Até logo.'] });
  const result = await costs().estimate.run('/p', await stages.run('/p'));
  assert.deepEqual([result.voices.count, result.voices.cost.dollars()], [1, 0.06]);
});

test('EstimateCosts: the script generation counts when there is no script yet or when asked, from idea.json', async () => {
  const { reader, stages } = build();
  const status = await stages.run('/p');
  const asked = costs();
  assert.equal((await asked.estimate.run('/p', status, { regenerateScript: true })).text?.cost.dollars(), 0.5);
  assert.equal((asked.seen[0] as Idea).targetSeconds(), 30);
  reader.script = false;
  const noScript = await costs().estimate.run('/p', await stages.run('/p'));
  assert.equal(noScript.text?.cost.dollars(), 0.5);
  assert.equal(noScript.images.cost.isKnown(), false, 'without a script the images are unknown, never zero');
  assert.equal(noScript.total.isKnown(), false);
});

test('EstimateCosts: without a valid idea.json the text cost is unknown, with the reason', async () => {
  const { reader, stages } = build();
  reader.script = false;
  const missing = await costs(undefined, new Error('idea.json: arquivo não encontrado')).estimate.run('/p', await stages.run('/p'));
  assert.equal(missing.text?.cost.isKnown(), false);
  assert.equal(missing.text?.problem, 'idea.json: arquivo não encontrado');
  const invalid = await costs(undefined, { format: 'podcast' }).estimate.run('/p', await stages.run('/p'));
  assert.match(invalid.text?.problem ?? '', /ideia inválida/);
});
