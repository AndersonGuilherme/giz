import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CheckProject } from '../../src/application/use-cases/CheckProject.ts';
import { GenerateScript } from '../../src/application/use-cases/script/GenerateScript.ts';
import { CAPTION_LAYOUTS } from '../../src/domain/caption/captionLayouts.ts';
import { Idea } from '../../src/domain/idea/Idea.ts';
import { createLayoutRegistry } from '../../src/domain/layout/defaultLayoutRegistry.ts';
import { DiskScriptMaterials } from '../../src/infrastructure/ai/script/DiskScriptMaterials.ts';
import { DiskProjectFolder } from '../../src/infrastructure/disk/DiskProjectFolder.ts';
import { DiskProjectRepository } from '../../src/infrastructure/disk/DiskProjectRepository.ts';
import { RigCatalogFromRegistry } from '../../src/presentation/rigs/RigCatalogFromRegistry.ts';
import { rigRegistry } from '../../src/presentation/rigs/rigRegistry.ts';
import { FakeTextProvider } from '../doubles/FakeTextProvider.ts';

const CORE = fileURLToPath(new URL('../../', import.meta.url));
const CAST_FOLDERS = ['presets/present', 'presets/past', 'presets/future', 'presets/creatures', 'example'].map((folder) => join(CORE, 'casts', folder));
const materials = new DiskScriptMaterials({ formats: join(CORE, 'formats'), casts: CAST_FOLDERS, scenes: join(CORE, 'presets', 'scenes') });
const rigs = new RigCatalogFromRegistry(rigRegistry);
const repository = new DiskProjectRepository({ catalog: rigs });
const check = new CheckProject({ layouts: createLayoutRegistry(), captions: CAPTION_LAYOUTS, rigs });

const FIXTURES = join(CORE, 'test/fixtures/ai');
// A 30 s story idea and a valid answer for it: a narrator defined in the answer plus two presets.
const IDEA = JSON.parse(readFileSync(join(FIXTURES, 'story-idea.json'), 'utf8'));
const VALID = JSON.parse(readFileSync(join(FIXTURES, 'story-answer.json'), 'utf8'));
const NARRATOR = VALID.cast[0];

// The same answer with a speaker outside the cast and a pose that does not exist.
const INVALID = structuredClone(VALID);
INVALID.script.lines[2]!.speaker = 'zeca';
(INVALID.script.lines[1] as Record<string, unknown>).pose = 'dance';

function generator(answers: readonly unknown[], cut: readonly number[] = []) {
  const text = new FakeTextProvider(answers, cut);
  const generate = new GenerateScript({ text, materials, rigs, folder: new DiskProjectFolder(), repository, check });
  return { text, generate };
}

