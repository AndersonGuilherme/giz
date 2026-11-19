import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CreditCardPayment } from './payment.ts';
import { placeOrder, shipOrder, cancelOrder } from './orders.ts';

test('cartão: cancelar antes do envio não cobra nada', () => {
  const p = new CreditCardPayment(4000);
  placeOrder(p);
  cancelOrder(p);
  assert.equal(p.charged - p.refunded, 0);
});

test('cartão: cancelar depois do envio devolve tudo', () => {
  const p = new CreditCardPayment(4000);
  placeOrder(p);
  shipOrder(p);
  cancelOrder(p);
  assert.equal(p.refunded, 4000);
});
