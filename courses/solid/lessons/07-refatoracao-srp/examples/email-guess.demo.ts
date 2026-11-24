// Mostrado na tela: o primeiro teste do e-mail, escrito "de cabeça". Falha de propósito.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mailer } from './infra.ts';
import { OrderService } from './order-service.step0.ts';

test('texto do e-mail', () => {
  const vip = { id: 'c1', email: 'ana@exemplo.com', type: 'vip' as const };
  const order = { items: [{ price: 10490, quantity: 2 }], shippingMethod: 'standard' as const };
  new OrderService().checkout(order, vip, new Date(2026, 9, 10));
  const [firstPart] = mailer.outbox[0].body.split(' (');
  assert.equal(firstPart, 'Pedido confirmado! Total: R$ 188,82');
});
