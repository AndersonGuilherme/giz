// A seta vigiada: nenhum arquivo do domínio pode importar a infra.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { domainImportsOfInfra } from './architecture.ts';

test('depois: o domínio não importa a infra', () => {
  assert.deepEqual(domainImportsOfInfra('depois'), []);
});
