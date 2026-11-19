// Mostrado na tela: a regra do marketing contra a versão com o else if novo. Falha de propósito.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PriceCalculator } from './price-calculator.v2.ts';

test('VIP aniversariante ganha 15%', () => {
  const vip = { type: 'vip' as const, birthMonth: 3 };
  const discount = new PriceCalculator().discount(10000, vip, new Date(2026, 2, 10));
  assert.equal(discount, 1500);
});
