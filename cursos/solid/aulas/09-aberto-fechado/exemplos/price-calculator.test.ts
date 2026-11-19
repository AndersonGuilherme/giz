import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PriceCalculator, type Customer } from './price-calculator.ts';
import { PriceCalculator as EditedCalculator } from './price-calculator.v2.ts';
import { BirthdayPriceCalculator } from './birthday-calculator.ts';
import { PriceCalculator as OpenCalculator } from './price-calculator.open.ts';
import { vip, employee, blackFriday } from './rules.ts';
import { birthday } from './birthday.ts';

const R100 = 10000;
const march = new Date(2026, 2, 10);
const blackFridayDay = new Date(2026, 10, 27);
const ana: Customer = { type: 'regular', birthMonth: 7 };
const bia: Customer = { type: 'vip', birthMonth: 7 };
const caio: Customer = { type: 'employee', birthMonth: 7 };
const vipBirthday: Customer = { type: 'vip', birthMonth: 3 };

test('regras atuais: VIP 10%, funcionário 30%, Black Friday 20%', () => {
  const calc = new PriceCalculator();
  assert.equal(calc.discount(R100, ana, march), 0);
  assert.equal(calc.discount(R100, bia, march), 1000);
  assert.equal(calc.discount(R100, caio, march), 3000);
  assert.equal(calc.discount(R100, ana, blackFridayDay), 2000);
});

test('não acumula: vale o maior', () => {
  const calc = new PriceCalculator();
  assert.equal(calc.discount(R100, bia, blackFridayDay), 2000);
  assert.equal(calc.discount(R100, caio, blackFridayDay), 3000);
});

test('else if novo: VIP aniversariante fica com 10% (o bug)', () => {
  assert.equal(new EditedCalculator().discount(R100, vipBirthday, march), 1000);
});

test('herança: a filha dá 15% ao VIP aniversariante', () => {
  const calc = new BirthdayPriceCalculator();
  assert.equal(calc.discount(R100, vipBirthday, march), 1500);
  assert.equal(calc.discount(R100, caio, march), 3000);
});

test('versão aberta: mesmas regras, mesmos valores', () => {
  const calc = new OpenCalculator([vip, employee, blackFriday]);
  const ctx = (customer: Customer, now: Date) => ({ subtotal: R100, customer, now });
  assert.equal(calc.discount(ctx(ana, march)), 0);
  assert.equal(calc.discount(ctx(bia, march)), 1000);
  assert.equal(calc.discount(ctx(caio, march)), 3000);
  assert.equal(calc.discount(ctx(bia, blackFridayDay)), 2000);
});

test('aniversário entra como arquivo novo', () => {
  const calc = new OpenCalculator([vip, employee, blackFriday, birthday]);
  const ctx = { subtotal: R100, customer: vipBirthday, now: march };
  assert.equal(calc.discount(ctx), 1500);
});
