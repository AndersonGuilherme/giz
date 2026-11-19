// Mostrado na tela: o pedido "Black Friday passa a 35%" aplicado nas duas versões.
// A passa; B falha de propósito (a regra "vale o maior" estava espalhada em exceções).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PriceCalculator as A } from './pedido-bf35/price-calculator-a.ts';
import { PriceCalculator as B } from './pedido-bf35/price-calculator.ts';

const items = [{ price: 10000, quantity: 1 }];
const employee = { id: 'c', email: 'c@exemplo.com', type: 'employee' as const };
const blackFriday = new Date(2026, 10, 27);

test('A: funcionário na BF leva 35%', () => {
  assert.equal(new A().quote(items, employee, blackFriday).discount, 3500);
});

test('B: funcionário na BF leva 35%', () => {
  assert.equal(new B().quote(items, employee, blackFriday).discount, 3500);
});
