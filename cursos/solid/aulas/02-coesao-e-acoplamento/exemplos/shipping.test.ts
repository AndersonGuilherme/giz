import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetInfra, db, mailer } from './infra.ts';
import { shippingFor } from './shipping.ts';
import { previewShipping } from './cart-preview.ts';
import { OrderService as Before } from './order-service.before.ts';
import { OrderService as After } from './order-service.after.ts';

const ana = { id: 'c1', email: 'ana@exemplo.com', type: 'regular' as const };
const blackFriday = new Date(2026, 10, 27);
const order210 = { items: [{ price: 10500, quantity: 2 }], shippingMethod: 'standard' as const };

beforeEach(resetInfra);

test('frete grátis vem do subtotal, antes do desconto', () => {
  assert.equal(shippingFor('standard', 21000), 0);
  assert.equal(shippingFor('standard', 19999), 2000);
  assert.equal(shippingFor('express', 50000), 3500);
  assert.equal(shippingFor('pickup', 100), 0);
});

test('carrinho consulta o frete sem gravar pedido nem mandar e-mail', () => {
  assert.equal(previewShipping('standard', 21000), 0);
  assert.equal(db.rows.length, 0);
  assert.equal(mailer.outbox.length, 0);
});

test('checkout na Black Friday: R$ 210 continua com frete grátis', () => {
  assert.equal(new After().checkout(order210, ana, blackFriday).shipping, 0);
});

test('antes da extração, o mesmo pedido pagava frete (o bug da aula 01)', () => {
  assert.equal(new Before().checkout(order210, ana, blackFriday).shipping, 2000);
});
