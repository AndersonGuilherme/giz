import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CardGateway } from './card-gateway.ts';
import { PixGateway } from './pix-gateway.ts';
import { onShipped } from './on-shipped.ts';
import { onShipped as onShippedOverkill } from './on-shipped.overkill.ts';

test('despacho: em estoque captura', () => {
  const card = new CardGateway();
  assert.equal(onShipped(card, card.charge('p1', 21000).id, true), 'paid');
});

test('despacho: faltou no estoque, cancela a autorização', () => {
  const card = new CardGateway();
  assert.equal(onShipped(card, card.charge('p1', 21000).id, false), 'canceled');
});

test('despacho segregado demais: recebe o mesmo objeto duas vezes', () => {
  const card = new CardGateway();
  assert.equal(onShippedOverkill(card, card, card.charge('p1', 21000).id, false), 'canceled');
});

test('atendimento: cartão só estorna o que foi capturado', () => {
  const card = new CardGateway();
  const c = card.charge('p1', 21000);
  assert.throws(() => card.refund(c.id, 21000), /está authorized/);
  card.capture(c.id);
  assert.deepEqual(card.refund(c.id, 21000), { chargeId: c.id, amount: 21000 });
  assert.equal(card.getStatus(c.id), 'refunded');
});

test('Pix: QR gerado por dentro, pago no webhook, estornável', () => {
  const pix = new PixGateway();
  const c = pix.charge('p2', 5000);
  assert.equal(c.qrCode, 'pix:p2:5000');
  pix.confirm(c.id);
  assert.equal(pix.getStatus(c.id), 'paid');
  pix.refund(c.id, 5000);
  assert.equal(pix.getStatus(c.id), 'refunded');
});

test('Pix não tem métodos de enfeite', () => {
  const pix = new PixGateway() as unknown as Record<string, unknown>;
  for (const m of ['capture', 'cancel', 'chargeInInstallments', 'disputeChargeback', 'issueBoleto']) {
    assert.equal(pix[m], undefined);
  }
});
