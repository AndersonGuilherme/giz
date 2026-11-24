import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shippingFor } from './shipping.ts';

test('frete grátis a partir de R$ 200 (função extraída)', () => {
  assert.equal(shippingFor('standard', 21000), 0);
});
