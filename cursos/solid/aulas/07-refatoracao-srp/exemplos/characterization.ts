// Testes de caracterização: registram o que o checkout FAZ hoje (não o que deveria fazer).
// Passam pela porta da frente (checkout), então sobrevivem a qualquer reorganização interna.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetInfra, db, mailer } from './infra.ts';
import type { Order, Customer } from './types.ts';

type Service = new () => { checkout(order: Order, customer: Customer, now?: Date): { total: number; shipping: number } };

const ana: Customer = { id: 'c1', email: 'ana@exemplo.com', type: 'regular' };
const vip: Customer = { ...ana, type: 'vip' };
const normalDay = new Date(2026, 9, 10);
const blackFriday = new Date(2026, 10, 27);
const order = { items: [{ price: 10490, quantity: 2 }], shippingMethod: 'standard' as const };
const order210 = { items: [{ price: 10500, quantity: 2 }], shippingMethod: 'standard' as const };

export function characterize(label: string, Service: Service) {
  beforeEach(resetInfra);

  test(`${label} · VIP: total R$ 188,82`, () => {
    assert.deepEqual(new Service().checkout(order, vip, normalDay), { total: 18882, shipping: 0 });
  });

  test(`${label} · Black Friday: R$ 168, frete grátis`, () => {
    assert.deepEqual(new Service().checkout(order210, ana, blackFriday), { total: 16800, shipping: 0 });
  });

  test(`${label} · grava id do cliente e total`, () => {
    new Service().checkout(order, vip, normalDay);
    assert.deepEqual(db.rows, [{ table: 'orders', data: { customerId: 'c1', total: 18882 } }]);
  });

  test(`${label} · texto exato do e-mail`, () => {
    new Service().checkout(order, vip, normalDay);
    // Copiado da saída real: o toLocaleString põe um espaço INSEPARÁVEL ( ) depois de "R$".
    assert.deepEqual(mailer.outbox, [{
      to: 'ana@exemplo.com',
      body: 'Pedido confirmado! Total: R$ 188,82 (você economizou R$ 20,98)',
    }]);
  });
}
