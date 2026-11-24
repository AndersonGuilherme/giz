// As duas montagens (à mão e com container) entregam o mesmo serviço funcionando.
import './test-env.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compose as byHand } from './main.ts';
import { compose as byContainer } from './main-container.ts';

const order = { items: [{ price: 30000, quantity: 1 }], shippingMethod: 'standard' as const };
const ana = { email: 'ana@exemplo.com', kind: 'vip' as const };
const tuesday = new Date('2026-11-17T12:00:00Z');

test('raiz de composição à mão: checkout funciona', async () => {
  const { total } = await byHand().orderService.checkout(order, ana, tuesday);
  assert.equal(total, 27000);
});
test('com container: o mesmo resultado', async () => {
  const { total } = await byContainer().orderService.checkout(order, ana, tuesday);
  assert.equal(total, 27000);
});
