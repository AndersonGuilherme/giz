// Os quatro sinais, documentados. Passam porque afirmam o comportamento de hoje.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CreditCardPayment } from './loja/payment.ts';
import { PixPayment, BoletoPayment, GiftCardPayment } from './loja/methods.ts';
import { shipOrder } from './loja/orders.ts';
import { refundFromSupport } from './loja/support.ts';
import { refundPolicy } from './loja/receipt.ts';
import { captureShipped } from './loja/jobs.ts';
import { returnProduct } from './loja/returns.ts';

const jan1 = new Date(2026, 0, 1);
const may1 = new Date(2026, 4, 1);

test('sinal 1: o envio pergunta o tipo para não capturar boleto', () => {
  const boleto = new BoletoPayment(5000);
  boleto.authorize();
  assert.doesNotThrow(() => shipOrder(boleto, jan1));
});

test('sinal 1: o atendimento tem um caminho para cada tipo', () => {
  const pix = new PixPayment(5000);
  pix.authorize(); pix.capture(jan1);
  assert.equal(refundFromSupport(pix, 5000, may1), 'Pix vencido: oferecer crédito na loja');
  assert.equal(refundFromSupport(new GiftCardPayment(5000), 5000, jan1), 'Abrir chamado no financeiro');
});

test('sinal 1: o comprovante faz switch pelo nome da classe', () => {
  assert.equal(refundPolicy(new PixPayment(5000)), 'Estorno em até 90 dias');
  assert.equal(refundPolicy(new CreditCardPayment(5000)), 'Estorno a qualquer momento');
});

test('sinal 2: o job novo quebra no boleto', () => {
  const card = new CreditCardPayment(5000), boleto = new BoletoPayment(5000);
  card.authorize(); boleto.authorize();
  assert.throws(() => captureShipped([card, boleto], jan1), /não suporta captura/);
});

test('sinal 3: a devolução de cartão-presente marca reembolsado sem devolver nada', () => {
  const gift = new GiftCardPayment(5000);
  gift.authorize(); gift.capture(jan1);
  assert.deepEqual(returnProduct(gift, 5000, jan1), { status: 'reembolsado', refunded: 0 });
});
