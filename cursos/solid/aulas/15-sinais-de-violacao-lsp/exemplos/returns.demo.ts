// Mostrado na tela: devolução de produto pago com cartão-presente. Falha de propósito.
// Rodar: node --test returns.demo.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GiftCardPayment } from './loja/methods.ts';
import { returnProduct } from './loja/returns.ts';

test('devolução de cartão-presente devolve R$ 50', () => {
  const gift = new GiftCardPayment(5000);
  gift.authorize(); gift.capture(new Date(2026, 0, 1));
  assert.equal(returnProduct(gift, 5000, new Date(2026, 0, 2)).refunded, 5000);
});
