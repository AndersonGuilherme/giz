import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetInfra, db, mailer } from './infra.ts';
import { OrderService, type Customer } from './order-service.ts';
import { changeRequests, byActor, actorsPerSection } from './change-requests.ts';

const vip: Customer = { id: 'c1', email: 'ana@exemplo.com', type: 'vip' };
const normalDay = new Date(2026, 9, 10);
const order = { items: [{ price: 10490, quantity: 2 }], shippingMethod: 'standard' as const };

beforeEach(resetInfra);

test('o checkout ainda faz tudo: preço, frete, gravação e e-mail', () => {
  // Subtotal R$ 209,80 → VIP 10% → R$ 188,82; frete grátis (subtotal ≥ R$ 200, antes do desconto).
  assert.deepEqual(new OrderService().checkout(order, vip, normalDay), { total: 18882, shipping: 0 });
  assert.deepEqual(db.rows[0], { table: 'orders', data: { customerId: 'c1', total: 18882 } });
  assert.match(mailer.outbox[0].body, /Total: R\$\s188,82 \(você economizou R\$\s20,98\)/);
});

test('8 pedidos de mudança vêm de 4 atores', () => {
  assert.equal(changeRequests.length, 8);
  assert.deepEqual([...byActor(changeRequests).keys()], ['Financeiro', 'Logística', 'Comunicação', 'Jurídico']);
});

test('cada trecho do checkout responde a um ator só', () => {
  for (const actors of actorsPerSection(changeRequests).values()) assert.equal(actors.size, 1);
});
