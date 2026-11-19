// Quem usa: o fluxo do pedido, o atendimento e o comprovante, sem perguntar o tipo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creditCard, pix, boleto, giftCard } from './methods.ts';
import { digitalWallet } from './wallet.ts';
import { shipOrder, cancelOrder } from './orders.ts';
import { refundFromSupport, refundPolicy } from './support.ts';
import { day } from './contract.ts';

const fresh = () => ({ payouts: [] as string[] });

test('envio: funciona com os cinco pagamentos, sem instanceof', () => {
  const l = fresh(), card = { balance: 10000 };
  const all = [creditCard(5000, l), pix(5000, day(0), l), boleto(5000, day(0), l), giftCard(5000, card), digitalWallet(5000, l)];
  for (const p of all) assert.doesNotThrow(() => shipOrder(p, day(1)));
});

test('cartão: cancelar antes do envio só libera a reserva', () => {
  const l = fresh();
  assert.equal(cancelOrder(creditCard(5000, l), day(0)), 'reserva liberada');
  assert.deepEqual(l.payouts, []);
});

test('boleto: dois cliques no atendimento não agendam duas transferências', () => {
  const l = fresh(), p = boleto(8000, day(0), l);
  assert.equal(refundFromSupport(p, 8000, day(1)), 'Estornado: R$ 80,00');
  assert.equal(refundFromSupport(p, 8000, day(1)), 'Fora do contrato: oferecer crédito na loja');
  assert.deepEqual(l.payouts, ['transferência agendada: 8000']);
});

test('pix: aos 120 dias o atendimento oferece crédito, sem quebrar', () => {
  const p = pix(8000, day(0), fresh());
  assert.equal(refundFromSupport(p, 8000, day(120)), 'Fora do contrato: oferecer crédito na loja');
});

test('cartão-presente: não finge estornar', () => {
  const p = giftCard(5000, { balance: 10000 });
  assert.equal(p.refunds, undefined);
  assert.equal(cancelOrder(p, day(1)), 'crédito na loja');
});

test('comprovante: a política vem do contrato, não do nome da classe', () => {
  const l = fresh();
  assert.equal(refundPolicy(pix(5000, day(0), l)), 'Estorno em até 90 dias');
  assert.equal(refundPolicy(digitalWallet(5000, l)), 'Estorno em até 180 dias');
  assert.equal(refundPolicy(giftCard(5000, { balance: 10000 })), 'Sem estorno: crédito na loja');
});
