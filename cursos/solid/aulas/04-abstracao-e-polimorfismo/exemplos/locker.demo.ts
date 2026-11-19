// Mostrado na tela: a regra de negócio (locker custa R$ 9) contra a versão com switch. Falha de propósito.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shippingFor } from './shipping-switch.ts';

test('locker custa R$ 9', () => {
  assert.equal(shippingFor('locker', 5000, 4), 900);
});
