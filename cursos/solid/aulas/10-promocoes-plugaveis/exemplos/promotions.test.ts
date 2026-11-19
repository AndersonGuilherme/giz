import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Customer, DiscountContext } from './discount-rule.ts';
import { vip, employee, blackFriday, coupon } from './rules.ts';
import { mothersDay } from './mothers-day.ts';
import { PriceCalculator } from './price-calculator.ts';
import { calculator as before } from './store.v1.ts';
import { calculator } from './store.ts';

const ana: Customer = { type: 'regular', birthMonth: 7 };
const bia: Customer = { type: 'vip', birthMonth: 7 };
const caio: Customer = { type: 'employee', birthMonth: 7 };
const march = new Date(2026, 2, 10);
const ctx = (subtotal: number, customer: Customer, now = march, code?: string): DiscountContext =>
  ({ subtotal, customer, now, coupon: code });

test('cada regra se testa sozinha', () => {
  assert.equal(vip.amount(ctx(10000, bia)), 1000);
  assert.equal(employee.amount(ctx(10000, caio)), 3000);
  assert.equal(blackFriday.amount(ctx(10000, ana, new Date(2026, 10, 27))), 2000);
  assert.equal(coupon('BEMVINDO', 2500).amount(ctx(10000, ana, march, 'BEMVINDO')), 2500);
});

test('não acumula: cupom vence em R$ 100, VIP em R$ 400', () => {
  assert.deepEqual(calculator.bestDiscount(ctx(10000, bia, march, 'BEMVINDO')),
    { name: 'Cupom BEMVINDO', amount: 2500 });
  assert.deepEqual(calculator.bestDiscount(ctx(40000, bia, march, 'BEMVINDO')),
    { name: 'VIP', amount: 4000 });
});

test('desconto nunca passa do subtotal', () => {
  assert.equal(calculator.bestDiscount(ctx(2000, ana, march, 'BEMVINDO')).amount, 2000);
});

test('empate: fica a primeira da lista', () => {
  const calc = new PriceCalculator([vip, coupon('DEZ', 1000)]);
  assert.equal(calc.bestDiscount(ctx(10000, bia, march, 'DEZ')).name, 'VIP');
});

test('Dia das Mães: 15% de 4 a 10 de maio', () => {
  const sunday = new Date(2026, 4, 10, 23, 0);
  assert.equal(mothersDay.amount(ctx(10000, ana, sunday)), 1500);
  assert.equal(mothersDay.amount(ctx(10000, ana, new Date(2026, 4, 11))), 0);
  assert.equal(mothersDay.amount(ctx(10000, ana, new Date(2026, 4, 3))), 0);
});

test('Dia das Mães entra pela lista; o cálculo não muda', () => {
  const may = new Date(2026, 4, 8);
  assert.deepEqual(before.bestDiscount(ctx(10000, bia, may)), { name: 'VIP', amount: 1000 });
  assert.deepEqual(calculator.bestDiscount(ctx(10000, bia, may)), { name: 'Dia das Mães', amount: 1500 });
  assert.deepEqual(calculator.bestDiscount(ctx(10000, caio, may)), { name: 'Funcionário', amount: 3000 });
});
