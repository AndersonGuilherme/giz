// O checkout de depois, testado sem banco e sem chave: qualquer objeto que cumpra a porta serve.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from './depois/domain/order-service.ts';
import type { PlacedOrder } from './depois/domain/ports.ts';

const tuesday = new Date('2026-11-17T12:00:00Z');
const order = { items: [{ price: 30000, quantity: 1 }], shippingMethod: 'standard' as const };

test('VIP ganha 10% (sem banco, sem e-mail)', async () => {
  const saved: PlacedOrder[] = [];
  const sent: number[] = [];
  const service = new OrderService(
    { save: async (o) => { saved.push(o); return saved.length; } },
    { orderConfirmed: async (_email, total) => { sent.push(total); } },
  );
  const { id, total } = await service.checkout(order, { email: 'ana@exemplo.com', kind: 'vip' }, tuesday);
  assert.equal(total, 27000);
  assert.equal(id, 1);
  assert.deepEqual(saved, [{ email: 'ana@exemplo.com', total: 27000, discount: 3000 }]);
  assert.deepEqual(sent, [27000]);
});
