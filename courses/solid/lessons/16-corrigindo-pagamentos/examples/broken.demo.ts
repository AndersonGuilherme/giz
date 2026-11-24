// Mostrado na tela: alguém declara Refundable e deixa o estorno vazio de novo. Falha de propósito.
// Rodar: node --test broken.demo.ts
import type { Refundable } from './payment.ts';
import { refundableContract } from './contract.ts';

const emptyRefund = (): Refundable => ({
  refunded: 0,
  policy: 'Estorno pelo atendimento',
  canRefund: () => true,
  refund: () => {}, // "o financeiro faz à mão"
});

refundableContract('cartão-presente promocional', emptyRefund);
