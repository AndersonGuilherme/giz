import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { RigCatalogFromRegistry } from '../../../src/presentation/rigs/RigCatalogFromRegistry.ts';
import { RigRegistry, rigRegistry } from '../../../src/presentation/rigs/rigRegistry.ts';
import { CharacterId } from '../../../src/domain/values/CharacterId.ts';
import { DiskProjectRepository } from '../../../src/infrastructure/disk/DiskProjectRepository.ts';

test('the real catalog exposes the rigs of the registry', () => {
  const catalog = new RigCatalogFromRegistry(rigRegistry);
  assert.ok(catalog.ids().includes('ball-head'));
  assert.equal(catalog.definition('ball-head')?.headColor?.defaultValue, '#151515');
});

test('an unknown rig has no definition (the repository reports the readable error)', () => {
  const catalog = new RigCatalogFromRegistry(RigRegistry.with([]));
  assert.equal(catalog.definition('robot'), undefined);
  assert.deepEqual(catalog.ids(), []);
});

test('the minimal fixture project loads with the production catalog (ball-head)', async () => {
  const repository = new DiskProjectRepository({ catalog: new RigCatalogFromRegistry(rigRegistry) });
  const project = await repository.load(fileURLToPath(new URL('../../fixtures/minimal-project', import.meta.url)));
  const ana = project.cast().character(CharacterId.of('ana'));
  assert.equal(ana.rig(), 'ball-head');
  assert.equal(ana.parameters().outfit, 'tunic');
  assert.equal(ana.parameters().headColor, '#151515');
});
