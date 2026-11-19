// Adaptador do cartão (simulado em memória). Cartão autoriza na compra e captura no despacho.
import type { Boleto, Charge, Dispute, PaymentGateway, Refund, Status } from './payment-gateway.ts';
import { Ledger } from './ledger.ts';

export class CardGateway implements PaymentGateway {
  private ledger = new Ledger('card');

  charge(orderId: string, amount: number): Charge {
    return this.ledger.add({ orderId, amount, status: 'authorized' });
  }
  capture(chargeId: string): Charge { return this.ledger.move(chargeId, 'authorized', 'paid'); }
  cancel(chargeId: string): Charge { return this.ledger.move(chargeId, 'authorized', 'canceled'); }
  refund(chargeId: string, amount: number): Refund {
    this.ledger.move(chargeId, 'paid', 'refunded');
    return { chargeId, amount };
  }
  getStatus(chargeId: string): Status { return this.ledger.find(chargeId).status; }
  chargeInInstallments(orderId: string, amount: number, installments: number): Charge {
    if (installments < 2 || installments > 12) throw new Error('parcelas: de 2 a 12');
    return this.charge(orderId, amount);
  }
  disputeChargeback(chargeId: string, evidence: string): Dispute {
    this.ledger.find(chargeId);
    return { chargeId, evidence };
  }
  issueBoleto(): Boleto { throw new Error('não suportado no cartão: issueBoleto'); }
  createPixQrCode(): string { throw new Error('não suportado no cartão: createPixQrCode'); }
}
