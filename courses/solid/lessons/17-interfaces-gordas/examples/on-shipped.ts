// Quando o pedido sai do estoque, a loja captura o valor que foi autorizado na compra.
import type { PaymentGateway, Status } from './payment-gateway.ts';

export function onShipped(gateway: PaymentGateway, chargeId: string): Status {
  const charge = gateway.capture(chargeId);
  return charge.status;
}
