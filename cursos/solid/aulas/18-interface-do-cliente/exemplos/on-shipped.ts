// No despacho: com o item em estoque, captura; se faltou, cancela a autorização (o cliente não paga).
import type { Status } from './payment-types.ts';
import type { Captures } from './roles.ts';

export function onShipped(gateway: Captures, chargeId: string, inStock: boolean): Status {
  return inStock ? gateway.capture(chargeId).status : gateway.cancel(chargeId).status;
}
