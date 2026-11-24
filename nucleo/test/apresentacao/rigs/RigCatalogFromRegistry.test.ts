import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RigCatalogFromRegistry } from '../../../src/apresentacao/rigs/RigCatalogFromRegistry.ts';
import { RigRegistry, rigRegistry } from '../../../src/apresentacao/rigs/rigRegistry.ts';

test('the real catalog exposes the rigs of the registry', () => {
  const catalog = new RigCatalogFromRegistry(rigRegistry);
  assert.ok(catalog.ids().includes('ball-head'));
  assert.equal(catalog.definicao('ball-head')?.headColor?.padrao, '#151515');
});

test('an unknown rig has no definition (the repository reports the readable error)', () => {
  const catalog = new RigCatalogFromRegistry(RigRegistry.with([]));
  assert.equal(catalog.definicao('robot'), undefined);
  assert.deepEqual(catalog.ids(), []);
});
