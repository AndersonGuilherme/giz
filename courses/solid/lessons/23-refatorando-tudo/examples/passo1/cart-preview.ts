// O carrinho pergunta o frete direto para a regra de frete: sem pedido, sem e-mail, sem dryRun.
import { shippingFor, type ShippingMethod } from './shipping.ts';

export type Cart = { items: Array<{ price: number; quantity: number }>; shippingMethod: ShippingMethod };

export function previewShipping(cart: Cart): number {
  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return shippingFor(cart.shippingMethod, subtotal);
}
