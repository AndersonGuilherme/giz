// Mostrado na tela: o job novo, escrito só com a classe base, encontra um boleto. Falha de propósito.
// Rodar: node --test jobs.demo.ts
import { test } from 'node:test';
import { CreditCardPayment } from './loja/payment.ts';
import { BoletoPayment } from './loja/methods.ts';
import { captureShipped } from './loja/jobs.ts';

test('job da noite captura os pedidos enviados', () => {
  const card = new CreditCardPayment(5000), boleto = new BoletoPayment(5000);
  card.authorize(); boleto.authorize();
  captureShipped([card, boleto], new Date(2026, 0, 1));
});
