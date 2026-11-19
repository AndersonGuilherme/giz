// Demo (falha de propósito): o mock esperava a economia do VIP, mas na Black Friday vale o maior desconto.
import { test } from 'node:test';
import { OrderService } from './domain/order-service.ts';
import { stubRepository } from './doubles.ts';
import { MockNotifier } from './doubles-calls.ts';

test('VIP na Black Friday: o e-mail mostra a economia', async () => {
  const mock = new MockNotifier('ana@exemplo.com', 24000, 3000);
  const cart = { items: [{ price: 30000, quantity: 1 }], shippingMethod: 'standard' as const };
  const ana = { email: 'ana@exemplo.com', kind: 'vip' as const };
  await new OrderService(stubRepository(1), mock).checkout(cart, ana, new Date('2026-11-27T12:00:00Z'));
  mock.verify();
});
