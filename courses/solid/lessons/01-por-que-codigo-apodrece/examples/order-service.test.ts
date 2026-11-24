import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetInfra, db, mailer } from './infra.ts';
import { OrderService as V1, type Customer } from './order-service.v1.ts';
import { OrderService as V2 } from './order-service.v2.ts';
import { OrderService as V3 } from './order-service.v3.ts';
import { OrderService as V4 } from './order-service.v4.ts';
import { previewShipping } from './cart-preview.ts';

// Regra da loja: frete grátis para SUBTOTAL a partir de R$ 200, calculado ANTES de qualquer desconto.
const ana: Customer = { id: 'c1', email: 'ana@exemplo.com', type: 'regular' };
const vip: Customer = { ...ana, type: 'vip' };
const normalDay = new Date(2026, 9, 10);
const blackFriday = new Date(2026, 10, 27);
const order210 = { items: [{ price: 10500, quantity: 2 }], shippingMethod: 'standard' as const };

beforeEach(resetInfra);

test('v1: subtotal de R$ 210 tem frete grátis', () => {
  assert.deepEqual(new V1().checkout(order210, ana), { total: 21000, shipping: 0 });
});

test('v1: VIP com subtotal de R$ 210 paga R$ 189 e continua com frete grátis (regra antes do desconto)', () => {
  assert.deepEqual(new V1().checkout(order210, vip), { total: 18900, shipping: 0 });
  assert.match(mailer.outbox[0].body, /Total: R\$\s189,00/);
});

test('v2: frete expresso custa R$ 35 e nunca é grátis', () => {
  assert.equal(new V2().checkout({ ...order210, shippingMethod: 'express' }, ana).shipping, 3500);
});

test('v3 (RIGIDEZ): Black Friday dá 20%, VIP não acumula, e-mail mostra a economia', () => {
  const order = { items: [{ price: 10000, quantity: 1 }], shippingMethod: 'pickup' as const };
  assert.equal(new V3().checkout(order, vip, blackFriday).total, 8000);
  assert.equal(new V3().checkout(order, vip, normalDay).total, 9000);
  assert.match(mailer.outbox[0].body, /economizou R\$\s20,00/);
});

test('v3 (FRAGILIDADE): a regra do frete grátis quebrou — R$ 210 de subtotal agora paga frete', () => {
  // A linha do frete é idêntica à da v2. O que mudou foi o significado de `total`,
  // que agora já vem com desconto: 210 - 20% = 168, abaixo do limite.
  assert.equal(new V3().checkout(order210, ana, blackFriday).shipping, 2000);
  // ...e o mesmo vale para VIP em dia normal: 210 - 10% = 189.
  assert.equal(new V3().checkout(order210, vip, normalDay).shipping, 2000);
});

test('v3 (IMOBILIDADE): só consultar o frete no carrinho grava pedido e manda e-mail', () => {
  previewShipping(order210, ana);
  assert.equal(db.rows.length, 1, 'um pedido fantasma foi gravado');
  assert.match(mailer.outbox[0].body, /^Pedido confirmado!/);
});

test('v4 (VISCOSIDADE): o atalho dryRun evita o pedido fantasma, ao custo de mais um caminho no checkout', () => {
  const r = new V4().checkout(order210, ana, normalDay, true);
  assert.equal(r.shipping, 0);
  assert.equal(db.rows.length, 0);
  assert.equal(mailer.outbox.length, 0);
});
