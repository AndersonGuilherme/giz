// Dublê do gateway para testar o checkout. O tipo exige os nove métodos.
import type { Boleto, Charge, Dispute, PaymentGateway, Refund, Status } from './payment-gateway.ts';

export class FakeGateway implements PaymentGateway {
  calls: Array<{ orderId: string; amount: number }> = [];

  charge(orderId: string, amount: number): Charge {
    this.calls.push({ orderId, amount });
    return { id: 'fake-1', orderId, amount, status: 'paid' };
  }
  capture(): Charge { throw new Error('não usado no teste'); }
  cancel(): Charge { throw new Error('não usado no teste'); }
  refund(): Refund { throw new Error('não usado no teste'); }
  getStatus(): Status { throw new Error('não usado no teste'); }
  chargeInInstallments(): Charge { throw new Error('não usado no teste'); }
  disputeChargeback(): Dispute { throw new Error('não usado no teste'); }
  issueBoleto(): Boleto { throw new Error('não usado no teste'); }
  createPixQrCode(): string { throw new Error('não usado no teste'); }
}
