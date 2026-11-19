// Interfaces de papel: cada uma nasce do que UM cliente chama junto.
import type { Charge, Dispute, Refund, Status } from './payment-types.ts';

export interface Charges { // checkout
  charge(orderId: string, amount: number): Charge;
}
export interface Captures { // despacho: em estoque captura, faltou cancela
  capture(chargeId: string): Charge;
  cancel(chargeId: string): Charge;
}
export interface Refunds { // atendimento: confere o status e estorna
  getStatus(chargeId: string): Status;
  refund(chargeId: string, amount: number): Refund;
}
export interface Installments { // checkout parcelado
  chargeInInstallments(orderId: string, amount: number, installments: number): Charge;
}
export interface Disputes { // financeiro
  disputeChargeback(chargeId: string, evidence: string): Dispute;
}
