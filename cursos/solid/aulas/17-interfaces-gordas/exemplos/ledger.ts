// Registro em memória das cobranças de um adaptador (simula o lado do provedor).
import type { Charge, Status } from './payment-gateway.ts';

export class Ledger {
  private charges = new Map<string, Charge>();
  private prefix: string;
  constructor(prefix: string) { this.prefix = prefix; }

  add(c: Omit<Charge, 'id'>): Charge {
    const charge: Charge = { id: `${this.prefix}-${this.charges.size + 1}`, ...c };
    this.charges.set(charge.id, charge);
    return charge;
  }
  find(chargeId: string): Charge {
    const c = this.charges.get(chargeId);
    if (!c) throw new Error(`cobrança ${chargeId} não existe`);
    return c;
  }
  move(chargeId: string, from: Status, to: Status): Charge {
    const c = this.find(chargeId);
    if (c.status !== from) throw new Error(`cobrança ${chargeId} está ${c.status}`);
    c.status = to;
    return c;
  }
}
