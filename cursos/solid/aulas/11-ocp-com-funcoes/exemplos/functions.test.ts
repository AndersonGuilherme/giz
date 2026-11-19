import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Customer, DiscountContext } from './context.ts';
import { percentOff, isVip, between } from './rules-fn.ts';
import { discount } from './store.ts';
import { discount as combo } from './store.combo.ts';
import { fromConfig, validate } from './from-config.ts';

const ana: Customer = { type: 'regular', birthMonth: 7 };
const bia: Customer = { type: 'vip', birthMonth: 7 };
const caio: Customer = { type: 'employee', birthMonth: 7 };
const march = new Date(2026, 2, 10);
const blackFriday = new Date(2026, 10, 27);
const mothersDay = new Date(2026, 4, 10);
const ctx = (subtotal: number, customer: Customer, now = march, coupon?: string): DiscountContext =>
  ({ subtotal, customer, now, coupon });

test('fábricas: regra pronta a partir da configuração', () => {
  const vip = percentOff(0.1, isVip);
  assert.equal(vip(ctx(10000, bia)), 1000);
  assert.equal(vip(ctx(10000, ana)), 0);
  assert.equal(percentOff(0.15, between('2026-05-04', '2026-05-10'))(ctx(10000, ana, mothersDay)), 1500);
});

test('mesmos valores da aula 10, só com funções', () => {
  assert.equal(discount(ctx(10000, bia, march, 'BEMVINDO')), 2500);
  assert.equal(discount(ctx(40000, bia, march, 'BEMVINDO')), 4000);
  assert.equal(discount(ctx(10000, caio, mothersDay)), 3000);
  assert.equal(discount(ctx(2000, ana, march, 'BEMVINDO')), 2000);
});

test('política nova: cupom acumula com Black Friday', () => {
  assert.equal(discount(ctx(10000, ana, blackFriday, 'BEMVINDO')), 2500);
  assert.equal(combo(ctx(10000, ana, blackFriday, 'BEMVINDO')), 4500);
  assert.equal(combo(ctx(10000, caio, blackFriday, 'BEMVINDO')), 4500);
});

test('tabela (JSON) dá os mesmos valores do código', () => {
  const fromJson = fromConfig(JSON.parse(readFileSync(new URL('./promotions.json', import.meta.url), 'utf8')));
  for (const c of [ctx(10000, bia, march, 'BEMVINDO'), ctx(40000, bia), ctx(10000, ana, mothersDay),
    ctx(10000, ana, blackFriday), ctx(2000, ana, march, 'BEMVINDO')]) {
    assert.equal(fromJson(c), discount(c));
  }
});

test('validação barra linha com erro de digitação', () => {
  assert.throws(() => validate({ name: 'Dia das Mães', percent: 150 }), /fora de 1 a 100/);
  assert.throws(() => validate({ name: 'X', percent: 10, fixed: 500 }), /percent OU fixed/);
  assert.throws(() => validate({ name: 'Y', fixed: 25.5 }), /centavos/);
});
