import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taxFor } from './tax.ts';
import { taxFor as taxByState } from './tax.v2.ts';
import { TaxService } from './plugins/v1/tax-service.ts';
import { TaxPluginRegistry } from './plugins/v1/registry.ts';
import { defaultTaxPlugin } from './plugins/v1/default.ts';
import { TaxService as TaxServiceV2 } from './plugins/v2/tax-service.ts';

const items = [
  { sku: 'caneca', category: 'casa', amount: 6000 },
  { sku: 'camiseta', category: 'roupa', amount: 4000 },
];

test('hoje: plugins e função simples dão o mesmo imposto', () => {
  assert.equal(new TaxService().taxFor(items), 500);
  assert.equal(taxFor(10000), 500);
});

test('o custo de manter: testes da máquina de plugins', () => {
  const registry = new TaxPluginRegistry();
  registry.register(defaultTaxPlugin);
  assert.throws(() => registry.register(defaultTaxPlugin), /duplicado/);
  registry.register({ id: 'livros', priority: 10, appliesTo: (i) => i.category === 'livro', rate: () => 0 });
  assert.equal(registry.resolve({ sku: 'x', category: 'livro', amount: 100 }).id, 'livros');
  registry.unregister('default');
  assert.throws(() => registry.resolve(items[0]), /nenhum plugin/);
});

test('mudança real: imposto por estado de destino', () => {
  assert.equal(taxByState(10000, 'SP'), 700);
  assert.equal(taxByState(10000, 'RJ'), 800);
  assert.equal(taxByState(10000, 'BA'), 500);
});

test('plugins v2: mesmo resultado, depois de mudar 4 arquivos', () => {
  assert.equal(new TaxServiceV2().taxFor(items, 'SP'), 700);
  assert.equal(new TaxServiceV2().taxFor(items, 'BA'), 500);
});
