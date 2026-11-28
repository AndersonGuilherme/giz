import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CheckProject } from '../../src/application/use-cases/CheckProject.ts';
import { StartScript } from '../../src/application/use-cases/script/StartScript.ts';
import { CAPTION_LAYOUTS } from '../../src/domain/caption/captionLayouts.ts';
import { Idea } from '../../src/domain/idea/Idea.ts';
import { createLayoutRegistry } from '../../src/domain/layout/defaultLayoutRegistry.ts';
import { DiskScriptMaterials } from '../../src/infrastructure/ai/script/DiskScriptMaterials.ts';
import { DiskProjectFolder } from '../../src/infrastructure/disk/DiskProjectFolder.ts';
import { DiskProjectRepository } from '../../src/infrastructure/disk/DiskProjectRepository.ts';
import { RigCatalogFromRegistry } from '../../src/presentation/rigs/RigCatalogFromRegistry.ts';
import { rigRegistry } from '../../src/presentation/rigs/rigRegistry.ts';

const CORE = fileURLToPath(new URL('../../', import.meta.url));
const CAST_FOLDERS = ['presets/present', 'presets/past', 'presets/future', 'presets/creatures', 'example'].map((folder) => join(CORE, 'casts', folder));
const materials = new DiskScriptMaterials({ formats: join(CORE, 'formats'), casts: CAST_FOLDERS, scenes: join(CORE, 'presets', 'scenes') });
const rigs = new RigCatalogFromRegistry(rigRegistry);
const repository = new DiskProjectRepository({ catalog: rigs });
const check = new CheckProject({ layouts: createLayoutRegistry(), captions: CAPTION_LAYOUTS, rigs });
const start = new StartScript({ materials, folder: new DiskProjectFolder() });

const STORY = { format: 'story', aspect: '9:16', targetSeconds: 30, theme: 'E se os gatos falassem?', audience: 'jovens', tone: 'engraçado', language: 'pt-BR', cast: ['bia', 'caio'], scenes: ['castle-rain'] };
const LESSON = { format: 'lesson', aspect: '16:9', targetSeconds: 120, theme: 'Testes automatizados', audience: 'devs', tone: 'leve', language: 'en', cast: ['lia', 'teo'] };

async function withFolder(use: (folder: string) => Promise<void>): Promise<void> {
  const parent = await mkdtemp(join(tmpdir(), 'gizzy-start-'));
  try {
    await use(join(parent, 'projeto'));
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
}

const readJson = async (folder: string, file: string) => JSON.parse(await readFile(join(folder, file), 'utf8'));

test('a story starts with one line on the chosen scene, the chosen cast on stage and a narrator, and passes the check', async () => {
  await withFolder(async (folder) => {
    await start.run(Idea.fromJson(STORY), { folder });
    const project = await readJson(folder, 'project.json');
    assert.deepEqual(project, { version: 2, title: 'E se os gatos falassem?', format: 'story', language: 'pt-BR', aspect: '9:16', cast: ['bia', 'caio', 'narrator'], voice: { provider: 'qwen' } });
    const script = await readJson(folder, 'script.json');
    assert.deepEqual(script.chapters, ['Começo']);
    assert.equal(script.lines.length, 1);
    const [line] = script.lines;
    assert.deepEqual([line.id, line.chapter, line.speaker, line.text], ['01', 1, 'bia', 'Escreva aqui a primeira fala.']);
    const preset = JSON.parse(await readFile(join(CORE, 'presets/scenes/castle-rain.json'), 'utf8'));
    assert.deepEqual(line.scene, { ...preset.scene, characters: [{ character: 'bia', position: 'left' }, { character: 'caio', position: 'right' }] });
    assert.equal((await readJson(folder, 'cast/narrator.json')).name, 'Narrador');
    assert.deepEqual(await readJson(folder, 'idea.json'), STORY);
    assert.deepEqual(check.run(await repository.load(folder)).errors, []);
  });
});

test('a story without a cast or scenes is the narrator in the room', async () => {
  await withFolder(async (folder) => {
    const idea = { ...STORY, cast: undefined, scenes: undefined };
    await start.run(Idea.fromJson(JSON.parse(JSON.stringify(idea))), { folder });
    const [line] = (await readJson(folder, 'script.json')).lines;
    assert.equal(line.speaker, 'narrator');
    assert.deepEqual(line.scene, { type: 'scenario', background: { vector: 'room' }, characters: [] });
    assert.deepEqual(check.run(await repository.load(folder)).errors, []);
  });
});

test('a lesson starts on its title scene, in the language of the idea, and passes the check', async () => {
  await withFolder(async (folder) => {
    await start.run(Idea.fromJson(LESSON), { folder });
    const script = await readJson(folder, 'script.json');
    assert.deepEqual(script.chapters, ['Beginning']);
    assert.deepEqual(script.lines[0].scene, { type: 'title', overline: '', title: 'Testes automatizados' });
    assert.equal(script.lines[0].speaker, 'lia');
    assert.equal(script.lines[0].text, 'Write the first line here.');
    assert.deepEqual(check.run(await repository.load(folder)).errors, []);
  });
});

test('an unknown preset is refused before anything is written', async () => {
  await withFolder(async (folder) => {
    await assert.rejects(start.run(Idea.fromJson({ ...STORY, cast: ['ninguem'] }), { folder }), /ideia inválida:[\s\S]*"ninguem" não existe/);
    await assert.rejects(access(folder));
  });
});
