import { test } from 'node:test';
import assert from 'node:assert/strict';
import { payOrder } from './checkout.ts';
import { FakeGateway } from './fake-gateway.ts';

test('checkout cobra o total do pedido', () => {
  const gateway = new FakeGateway();
  const result = payOrder({ id: 'p1', total: 21000 }, gateway);
  assert.deepEqual(gateway.calls, [{ orderId: 'p1', amount: 21000 }]);
  assert.equal(result.status, 'paid');
});

test('checkout recusa pedido sem valor', () => {
  assert.throws(() => payOrder({ id: 'p2', total: 0 }, new FakeGateway()), /sem valor/);
});
