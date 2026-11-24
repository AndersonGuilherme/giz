// As duas versões dão o MESMO preço hoje. A diferença aparece quando o financeiro pede uma mudança.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PriceCalculator as A } from './price-calculator.ts';
import { PriceCalculator as B } from './fragmentado/price-calculator.ts';
import { PriceCalculator as A35 } from './pedido-bf35/price-calculator-a.ts';
import type { Customer } from './types.ts';

const items = [{ price: 10000, quantity: 1 }];
const who = (type: Customer['type']): Customer => ({ id: 'c', email: 'c@exemplo.com', type });
const normalDay = new Date(2026, 9, 10);
const blackFriday = new Date(2026, 10, 27);

test('hoje, A e B dão o mesmo desconto em todos os casos', () => {
  for (const type of ['regular', 'vip', 'employee'] as const) {
    for (const day of [normalDay, blackFriday]) {
      assert.deepEqual(new B().quote(items, who(type), day), new A().quote(items, who(type), day));
    }
  }
});

test('versão A com Black Friday de 35%: funcionário leva o maior (35%)', () => {
  assert.equal(new A35().quote(items, who('employee'), blackFriday).discount, 3500);
});
