// Quando o pedido sai do estoque, a loja captura o valor que foi autorizado na compra.
import type { PaymentGateway, Status } from './payment-gateway.ts';
import { PixGateway } from './pix-gateway.ts';

export function onShipped(gateway: PaymentGateway, chargeId: string): Status {
  if (gateway instanceof PixGateway) return gateway.getStatus(chargeId);
  const charge = gateway.capture(chargeId);
  return charge.status;
}
