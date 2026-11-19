import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CardGateway } from './card-gateway.ts';
import { PixGateway } from './pix-gateway.ts';
import { onShipped } from './on-shipped.ts';

test('cartão: autoriza na compra e captura no despacho', () => {
  const card = new CardGateway();
  const c = card.charge('p1', 21000);
  assert.equal(c.status, 'authorized');
  assert.equal(onShipped(card, c.id), 'paid');
});

test('cartão: parcela de 2 a 12 vezes', () => {
  const card = new CardGateway();
  assert.equal(card.chargeInInstallments('p1', 30000, 3).status, 'authorized');
  assert.throws(() => card.chargeInInstallments('p1', 30000, 13), /de 2 a 12/);
});

test('Pix: nasce pendente com QR e vira pago no webhook', () => {
  const pix = new PixGateway();
  const c = pix.charge('p2', 5000);
  assert.equal(c.status, 'pending');
  assert.equal(c.qrCode, 'pix:p2:5000');
  pix.confirm(c.id);
  assert.equal(pix.getStatus(c.id), 'paid');
});

test('Pix: cinco métodos da interface só lançam erro', () => {
  const pix = new PixGateway();
  for (const m of ['capture', 'cancel', 'chargeInInstallments', 'disputeChargeback', 'issueBoleto'] as const) {
    assert.throws(() => (pix[m] as () => unknown)(), /não suportado no Pix/);
  }
});
