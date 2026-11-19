// Os testes do próprio cartão-presente: todos passam. O problema não aparece aqui.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GiftCardPayment } from './gift-card.ts';

test('cartão-presente: autorizar debita o saldo', () => {
  const card = { code: 'GIFT-1', balance: 10000 };
  new GiftCardPayment(4000, card).authorize();
  assert.equal(card.balance, 6000);
});

test('cartão-presente: estorno volta para o saldo', () => {
  const card = { code: 'GIFT-1', balance: 10000 };
  const p = new GiftCardPayment(4000, card);
  p.authorize();
  p.capture();
  p.refund(4000);
  assert.equal(card.balance, 10000);
});
