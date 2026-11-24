// Mostrado na tela: a tela do atendimento recebe um Pix com 120 dias. Falha de propósito.
// Rodar: node --test support.demo.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PixPayment } from './pix.ts';
import { refundFromSupport } from './support.ts';

test('atendimento estorna um Pix de 120 dias atrás', () => {
  const pix = new PixPayment(8000);
  pix.authorize();
  pix.capture(new Date(2026, 0, 1));
  assert.equal(refundFromSupport(pix, 8000, new Date(2026, 4, 1)), 'Estornado: R$ 80,00');
});
