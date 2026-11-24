// Os testes unitários de cada peça da versão B, DEPOIS da Black Friday de 35%. Todos passam:
// cada peça está certa sozinha; o erro (funcionário com 30%) mora entre elas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlackFridayDiscount } from './pedido-bf35/black-friday-discount.ts';
import { EmployeeDiscount } from './fragmentado/employee-discount.ts';
import { RateSum } from './fragmentado/rate-sum.ts';
import { DiscountApplier } from './fragmentado/discount-applier.ts';
import type { Customer } from './types.ts';

const who = (type: Customer['type']): Customer => ({ id: 'c', email: 'c@exemplo.com', type });
const blackFriday = new Date(2026, 10, 27);

test('BlackFriday: cliente comum leva 35%', () => {
  assert.equal(new BlackFridayDiscount().rate(who('regular'), blackFriday), 0.35);
});
test('Employee: funcionário leva 30%', () => {
  assert.equal(new EmployeeDiscount().rate(who('employee')), 0.3);
});
test('RateSum: soma as taxas', () => {
  assert.equal(new RateSum().total([0.3, 0]), 0.3);
});
test('Applier: arredonda ao centavo', () => {
  assert.equal(new DiscountApplier().apply(10000, 0.3), 3000);
});
