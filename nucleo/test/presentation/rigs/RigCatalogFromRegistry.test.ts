import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { RigCatalogFromRegistry } from '../../../src/apresentacao/rigs/RigCatalogFromRegistry.ts';
import { RigRegistry, rigRegistry } from '../../../src/apresentacao/rigs/rigRegistry.ts';
import { IdPersonagem } from '../../../src/dominio/valores/IdPersonagem.ts';
import { RepositorioDeProjetoEmDisco } from '../../../src/infraestrutura/disco/RepositorioDeProjetoEmDisco.ts';

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

test('the minimal fixture project loads with the production catalog (ball-head)', async () => {
  const repository = new RepositorioDeProjetoEmDisco({ catalogo: new RigCatalogFromRegistry(rigRegistry) });
  const project = await repository.carregar(fileURLToPath(new URL('../../fixtures/projeto-minimo', import.meta.url)));
  const ana = project.elenco().personagem(IdPersonagem.de('ana'));
  assert.equal(ana.rig(), 'ball-head');
  assert.equal(ana.parametros().outfit, 'tunic');
  assert.equal(ana.parametros().headColor, '#151515');
});
