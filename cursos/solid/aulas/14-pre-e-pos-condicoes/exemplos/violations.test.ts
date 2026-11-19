// As violações, documentadas (passam porque afirmam o comportamento errado de hoje).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CreditCardPayment } from './payment.ts';
import { PixPayment } from './pix.ts';
import { BoletoPayment } from './boleto.ts';
import { refundFromSupport } from './support.ts';

const jan1 = new Date(2026, 0, 1);
const may1 = new Date(2026, 4, 1); // 120 dias depois

test('cartão: atendimento estorna depois de 120 dias', () => {
  const p = new CreditCardPayment(8000);
  p.authorize(); p.capture(jan1);
  assert.equal(refundFromSupport(p, 8000, may1), 'Estornado: R$ 80,00');
});

test('Pix: pré-condição mais forte, o atendimento quebra aos 120 dias', () => {
  const p = new PixPayment(8000);
  p.authorize(); p.capture(jan1);
  assert.throws(() => refundFromSupport(p, 8000, may1), /90 dias/);
});

test('boleto: pós-condição mais fraca, a tela mostra R$ 0,00', () => {
  const p = new BoletoPayment(8000);
  p.authorize(); p.capture(jan1);
  assert.equal(refundFromSupport(p, 8000, jan1), 'Estornado: R$ 0,00');
});

test('boleto: invariante quebrada, dois cliques agendam R$ 160 de R$ 80', () => {
  const p = new BoletoPayment(8000);
  p.authorize(); p.capture(jan1);
  refundFromSupport(p, 8000, jan1);
  refundFromSupport(p, 8000, jan1);
  assert.deepEqual(p.transfers, [8000, 8000]);
});
