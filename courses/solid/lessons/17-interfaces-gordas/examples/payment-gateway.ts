// A interface que todo provedor de pagamento implementa. Cresceu a cada provedor novo. Valores em centavos.
export type Status = 'authorized' | 'pending' | 'paid' | 'canceled' | 'refunded';
export type Charge = { id: string; orderId: string; amount: number; status: Status; qrCode?: string };
export type Refund = { chargeId: string; amount: number };
export type Boleto = { orderId: string; barcode: string; dueDate: string };
export type Dispute = { chargeId: string; evidence: string };

export interface PaymentGateway {
  // cartão (o primeiro provedor)
  charge(orderId: string, amount: number): Charge;
  capture(chargeId: string): Charge;
  cancel(chargeId: string): Charge;
  refund(chargeId: string, amount: number): Refund;
  getStatus(chargeId: string): Status;
  chargeInInstallments(orderId: string, amount: number, installments: number): Charge;
  disputeChargeback(chargeId: string, evidence: string): Dispute;
  // entrou com o boleto
  issueBoleto(orderId: string, amount: number, dueDate: string): Boleto;
  // entrou com o Pix
  createPixQrCode(orderId: string, amount: number): string;
}
