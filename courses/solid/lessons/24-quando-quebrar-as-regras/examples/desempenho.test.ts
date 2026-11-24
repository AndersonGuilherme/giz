// As três versões do laço quente dão o MESMO total. O tempo de cada uma está em bench.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rulesPerItem, rulesOnce, handWritten } from './hot-path.ts';

const prices = new Int32Array(10_000).map((_, i) => 1000 + (i % 5_000));

for (const customer of [{ type: 'regular' as const }, { type: 'vip' as const }, { type: 'employee' as const }]) {
  for (const bf of [false, true]) {
    test(`mesmo total: ${customer.type}, Black Friday ${bf ? 'sim' : 'não'}`, () => {
      const expected = handWritten(prices, customer, bf);
      assert.equal(rulesPerItem(prices, customer, bf), expected);
      assert.equal(rulesOnce(prices, customer, bf), expected);
    });
  }
}
