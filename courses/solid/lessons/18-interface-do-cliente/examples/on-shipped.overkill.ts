// Segregação demais: uma interface por método, mesmo quando o cliente sempre usa os dois juntos.
import type { Charge, Status } from './payment-types.ts';
import { CardGateway } from './card-gateway.ts';

export interface Capture { capture(chargeId: string): Charge; }
export interface Cancel { cancel(chargeId: string): Charge; }

export function onShipped(capturer: Capture, canceler: Cancel, chargeId: string, inStock: boolean): Status {
  return inStock ? capturer.capture(chargeId).status : canceler.cancel(chargeId).status;
}

// quem monta o despacho:
const card = new CardGateway();
const c = card.charge('p1', 21000);
onShipped(card, card, c.id, true);
