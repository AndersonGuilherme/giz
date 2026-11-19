// As regras de política sozinhas: não importam nada, não precisam de banco nem de chave.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discountFor } from './domain/pricing.ts';
import { shippingFor } from './domain/shipping.ts';

const tuesday = new Date('2026-11-17T12:00:00Z');
const blackFriday = new Date('2026-11-27T12:00:00Z');

test('VIP ganha 10%', () => assert.equal(discountFor('vip', 30000, tuesday), 3000));
test('descontos não acumulam: vale o maior', () => {
  assert.equal(discountFor('vip', 30000, blackFriday), 6000);
  assert.equal(discountFor('employee', 30000, blackFriday), 9000);
});
test('frete grátis a partir de R$ 200 de subtotal', () => {
  assert.equal(shippingFor('standard', 20000), 0);
  assert.equal(shippingFor('standard', 19990), 2000);
});
