// Depois da extração, o preço ganha teste próprio: sem banco, sem e-mail, sem pedido.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PriceCalculator } from './price-calculator.ts';

const prices = new PriceCalculator();
const items = [{ price: 10000, quantity: 1 }];
const customer = (type: 'regular' | 'vip' | 'employee') => ({ id: 'c', email: 'c@exemplo.com', type });

test('desconto não acumula: na Black Friday vale o maior', () => {
  const bf = new Date(2026, 10, 27);
  assert.equal(prices.quote(items, customer('vip'), bf).discount, 2000);
  assert.equal(prices.quote(items, customer('employee'), bf).discount, 3000);
  assert.equal(prices.quote(items, customer('regular'), bf).discount, 2000);
});
