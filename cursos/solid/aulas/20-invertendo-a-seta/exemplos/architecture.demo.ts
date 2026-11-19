// Demo (falha de propósito): a mesma regra aplicada ao código de antes e à tentação.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { domainImportsOfInfra } from './architecture.ts';

test('antes: o domínio não importa a infra', () => {
  assert.deepEqual(domainImportsOfInfra('antes'), []);
});
test('tentação: o domínio não importa a infra', () => {
  assert.deepEqual(domainImportsOfInfra('tentacao'), []);
});
