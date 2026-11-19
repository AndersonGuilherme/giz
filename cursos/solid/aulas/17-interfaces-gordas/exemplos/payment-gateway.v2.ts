// A mesma interface, um mês depois: o time do marketplace precisou dividir o pagamento entre vendedores.
import type { Boleto, Charge, Dispute, Refund, Status } from './payment-gateway.ts';
export type Split = { chargeId: string; sellers: Array<{ sellerId: string; amount: number }> };

export interface PaymentGateway {
  charge(orderId: string, amount: number): Charge;
  capture(chargeId: string): Charge;
  cancel(chargeId: string): Charge;
  refund(chargeId: string, amount: number): Refund;
  getStatus(chargeId: string): Status;
  chargeInInstallments(orderId: string, amount: number, installments: number): Charge;
  disputeChargeback(chargeId: string, evidence: string): Dispute;
  issueBoleto(orderId: string, amount: number, dueDate: string): Boleto;
  createPixQrCode(orderId: string, amount: number): string;
  // entrou com o marketplace
  splitPayment(chargeId: string, sellers: Split['sellers']): Split;
}
