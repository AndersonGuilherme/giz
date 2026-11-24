import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GiftCardPayment } from './gift-card.ts';
import { placeOrder, cancelOrder } from './orders.ts';

test('cartão-presente: cancelar antes do envio some com R$ 40 (o bug, documentado)', () => {
  const card = { code: 'GIFT-1', balance: 10000 };
  const p = new GiftCardPayment(4000, card);
  placeOrder(p);
  cancelOrder(p);
  assert.equal(card.balance, 6000);
});
