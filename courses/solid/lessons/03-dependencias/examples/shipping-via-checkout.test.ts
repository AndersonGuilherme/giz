// O teste do frete escrito "pelo checkout". Ele não manda e-mail... mas carrega quem manda.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from './order-service.ts';

test('frete grátis a partir de R$ 200 (via checkout)', () => {
  const order = { items: [{ price: 21000, quantity: 1 }], shippingMethod: 'standard' as const };
  assert.equal(new OrderService().quoteShipping(order), 0);
});
