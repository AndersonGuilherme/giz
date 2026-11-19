// O MESMO dublê do checkout, sem nenhuma mudança, agora contra a interface v2. NÃO compila de propósito.
import type { Boleto, Charge, Dispute, Refund, Status } from './payment-gateway.ts';
import type { PaymentGateway } from './payment-gateway.v2.ts';

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
