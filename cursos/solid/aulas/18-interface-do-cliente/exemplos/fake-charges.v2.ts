// O MESMO dublê, compilado contra os papéis depois que entrou Splits (marketplace).
import type { Charge } from './payment-types.ts';
import type { Charges } from './roles.v2.ts';

export class FakeCharges implements Charges {
  calls: Array<{ orderId: string; amount: number }> = [];

  charge(orderId: string, amount: number): Charge {
    this.calls.push({ orderId, amount });
    return { id: 'fake-1', orderId, amount, status: 'paid' };
  }
}
