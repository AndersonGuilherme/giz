// Mostrado na tela: o atendimento estorna um boleto e confere a tela. Falha de propósito.
// Rodar: node --test boleto.demo.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BoletoPayment } from './boleto.ts';
import { refundFromSupport } from './support.ts';

test('atendimento estorna R$ 80 de um boleto', () => {
  const boleto = new BoletoPayment(8000);
  boleto.authorize();
  boleto.capture(new Date(2026, 0, 1));
  assert.equal(refundFromSupport(boleto, 8000, new Date(2026, 0, 2)), 'Estornado: R$ 80,00');
});
