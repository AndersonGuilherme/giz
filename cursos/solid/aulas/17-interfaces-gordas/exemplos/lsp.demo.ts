// Mostrado na tela: o despacho, escrito para "qualquer PaymentGateway", recebe um pedido pago com Pix.
// O compilador aceita; em execução, quebra. Falha de propósito.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PixGateway } from './pix-gateway.ts';
import { onShipped } from './on-shipped.ts';

test('despachar pedido pago com Pix', () => {
  const pix = new PixGateway();
  const c = pix.charge('p3', 5000);
  pix.confirm(c.id);
  assert.equal(onShipped(pix, c.id), 'paid');
});
