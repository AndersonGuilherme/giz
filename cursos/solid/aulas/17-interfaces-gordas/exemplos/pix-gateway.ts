// Adaptador do Pix (simulado em memória). Pix não autoriza antes: a cobrança nasce pendente com o QR
// e vira paga quando o banco avisa (webhook).
import type { Boleto, Charge, Dispute, PaymentGateway, Refund, Status } from './payment-gateway.ts';
import { Ledger } from './ledger.ts';

export class PixGateway implements PaymentGateway {
  private ledger = new Ledger('pix');

  charge(orderId: string, amount: number): Charge {
    const qrCode = this.createPixQrCode(orderId, amount);
    return this.ledger.add({ orderId, amount, status: 'pending', qrCode });
  }
  refund(chargeId: string, amount: number): Refund {
    this.ledger.move(chargeId, 'paid', 'refunded');
    return { chargeId, amount };
  }
  getStatus(chargeId: string): Status { return this.ledger.find(chargeId).status; }
  createPixQrCode(orderId: string, amount: number): string { return `pix:${orderId}:${amount}`; }
  capture(): Charge { throw new Error('não suportado no Pix: capture'); }
  cancel(): Charge { throw new Error('não suportado no Pix: cancel'); }
  chargeInInstallments(): Charge { throw new Error('não suportado no Pix: chargeInInstallments'); }
  disputeChargeback(): Dispute { throw new Error('não suportado no Pix: disputeChargeback'); }
  issueBoleto(): Boleto { throw new Error('não suportado no Pix: issueBoleto'); }

  // webhook do banco: o cliente pagou o QR
  confirm(chargeId: string): void { this.ledger.move(chargeId, 'pending', 'paid'); }
}
