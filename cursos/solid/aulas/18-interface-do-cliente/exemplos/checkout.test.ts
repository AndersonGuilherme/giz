import { test } from 'node:test';
import assert from 'node:assert/strict';
import { payOrder } from './checkout.ts';
import { FakeCharges } from './fake-charges.ts';
import { PixGateway } from './pix-gateway.ts';

test('checkout cobra o total do pedido', () => {
  const charges = new FakeCharges();
  const result = payOrder({ id: 'p1', total: 21000 }, charges);
  assert.deepEqual(charges.calls, [{ orderId: 'p1', amount: 21000 }]);
  assert.equal(result.status, 'paid');
});

test('checkout recusa pedido sem valor', () => {
  assert.throws(() => payOrder({ id: 'p2', total: 0 }, new FakeCharges()), /sem valor/);
});

test('checkout com Pix: cobrança nasce pendente', () => {
  assert.equal(payOrder({ id: 'p3', total: 5000 }, new PixGateway()).status, 'pending');
});
