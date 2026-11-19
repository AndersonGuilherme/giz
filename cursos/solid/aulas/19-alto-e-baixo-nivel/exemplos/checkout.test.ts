// O mesmo desconto VIP, agora pelo checkout: só passa com banco e chave de e-mail configurados.
import './test-env.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from './domain/order-service.ts';

test('checkout: VIP ganha 10% (precisa de banco e e-mail)', async () => {
  const order = { items: [{ price: 30000, quantity: 1 }], shippingMethod: 'standard' as const };
  const customer = { email: 'ana@exemplo.com', kind: 'vip' as const };
  const { total } = await new OrderService().checkout(order, customer, new Date('2026-11-17T12:00:00Z'));
  assert.equal(total, 27000);
});