async function withFolder(use: (folder: string) => Promise<void>): Promise<void> {
  const parent = await mkdtemp(join(tmpdir(), 'giz-generate-'));
  try {
    await use(join(parent, 'projeto'));
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
}

const readJson = async (folder: string, file: string) => JSON.parse(await readFile(join(folder, file), 'utf8'));
const exists = (path: string) => access(path).then(() => true, () => false);

test('a valid first answer becomes a project folder that passes the check, after a single call', async () => {
  await withFolder(async (folder) => {
    const { text, generate } = generator([VALID]);
    const result = await generate.run(Idea.fromJson(IDEA), { folder });
    assert.equal(text.requests.length, 1);
    assert.equal(result.repairs, 0);
    assert.deepEqual(result.usage, { calls: 1, inputTokens: 1000, outputTokens: 200 });
    assert.deepEqual(await readJson(folder, 'project.json'), {
      version: 2, title: 'E se os gatos falassem?', format: 'story', language: 'pt-BR', aspect: '9:16',
      cast: ['narrator', 'bia', 'caio'], voice: { provider: 'qwen' },
    });
    assert.deepEqual(await readJson(folder, 'script.json'), VALID.script);
    assert.deepEqual(await readJson(folder, 'idea.json'), IDEA);
    // The preset is copied whole; it has no voice style, so it gets the language's default.
    const preset = JSON.parse(await readFile(join(CORE, 'casts/presets/present/bia.json'), 'utf8'));
    assert.deepEqual(await readJson(folder, 'cast/bia.json'), { ...preset, voice: { ...preset.voice, style: 'Fale em português do Brasil, com sotaque brasileiro, de forma natural' } });
    assert.deepEqual(await readJson(folder, 'cast/narrator.json'), NARRATOR);
    assert.deepEqual(check.run(await repository.load(folder)).errors, []);
  });
});

test('an invalid first answer gets its readable errors back and the corrected one is saved', async () => {
  await withFolder(async (folder) => {
    const { text, generate } = generator([INVALID, VALID]);
    const result = await generate.run(Idea.fromJson(IDEA), { folder });
    assert.equal(text.requests.length, 2);
    assert.equal(result.repairs, 1);
    assert.deepEqual(result.usage, { calls: 2, inputTokens: 2000, outputTokens: 400 });
    const repair = text.requests[1]!;
    assert.ok(repair.prompt.startsWith(text.requests[0]!.prompt), 'the repair keeps the whole first prompt');
    assert.ok(repair.prompt.includes(`# Your previous answer\n<previous-answer>\n${JSON.stringify(INVALID)}\n</previous-answer>`));
    assert.equal(repair.stablePrefix, text.requests[0]!.prompt.length, 'the first prompt is the cached prefix of the repair');
    assert.equal(repair.maxTokens, 11_000, 'an answer that was not cut keeps the limit');
    assert.match(repair.prompt, /- script\.json › lines\[1\]\.pose: "dance" inválido \(use neutral, explain/);
    assert.match(repair.prompt, /Answer again with the whole corrected JSON object\.$/);
    assert.equal(repair.system, text.requests[0]!.system);
    assert.deepEqual(await readJson(folder, 'script.json'), VALID.script);
  });
});

test('the cast and speaker problems found after the schema also go back to the AI', async () => {
  await withFolder(async (folder) => {
    const speakerOnly = structuredClone(VALID);
    speakerOnly.script.lines[2]!.speaker = 'zeca';
    const { text, generate } = generator([speakerOnly, '```json\n' + JSON.stringify(VALID) + '\n```']);
    await generate.run(Idea.fromJson(IDEA), { folder });
    assert.match(text.requests[1]!.prompt, /- script\.json › lines\[2\]\.speaker: .*zeca/);
    assert.equal(text.requests.length, 2, 'a fenced JSON answer is accepted');
  });
});

test('still invalid after 3 repair rounds: a readable pt-BR error, 4 calls, the last answer kept beside the folder, the folder untouched', async () => {
  await withFolder(async (folder) => {
    const { text, generate } = generator(['isto não é JSON', { project: {}, cast: ['ninguem'], script: {} }, INVALID]);
    await assert.rejects(generate.run(Idea.fromJson(IDEA), { folder }), (error: Error) => {
      assert.equal(error.name, 'ScriptGenerationError');
      assert.match(error.message, /^a IA não chegou a um roteiro válido depois de 3 rodada\(s\) de correção\. Problemas da última resposta:\n- /);
      assert.match(error.message, /lines\[1\]\.pose: "dance" inválido/);
      assert.ok(error.message.endsWith(`a última resposta e a lista de problemas ficaram em ${folder}.draft; a pasta do projeto não foi alterada`), error.message);
      assert.doesNotMatch(error.message, /at .*\.ts:\d+/);
      return true;
    });
    assert.equal(text.requests.length, 4);
    assert.match(text.requests[1]!.prompt, /- a resposta não é um JSON válido/);
    assert.match(text.requests[2]!.prompt, /- cast\[0\]: personagem pronto "ninguem" não existe/);
    assert.match(text.requests[2]!.prompt, /- cast: a ideia pede o personagem "bia", que ficou de fora/);
    assert.equal(await exists(folder), false);
    assert.deepEqual(await readJson(`${folder}.draft`, 'answer.json'), INVALID);
    const problems = await readFile(join(`${folder}.draft`, 'problems.txt'), 'utf8');
    assert.match(problems, /^script\.json › lines\[1\]\.pose: "dance" inválido/m);
  });
});

test('the prompt carries the rules, the idea, the format guide, the answer schema and the presets', async () => {
  await withFolder(async (folder) => {
    const { text, generate } = generator([VALID]);
    await generate.run(Idea.fromJson(IDEA), { folder });
    const [{ system, prompt, maxTokens, json }] = text.requests as [typeof text.requests[0]];
    assert.match(system, /single JSON object/);
    assert.match(system, /Never imitate, copy or reference any specific existing video, channel, creator/);
    assert.match(system, /Brazilian Portuguese \(pt-BR\)/);
    assert.equal(maxTokens, 11_000);
    assert.equal(json, true);
    const sections = ['# Idea', '# Format guide', '# Answer', '# Cast presets', '# Rigs and parameters', '# Voices:', '# Vector backgrounds:', '# Scene presets'];
    const positions = sections.map((section) => prompt.indexOf(section));
    assert.ok(positions.every((position) => position >= 0), JSON.stringify(positions));
    assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'the sections come in order');
    assert.match(prompt, /- target duration: 30 s \(about 54 words of speech in total\)/);
    assert.match(prompt, /- theme: E se os gatos acordassem falando\?/);
    assert.match(prompt, /- cast: use these cast presets: bia, caio/);
    assert.match(prompt, /- scenes: choose the backgrounds and scene presets that fit/);
    const guide = (await readFile(join(CORE, 'formats/story/guide.pt-BR.md'), 'utf8')).trim();
    // The guide goes between tags, its headings two levels down: they never read as the prompt's own sections.
    assert.ok(prompt.includes(`# Format guide\n<format-guide>\n${guide.replace(/^#/gm, '###')}\n</format-guide>`));
    assert.match(prompt, /^### Guia do formato história \(pt-BR\)$/m);
    assert.match(prompt, /^#### Estrutura$/m);
    assert.doesNotMatch(prompt, /^#{1,2} (Estrutura|Ritmo|Originalidade)/m);
    assert.equal(text.requests[0]!.stablePrefix, prompt.length);
    assert.match(prompt, /1,8 palavras por segundo/);
    assert.match(prompt, /\{"type":"object","properties":\{"project":/);
    assert.match(prompt, /"defaultExpression":\{"type":"string","enum":\["neutral","happy"/);
    assert.match(prompt, /- bia: Bia, streamer animada que narra a própria vida em voz alta \(rig giz, voice vivian\)/);
    assert.match(prompt, /- lia: Lia, mentora de tecnologia \(rig lia-style, voice vivian\)/);
    assert.match(prompt, /## rig "giz"\n- species: human \| zombie/);
    assert.match(prompt, /- eyeScale: number from 0\.8 to 1\.4 \(default 1\)/);
    assert.match(prompt, /# Voices: serena, vivian, uncle_fu/);
    assert.match(prompt, /# Vector backgrounds: room, street, field/);
    assert.match(prompt, /- castle-rain \(castelo sob chuva: Céu fechado sobre o castelo, chuva caindo e cores frias\.\): \{"type":"scenario","background":\{"vector":"medieval-castle"/);
  });
});

test('asked scenes narrow the scene presets; an English idea gets the English guide', async () => {
  await withFolder(async (folder) => {
    const { text, generate } = generator([VALID]);
    const idea = Idea.fromJson({ ...IDEA, language: 'en', cast: undefined, scenes: ['castle-rain', 'street'] });
    await generate.run(idea, { folder });
    const { system, prompt } = text.requests[0]!;
    assert.match(system, /English \(en\)/);
    assert.match(prompt, /- scenes: use these backgrounds or scene presets: castle-rain, street/);
    assert.match(prompt, /- castle-rain \(/);
    assert.doesNotMatch(prompt, /- cave-campfire \(/);
    assert.match(prompt, /2\.2 words per second/);
    assert.match(prompt, /- cast: choose from the cast presets below or create new characters/);
  });
});

test('an idea that asks for a preset that does not exist fails before any paid call', async () => {
  const { text, generate } = generator([VALID]);
  const idea = Idea.fromJson({ ...IDEA, cast: ['bia', 'zeca'], scenes: ['praia'] });
  await assert.rejects(generate.estimate(idea), { name: 'DomainError', message: /^ideia inválida:\n- cast\[1\]: "zeca" não existe \(use .*bia/ });
  await assert.rejects(generate.run(idea, { folder: '/nao/usada' }), /- scenes\[0\]: "praia" não existe \(use room, street/);
  assert.equal(text.requests.length, 0);
});

test('the estimate before the call: the first call, and the most with 3 repairs, each cut at a limit that grows', async () => {
  const { text, generate } = generator([VALID]);
  const { firstCall, maximum } = await generate.estimate(Idea.fromJson(IDEA));
  assert.equal(text.requests.length, 0, 'estimating calls nothing');
  // The fake prices one dollar per million characters of request and per million output tokens.
  const base = (firstCall.dollars() ?? 0) * 1_000_000 - 11_000;
  // Repair k resends the base plus the previous answer at its whole limit (4 characters per token), with a grown limit.
  const limits = [11_000, 16_500, 24_750, 37_125];
  const repairs = [1, 2, 3].map((round) => base + limits[round - 1]! * 4 + limits[round]!);
  const extra = (maximum.dollars() ?? 0) * 1_000_000 - base - 11_000 - repairs.reduce((sum, cost) => sum + cost, 0);
  assert.ok(extra > 0 && extra < 3 * 400, `the repair text: ${extra}`);
});

test('a cut answer is a problem of its own and the repair gets 1.5 times the room', async () => {
  await withFolder(async (folder) => {
    const cut = JSON.stringify(VALID).slice(0, 200);
    const { text, generate } = generator([cut, VALID], [0]);
    await generate.run(Idea.fromJson(IDEA), { folder });
    const repair = text.requests[1]!;
    assert.equal(repair.maxTokens, 16_500);
    assert.match(repair.prompt, /- a resposta foi cortada no limite de 11000 tokens de saída: responda com o JSON inteiro, mais enxuto\n- a resposta não é um JSON válido/);
  });
});

test('a character id that is not a valid id never becomes a path: it is a problem sent back', async () => {
  await withFolder(async (folder) => {
    const escape = structuredClone(VALID);
    escape.cast[0] = { ...NARRATOR, id: '../../fora' };
    const { text, generate } = generator([escape, VALID]);
    await generate.run(Idea.fromJson(IDEA), { folder });
    assert.match(text.requests[1]!.prompt, /- cast\[0\]\.id: id de personagem "\.\.\/\.\.\/fora" inválido/);
    assert.equal(await exists(join(folder, '..', 'fora.json')), false);
  });
});

test('a new rigged character with a parameter the rig does not have is a readable problem from the real loader', async () => {
  await withFolder(async (folder) => {
    const zeca = { id: 'zeca', name: 'Zeca', rig: 'giz', parameters: { outfit: 'pijama', skin: 'roxo' }, voice: { id: 'eric' }, defaultExpression: 'happy' };
    const answer = structuredClone(VALID);
    answer.cast.push(zeca);
    const { text, generate } = generator([answer, VALID]);
    await generate.run(Idea.fromJson(IDEA), { folder });
    assert.match(text.requests[1]!.prompt, /- cast\/zeca\.json › parameters\.outfit: .*pijama/);
    assert.match(text.requests[1]!.prompt, /- cast\/zeca\.json › parameters\.skin: .*roxo/);
  });
});

test('the JSON is found inside prose or a fence in the middle of the text', async () => {
  for (const answer of [`Claro! Aqui está o roteiro:\n${JSON.stringify(VALID)}\nEspero que goste.`, `Segue:\n\n\`\`\`json\n${JSON.stringify(VALID, null, 2)}\n\`\`\`\nQualquer coisa, me avise.`]) {
    await withFolder(async (folder) => {
      const { text, generate } = generator([answer]);
      await generate.run(Idea.fromJson(IDEA), { folder });
      assert.equal(text.requests.length, 1, answer.slice(0, 20));
    });
  }
});

test('an English project gets the English default style on presets without one', async () => {
  await withFolder(async (folder) => {
    const { generate } = generator([VALID]);
    await generate.run(Idea.fromJson({ ...IDEA, language: 'en' }), { folder });
    assert.equal((await readJson(folder, 'cast/caio.json')).voice.style, 'Speak in natural American English');
    assert.equal((await readJson(folder, 'cast/narrator.json')).voice.style, NARRATOR.voice.style, 'a character written by the AI is kept as it came');
  });
});

test('regenerating keeps the voice the project already had', async () => {
  await withFolder(async (folder) => {
    const { generate } = generator([VALID]);
    await generate.run(Idea.fromJson(IDEA), { folder, voice: { provider: 'qwen', model: '0.6b' } });
    assert.deepEqual((await readJson(folder, 'project.json')).voice, { provider: 'qwen', model: '0.6b' });
  });
});

test('each call is announced before it is made: call 1 of 4, then 2 of 4 for the repair', async () => {
  await withFolder(async (folder) => {
    const { generate } = generator([INVALID, VALID]);
    const calls: Array<[number, number]> = [];
    await generate.run(Idea.fromJson(IDEA), { folder, onCall: (call, most) => calls.push([call, most]) });
    assert.deepEqual(calls, [[1, 4], [2, 4]]);
  });
});

test('an aborted signal stops before the next call and never saves the folder', async () => {
  await withFolder(async (folder) => {
    const { text, generate } = generator([INVALID, VALID]);
    const controller = new AbortController();
    const run = generate.run(Idea.fromJson(IDEA), { folder, signal: controller.signal, onCall: (call) => (call === 2 ? controller.abort() : undefined) });
    await assert.rejects(run, { name: 'AbortError' });
    assert.equal(text.requests.length, 1);
    assert.equal(await exists(folder), false);
    assert.equal(await exists(`${folder}.draft`), false);
  });
});

test('an answer that arrives after the abort is not saved', async () => {
  await withFolder(async (folder) => {
    const controller = new AbortController();
    const text = new FakeTextProvider([VALID]);
    const late = { generate: async (request: Parameters<typeof text.generate>[0]) => { const answer = await text.generate(request); controller.abort(); return answer; }, estimate: text.estimate.bind(text) };
    const generate = new GenerateScript({ text: late, materials, rigs, folder: new DiskProjectFolder(), repository, check });
    await assert.rejects(generate.run(Idea.fromJson(IDEA), { folder, signal: controller.signal }), { name: 'AbortError' });
    assert.equal(await exists(folder), false);
  });
});

test('the signal goes down to the text provider with each call (it can stop the call in flight)', async () => {
  await withFolder(async (folder) => {
    const { text, generate } = generator([INVALID, VALID]);
    const controller = new AbortController();
    await generate.run(Idea.fromJson(IDEA), { folder, signal: controller.signal });
    assert.deepEqual(text.signals, [controller.signal, controller.signal]);
  });
});
