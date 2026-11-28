import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DiskProjectRepository } from '../../../src/infrastructure/disk/DiskProjectRepository.ts';
import { RigCatalogFromRegistry } from '../../../src/presentation/rigs/RigCatalogFromRegistry.ts';
import { rigRegistry } from '../../../src/presentation/rigs/rigRegistry.ts';
import { isQwenVoice } from '../../../src/infrastructure/voice/qwen/qwenModels.ts';

const PRESETS = fileURLToPath(new URL('../../../casts/presets', import.meta.url));
const ERAS = ['past', 'present', 'future'];
// The preset folders: one per era, plus the creatures.
const FOLDERS = [...ERAS, 'creatures'];

async function presetsOf(era: string): Promise<string[]> {
  return (await readdir(join(PRESETS, era))).filter((file) => file.endsWith('.json')).map((file) => file.replace(/\.json$/, ''));
}

// Each era's presets as the cast of one project, loaded with the production catalog (as `gizzy check` does).
async function loadEra(era: string) {
  const folder = await mkdtemp(join(tmpdir(), `gizzy-presets-${era}-`));
  try {
    const ids = await presetsOf(era);
    await cp(join(PRESETS, era), join(folder, 'cast'), { recursive: true });
    const project = { version: 2, title: 'Presets', format: 'story', language: 'pt-BR', aspect: '9:16', captionStyle: 'words', cast: ids, voice: { provider: 'qwen', model: '1.7b' } };
    const lines = ids.map((id, index) => ({ id: String(index + 1), chapter: 1, speaker: id, text: 'Oi!' }));
    await writeFile(join(folder, 'project.json'), JSON.stringify(project));
    await writeFile(join(folder, 'script.json'), JSON.stringify({ chapters: ['Elenco'], lines }));
    return { ids, cast: (await new DiskProjectRepository({ catalog: new RigCatalogFromRegistry(rigRegistry) }).load(folder)).cast() };
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}

test('every era (and the creatures) has at least 3 presets and each one loads with no error through the production catalog', async () => {
  for (const era of FOLDERS) {
    const { ids, cast } = await loadEra(era);
    assert.ok(ids.length >= 3, era);
    assert.deepEqual(cast.ids().sort(), [...ids].sort(), era);
  }
});

test('every preset is a Gizzy character with a name, a short personality and a Qwen voice', async () => {
  const files = (await Promise.all(FOLDERS.map(async (era) => (await presetsOf(era)).map((id) => join(PRESETS, era, `${id}.json`))))).flat();
  for (const file of files) {
    const json = JSON.parse(await readFile(file, 'utf8'));
    assert.equal(json.rig, 'gizzy', file);
    assert.ok(json.name.length > 0 && json.personality.length > 10 && json.personality.length < 90, file);
    assert.ok(isQwenVoice(json.voice.id), `${file}: ${json.voice.id}`);
  }
});

test('the presets mix skin tones, head shapes and voices', async () => {
  const all = await Promise.all(ERAS.map(async (era) => Promise.all((await presetsOf(era)).map(async (id) => JSON.parse(await readFile(join(PRESETS, era, `${id}.json`), 'utf8'))))));
  const characters = all.flat();
  assert.equal(new Set(characters.map(({ parameters }) => parameters.skin)).size, 6);
  assert.equal(new Set(characters.map(({ parameters }) => parameters.headShape)).size, 4);
  assert.ok(new Set(characters.map(({ voice }) => voice.id)).size >= 8);
});

test('each sheet lists every preset of its era (or the creatures) once (the props of the PresetSheet composition)', async () => {
  for (const era of FOLDERS) {
    const sheet = JSON.parse(await readFile(join(PRESETS, 'sheets', `${era}.json`), 'utf8'));
    assert.deepEqual([...sheet.characters].sort(), (await presetsOf(era)).map((id) => `${era}/${id}.json`).sort(), era);
  }
});

test('the creatures: every species but human, each a generic archetype with its own preset', async () => {
  const creatures = await Promise.all((await presetsOf('creatures')).map(async (id) => JSON.parse(await readFile(join(PRESETS, 'creatures', `${id}.json`), 'utf8'))));
  const species = creatures.map(({ parameters }) => parameters.species);
  assert.ok(creatures.length >= 8);
  assert.deepEqual([...new Set(species)].sort(), ['alien', 'ghost', 'mummy', 'robot', 'slime-monster', 'vampire', 'werewolf', 'zombie']);
  assert.ok(new Set(creatures.map(({ voice }) => voice.id)).size >= 7, 'varied voices');
});

test('Bru keeps an original trait: no echo of a famous film scene (a librarian ghost hushing people)', async () => {
  const bru = JSON.parse(await readFile(join(PRESETS, 'creatures', 'bru.json'), 'utf8'));
  assert.doesNotMatch(bru.personality, /bibliotec|silêncio|library|silence/i);
  assert.match(bru.personality, /geladeira/);
});
