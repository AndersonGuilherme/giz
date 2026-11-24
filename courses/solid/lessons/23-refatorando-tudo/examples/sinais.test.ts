// Os quatro sinais da aula 01, cada um com um teste contra o código final (passo 5).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db, mailer, resetInfra } from './infra.ts';
import { OrderService } from './passo5/order-service.ts';
import { storeRules, type DiscountRule } from './passo5/pricing.ts';
import { allMethods, type ShippingMethod } from './passo5/shipping.ts';
import { shippingOptions } from './passo5/cart-preview.ts';

const ana = { id: 'c1', email: 'ana@exemplo.com', type: 'regular' as const };
const order210 = { items: [{ price: 21000, quantity: 1 }], shippingMethod: 'standard' };
const blackFriday = new Date(2026, 10, 27);
const doubles = () => ({ save() {}, orderConfirmed() {} });
beforeEach(resetInfra);

test('rigidez: frete novo sem editar o checkout', () => {
  const drone: ShippingMethod = { id: 'drone', available: () => true, price: () => 1500 };
  const coupon: DiscountRule = () => 0.15;
  const svc = new OrderService(doubles(), doubles());
  svc.methods = [...allMethods, drone];
  svc.rules = [...storeRules, coupon];
  assert.deepEqual(svc.checkout({ ...order210, shippingMethod: 'drone' }, ana), { total: 19350, shipping: 1500 });
});

test('fragilidade: Black Friday mantém frete grátis', () => {
  const svc = new OrderService(doubles(), doubles());
  assert.equal(svc.checkout(order210, ana, blackFriday).shipping, 0);
});

test('imobilidade: carrinho sem pedido e sem e-mail', () => {
  for (let i = 0; i < 3000; i++) shippingOptions({ items: order210.items, distanceKm: 4 });
  assert.equal(db.rows.length, 0);
  assert.equal(mailer.outbox.length, 0);
});

test('viscosidade: dois dublês de uma linha', () => {
  const sent: number[] = [];
  const svc = new OrderService({ save() {} }, { orderConfirmed: (_to, total) => sent.push(total) });
  svc.checkout(order210, ana);
  assert.deepEqual(sent, [21000]);
});
