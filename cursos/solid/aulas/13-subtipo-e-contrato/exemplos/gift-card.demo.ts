// Mostrado na tela: a mesma regra do cartão ("cancelar antes do envio não cobra nada")
// aplicada ao cartão-presente. Falha de propósito.
// Rodar: node --test gift-card.demo.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GiftCardPayment } from './gift-card.ts';
import { placeOrder, cancelOrder } from './orders.ts';

test('cancelar antes do envio devolve o saldo', () => {
  const card = { code: 'GIFT-1', balance: 10000 };
  const p = new GiftCardPayment(4000, card);
  placeOrder(p);
  cancelOrder(p);
  assert.equal(card.balance, 10000);
});
