// Passo 3 · LSP: todos os métodos cumprem o contrato, e o carrinho mostra só o que está disponível.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shippingContract } from './contrato-frete.ts';
import { allMethods } from './passo3/shipping.ts';
import { shippingOptions } from './passo3/cart-preview.ts';

shippingContract(allMethods);

test('carrinho a 20 km: o mesmo dia some da lista, sem erro', () => {
  const ids = shippingOptions({ items: [{ price: 5000, quantity: 1 }], distanceKm: 20 }).map((o) => o.id);
  assert.deepEqual(ids, ['pickup', 'standard', 'express', 'locker']);
});
