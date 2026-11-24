// Adaptador do Pix (simulado em memória). Cobra e estorna; não promete o que não faz.
// A cobrança nasce pendente com o QR e vira paga quando o banco avisa (webhook).
import type { Charge, Refund, Status } from './payment-types.ts';
import type { Charges, Refunds } from './roles.ts';
import { Ledger } from './ledger.ts';

export class PixGateway implements Charges, Refunds {
  private ledger = new Ledger('pix');

  charge(orderId: string, amount: number): Charge {
    const qrCode = this.createQrCode(orderId, amount);
    return this.ledger.add({ orderId, amount, status: 'pending', qrCode });
  }
  getStatus(chargeId: string): Status { return this.ledger.find(chargeId).status; }
  refund(chargeId: string, amount: number): Refund {
    this.ledger.move(chargeId, 'paid', 'refunded');
    return { chargeId, amount };
  }

  // webhook do banco: o cliente pagou o QR
  confirm(chargeId: string): void { this.ledger.move(chargeId, 'pending', 'paid'); }
  private createQrCode(orderId: string, amount: number): string { return `pix:${orderId}:${amount}`; }
}
