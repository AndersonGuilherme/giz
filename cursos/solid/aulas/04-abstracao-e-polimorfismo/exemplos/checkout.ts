// Quem usa não conhece nenhum método concreto: recebe qualquer um que cumpra a interface.
import type { ShippingMethod, Quote } from './shipping.ts';

export function shippingCost(method: ShippingMethod, quote: Quote): number {
  return method.price(quote);
}
