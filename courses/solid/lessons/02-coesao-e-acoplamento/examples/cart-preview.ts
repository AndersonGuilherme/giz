// O carrinho agora pergunta o frete direto à regra: uma linha, sem pedido, sem e-mail.
import { shippingFor, type ShippingMethod } from './shipping.ts';

export function previewShipping(method: ShippingMethod, subtotal: number): number {
  return shippingFor(method, subtotal);
}
