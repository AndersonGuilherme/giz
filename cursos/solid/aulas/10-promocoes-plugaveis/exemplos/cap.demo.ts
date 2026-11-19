// Mostrado na tela: cupom de R$ 25 num pedido de R$ 20, contra a calculadora sem teto. Falha de propósito.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PriceCalculator } from './price-calculator.nocap.ts';
import { coupon } from './rules.ts';

test('desconto nunca passa do subtotal', () => {
  const calc = new PriceCalculator([coupon('BEMVINDO', 2500)]);
  const customer = { type: 'regular' as const, birthMonth: 7 };
  const ctx = { subtotal: 2000, customer, now: new Date(), coupon: 'BEMVINDO' };
  assert.equal(calc.bestDiscount(ctx).amount, 2000);
});
