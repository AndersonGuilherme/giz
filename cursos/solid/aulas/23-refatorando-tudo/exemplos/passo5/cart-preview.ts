// O carrinho mostra só as opções disponíveis, com o preço de cada uma.
import { allMethods, quoteFor } from './shipping.ts';

export type Cart = { items: Array<{ price: number; quantity: number }>; distanceKm: number };

export function shippingOptions(cart: Cart) {
  const quote = quoteFor(cart.items, cart.distanceKm);
  return allMethods.filter((m) => m.available(quote)).map((m) => ({ id: m.id, price: m.price(quote) }));
}
