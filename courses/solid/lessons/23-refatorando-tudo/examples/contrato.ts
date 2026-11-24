// A REDE DE PROTEÇÃO: as regras da loja escritas como testes, rodadas contra CADA versão do checkout.
// Refatorar = mudar a estrutura sem mudar o comportamento. Se um passo deixar algum vermelho, ele volta.
import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetInfra } from './infra.ts';

type Method = 'standard' | 'pickup' | 'express';
type Order = { items: Array<{ price: number; quantity: number }>; shippingMethod: Method };
type Customer = { id: string; email: string; type: 'regular' | 'vip' | 'employee' };
export type Harness = {
  checkout(order: Order, customer: Customer, now: Date): { total: number; shipping: number };
  saved(): unknown[]; // pedidos gravados
  emails(): string[]; // textos enviados
};

const ana: Customer = { id: 'c1', email: 'ana@exemplo.com', type: 'regular' };
const vip: Customer = { ...ana, type: 'vip' };
const employee: Customer = { ...ana, type: 'employee' };
const normalDay = new Date(2026, 9, 10);
const blackFriday = new Date(2026, 10, 27);
const order = (cents: number, shippingMethod: Method): Order => ({ items: [{ price: cents, quantity: 1 }], shippingMethod });

export function checkoutContract(name: string, make: () => Harness) {
  describe(name, () => {
    let h: Harness;
    beforeEach(() => { resetInfra(); h = make(); });

    test('frete grátis: subtotal de R$ 210', () => {
      assert.deepEqual(h.checkout(order(21000, 'standard'), ana, normalDay), { total: 21000, shipping: 0 });
    });
    test('frete grátis vale ANTES do desconto (VIP)', () => {
      assert.deepEqual(h.checkout(order(21000, 'standard'), vip, normalDay), { total: 18900, shipping: 0 });
    });
    test('frete grátis na Black Friday', () => {
      assert.deepEqual(h.checkout(order(21000, 'standard'), ana, blackFriday), { total: 16800, shipping: 0 });
    });
    test('abaixo de R$ 200 paga R$ 20 de frete', () => {
      assert.deepEqual(h.checkout(order(15000, 'standard'), ana, normalDay), { total: 17000, shipping: 2000 });
    });
    test('expresso custa R$ 35 e nunca é grátis', () => {
      assert.equal(h.checkout(order(50000, 'express'), ana, normalDay).shipping, 3500);
    });
    test('descontos não acumulam: vale o maior', () => {
      assert.equal(h.checkout(order(10000, 'pickup'), employee, blackFriday).total, 7000);
      assert.equal(h.checkout(order(10000, 'pickup'), vip, blackFriday).total, 8000);
    });
    test('grava o pedido e manda o e-mail', () => {
      h.checkout(order(10000, 'pickup'), vip, blackFriday);
      assert.equal(h.saved().length, 1);
      assert.deepEqual(h.emails().map((e) => e.replace(/\s/g, ' ')), ['Pedido confirmado! Total: R$ 80,00 (você economizou R$ 20,00)']);
    });
  });
}
