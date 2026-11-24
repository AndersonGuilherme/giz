import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RigCatalogFromRegistry } from '../../../src/presentation/rigs/RigCatalogFromRegistry.ts';
import { RigRegistry, rigRegistry } from '../../../src/presentation/rigs/rigRegistry.ts';
import { CharacterId } from '../../../src/domain/values/CharacterId.ts';
import { DiskProjectRepository } from '../../../src/infrastructure/disk/DiskProjectRepository.ts';

test('the real catalog exposes the rigs of the registry', () => {
  const catalog = new RigCatalogFromRegistry(rigRegistry);
  assert.ok(catalog.ids().includes('giz'));
  assert.equal(catalog.definition('giz')?.skin?.defaultValue, 'medium');
});

test('an unknown rig has no definition (the repository reports the readable error)', () => {
  const catalog = new RigCatalogFromRegistry(RigRegistry.with([]));
  assert.equal(catalog.definition('robot'), undefined);
  assert.deepEqual(catalog.ids(), []);
});

test('the minimal fixture project loads with the production catalog (giz)', async () => {
  const repository = new DiskProjectRepository({ catalog: new RigCatalogFromRegistry(rigRegistry) });
  const project = await repository.load(fileURLToPath(new URL('../../fixtures/minimal-project', import.meta.url)));
  const ana = project.cast().character(CharacterId.of('ana'));
  assert.equal(ana.rig(), 'giz');
  assert.equal(ana.parameters().outfit, 'hoodie');
  assert.equal(ana.parameters().skin, 'tan');
  assert.equal(ana.parameters().chalk, true, 'the defaults fill what the cast leaves out');
});

// `giz check` loads a project with this catalog: a project whose cast is the example Lia and Téo must load clean.
test('the example cast (Lia and Téo, lia-style) loads with the production catalog', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'giz-example-cast-'));
  try {
    await cp(fileURLToPath(new URL('../../../casts/example', import.meta.url)), join(folder, 'cast'), { recursive: true });
    const project = { version: 2, title: 'Exemplo', format: 'lesson', language: 'pt-BR', aspect: '16:9', captionStyle: 'words', cast: ['lia', 'teo'], voice: { provider: 'qwen', model: '0.6b' } };
    const script = { chapters: ['Abertura'], lines: [{ id: '1', chapter: 1, speaker: 'lia', text: 'Oi, eu sou a Lia.' }, { id: '2', chapter: 1, speaker: 'teo', text: 'E eu sou o Téo.' }] };
    await writeFile(join(folder, 'project.json'), JSON.stringify(project));
    await writeFile(join(folder, 'script.json'), JSON.stringify(script));
    const repository = new DiskProjectRepository({ catalog: new RigCatalogFromRegistry(rigRegistry) });
    const cast = (await repository.load(folder)).cast();
    const lia = cast.character(CharacterId.of('lia'));
    const teo = cast.character(CharacterId.of('teo'));
    assert.equal(lia.rig(), 'lia-style');
    assert.deepEqual([lia.parameters().hoodieColor, lia.parameters().hoodieShade, lia.parameters().emblem], ['#8B3FF5', '#6A22D6', 'star']);
    assert.deepEqual([lia.parameters().browWidth, lia.parameters().browArch, lia.parameters().smile], [7, 7, 30]);
    assert.deepEqual([teo.parameters().hoodieColor, teo.parameters().hoodieShade, teo.parameters().emblem], ['#4F35D9', '#3A22B0', 'code']);
    assert.deepEqual([teo.parameters().browWidth, teo.parameters().browArch, teo.parameters().smile], [10, 2, 24]);
    assert.deepEqual([lia.voice().id, teo.voice().id], ['vivian', 'dylan']);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
