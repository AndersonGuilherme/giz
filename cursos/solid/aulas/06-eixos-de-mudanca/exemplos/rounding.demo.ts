// Mostrado na tela: o teste do FINANCEIRO depois do commit da COMUNICAÇÃO. Falha de propósito.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from './order-service.changed.ts';
import { vip, normalDay, order } from './fixtures.ts';

test('VIP paga R$ 188,82', () => {
  assert.equal(new OrderService().checkout(order, vip, normalDay).total, 18882);
});
